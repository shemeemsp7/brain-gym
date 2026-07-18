// backend/components/GamePage.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { fetchChallenge, fetchFeedback, fetchClarification, saveUserChallenge } from "../src/challenge/apiService";
import { INTEGRITY_MESSAGES, pickMessage } from "../src/integrity/messages";

const COPY_TOAST_SESSION_KEY = "bg_copy_toast_shown";
const PASTE_CONFIRM_THRESHOLD = 80; // chars — smaller pastes (a variable name, a fragment) never nag

// (Full GamePage implementation below)
function GamePage({ user, level, onChallengeComplete, onChallengeActive, resumeChallengeData, onChallengeSaved }) {
  const [challenge, setChallenge] = useState("");
  const [challengeTitle, setChallengeTitle] = useState("");
  const [solution, setSolution] = useState("");
  const [feedback, setFeedback] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timer, setTimer] = useState(60);
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [challengeActive, setChallengeActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [clarityRating, setClarityRating] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ open: false, message: "", severity: "success" });
  const timerRef = useRef();
  const [lastSavedTimer, setLastSavedTimer] = useState(null);
  const [startTimestamp, setStartTimestamp] = useState(null);

  // Next challenge confirmation dialog
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false);

  // "Train Honest" integrity flow (see doc/ANTI_CHEAT_DESIGN.md) — warn, never
  // block; every flagged action can proceed once the user confirms.
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pendingPasteText, setPendingPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [pasteConfirmedThisAttempt, setPasteConfirmedThisAttempt] = useState(false);
  const pendingPasteTargetRef = useRef(null);
  const pendingIntegrityEventsRef = useRef([]);

  const [suspectDialogOpen, setSuspectDialogOpen] = useState(false);
  const [suspectMessage, setSuspectMessage] = useState("");
  const [pendingSubmitResult, setPendingSubmitResult] = useState(null);

  const [integrityToast, setIntegrityToast] = useState({ open: false, message: "" });

  function resetIntegrityState() {
    setPasteConfirmedThisAttempt(false);
    pendingIntegrityEventsRef.current = [];
  }

  // Attaches any pending integrity events to a save, and only clears the ones
  // actually sent — if new events queued mid-flight (or the save fails),
  // nothing is silently dropped.
  async function saveWithIntegrity(payload) {
    const events = pendingIntegrityEventsRef.current;
    const toSend = events.length ? events : undefined;
    const result = await saveUserChallenge({ ...payload, integrity_events: toSend });
    if (toSend) {
      pendingIntegrityEventsRef.current = pendingIntegrityEventsRef.current.slice(events.length);
    }
    return result;
  }

  // Timer pause/resume on tab visibility
  const hiddenTimestampRef = useRef(null);
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // Pause: record when tab was hidden and stop timer
        hiddenTimestampRef.current = Date.now();
        clearTimeout(timerRef.current);
      } else {
        // Resume: calculate elapsed time and subtract from timer
        if (hiddenTimestampRef.current && timer > 0 && !submitted && challenge) {
          const elapsed = Math.floor((Date.now() - hiddenTimestampRef.current) / 1000);
          setTimer(prev => Math.max(prev - elapsed, 0));
        }
        hiddenTimestampRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line
  }, [timer, submitted, challenge]);

  // Resume logic: if resumeChallengeData is present, load it once
  const didResume = useRef(false);
  useEffect(() => {
    if (didResume.current) return;
    resetIntegrityState();
    if (resumeChallengeData) {
      setChallenge(resumeChallengeData.prompt);
      setChallengeTitle(resumeChallengeData.title || "");
      setSolution(resumeChallengeData.solution || "");
      setFeedback(resumeChallengeData.feedback || "");
      setEvaluation(resumeChallengeData.evaluation || "");
      setNotes(resumeChallengeData.notes || "");
      setClarityRating(resumeChallengeData.clarity_rating || null);
      // Use the original time_limit from the challenge, not just 60
      const limit = resumeChallengeData.time_limit || resumeChallengeData.timeLimit || 60;
      setTimeLimit(limit);
      // If there is a remaining_time field, use it, else use full timeLimit
      const remaining = typeof resumeChallengeData.remaining_time === "number"
        ? resumeChallengeData.remaining_time
        : limit;
      setTimer(remaining);
      setLastSavedTimer(remaining);
      setSubmitted(resumeChallengeData.status === "completed");
      setLoading(false);
      setChallengeActive(true);
      setStartTimestamp(Date.now() - (limit - remaining) * 1000); // estimate start time
      didResume.current = true;
    } else if (user && level) {
      getChallenge();
      didResume.current = true;
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (timer > 0 && !submitted && challenge) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, submitted, challenge]);

  useEffect(() => {
    if (challengeActive && onChallengeActive) {
      onChallengeActive(true);
    }
    // eslint-disable-next-line
  }, [challengeActive]);

  async function getChallenge() {
    setLoading(true);
    setFeedback("");
    setSolution("");
    setEvaluation("");
    setSubmitted(false);
    setTimer(60);
    setTimeLimit(60);
    setClarifyQuestion("");
    setClarifyAnswer("");
    setChallengeActive(true);
    setNotes("");
    setClarityRating(null);
    setLastSavedTimer(null);
    setStartTimestamp(Date.now());
    resetIntegrityState();
    try {
      const { prompt, timeLimit: apiTimeLimit, title } = await fetchChallenge(user, level);
      setChallenge(prompt);
      setChallengeTitle(title || "");
      setTimeLimit(apiTimeLimit);
      setTimer(apiTimeLimit);
    } catch (e) {
      setChallenge("Failed to fetch challenge. Please try again.");
      setChallengeTitle("");
    }
    setLoading(false);
  }

  async function completeSubmitSave({ fb, ev, timeTaken }) {
    try {
      const saveResult = await saveWithIntegrity({
        user_id: user.id,
        prompt: challenge,
        title: challengeTitle,
        difficulty: level,
        solution,
        feedback: fb,
        evaluation: ev,
        status: "completed",
        notes,
        time_limit: timeLimit || 60,
        remaining_time: timer,
        time_taken: timeTaken
      });
      setLastSavedTimer(timer);
      setSaveStatus({ open: true, message: "Challenge saved!", severity: "success" });
      if (onChallengeSaved && saveResult.belt) {
        onChallengeSaved(saveResult.belt);
      }
    } catch (err) {
      setSaveStatus({ open: true, message: "Failed to save challenge. Please check your connection or contact support.", severity: "error" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    clearTimeout(timerRef.current); // Stop timer on submit
    setLoading(true);
    setFeedback("");
    setEvaluation("");
    const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
    try {
      const { feedback: fb, evaluation: ev, integritySuspect, aiLikelihood, cps } = await fetchFeedback(challenge, solution, timeTaken);
      setFeedback(fb);
      setEvaluation(ev);
      if (integritySuspect) {
        // Gate the save behind a confirm — we still accept the answer once
        // the user confirms it's their own work (see doc/ANTI_CHEAT_DESIGN.md).
        setSuspectMessage(pickMessage(["SPOTTER", "MUSCLE"]));
        setPendingSubmitResult({ fb, ev, timeTaken, aiLikelihood, cps });
        setSuspectDialogOpen(true);
        setLoading(false);
        return;
      }
      await completeSubmitSave({ fb, ev, timeTaken });
    } catch {
      setFeedback("Failed to get feedback. Please try again.");
      setSaveStatus({ open: true, message: "Failed to save challenge.", severity: "error" });
    }
    setLoading(false);
  }

  function handleSuspectKeep() {
    const result = pendingSubmitResult;
    pendingIntegrityEventsRef.current.push({
      flag: "ai_suspect_confirmed",
      aiLikelihood: result?.aiLikelihood,
      cps: result?.cps
    });
    setSuspectDialogOpen(false);
    setPendingSubmitResult(null);
    if (result) completeSubmitSave(result);
  }

  function handleSuspectDiscard() {
    const result = pendingSubmitResult;
    // Recorded as a neutral/positive reporting signal only — never shown to
    // the user as a warning, never affects scoring (see doc/ANTI_CHEAT_DESIGN.md).
    pendingIntegrityEventsRef.current.push({
      flag: "ai_suspect_discarded",
      aiLikelihood: result?.aiLikelihood,
      cps: result?.cps
    });
    setSuspectDialogOpen(false);
    setPendingSubmitResult(null);
    setFeedback("");
    setEvaluation("");
    setSolution("");
    setSubmitted(false);
    saveWithIntegrity({
      user_id: user.id,
      prompt: challenge,
      title: challengeTitle,
      difficulty: level,
      solution: "",
      feedback: "",
      evaluation: "",
      status: "in_progress",
      notes,
      time_limit: timeLimit || 60,
      remaining_time: timer,
      time_taken: result ? result.timeTaken : null
    }).then(saveResult => {
      setLastSavedTimer(timer);
      if (onChallengeSaved && saveResult.belt) {
        onChallengeSaved(saveResult.belt);
      }
    }).catch(() => {
      // Non-critical — the box is cleared client-side either way.
    });
    setSaveStatus({ open: true, message: "Cleared — give it an honest go.", severity: "info" });
  }

  async function handleClarify(e) {
    e.preventDefault();
    if (!clarifyQuestion.trim()) return;
    setClarifyLoading(true);
    setClarifyAnswer("");
    try {
      const { clarification } = await fetchClarification(challenge, clarifyQuestion, user);
      setClarifyAnswer(clarification);
    } catch {
      setClarifyAnswer("Failed to get clarification. Please try again.");
    }
    setClarifyLoading(false);
  }

  async function handleManualSave() {
    if (!solution.trim()) return;
    try {
      const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
      const saveResult = await saveWithIntegrity({
        user_id: user.id,
        prompt: challenge,
        title: challengeTitle,
        difficulty: level,
        solution,
        feedback,
        evaluation,
        status: feedback ? "completed" : "in_progress",
        notes,
        time_limit: timeLimit || 60,
        remaining_time: timer,
        time_taken: timeTaken
      });
      setLastSavedTimer(timer);
      setSaveStatus({ open: true, message: "Challenge saved!", severity: "success" });
      if (onChallengeSaved && saveResult.belt) {
        onChallengeSaved(saveResult.belt);
      }
    } catch (err) {
      setSaveStatus({ open: true, message: "Failed to save challenge. Please check your connection or contact support.", severity: "error" });
    }
  }

  async function handleRateClarity(rating) {
    const previous = clarityRating;
    setClarityRating(rating); // optimistic
    try {
      await saveWithIntegrity({
        user_id: user.id,
        prompt: challenge,
        title: challengeTitle,
        difficulty: level,
        solution,
        feedback,
        evaluation,
        status: feedback ? "completed" : "in_progress",
        notes,
        time_limit: timeLimit || 60,
        remaining_time: timer,
        time_taken: startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null,
        clarity_rating: rating
      });
    } catch {
      setClarityRating(previous);
      setSaveStatus({ open: true, message: "Failed to save your rating. Please try again.", severity: "error" });
    }
  }

  // "Next Challenge" button logic
  function handleNextChallenge() {
    // If in progress (solution typed but not submitted), ask for confirmation
    if (!submitted && solution.trim()) {
      setNextConfirmOpen(true);
    } else {
      getChallenge();
    }
  }

  async function handleNextConfirm() {
    // Autosave as in_progress before moving on
    try {
      const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
      await saveWithIntegrity({
        user_id: user.id,
        prompt: challenge,
        title: challengeTitle,
        difficulty: level,
        solution,
        feedback,
        evaluation,
        status: feedback ? "completed" : "in_progress",
        notes,
        time_limit: timeLimit || 60,
        remaining_time: timer,
        time_taken: timeTaken
      });
    } catch (err) {
      // ignore error, still move to next
    }
    setNextConfirmOpen(false);
    getChallenge();
  }

  function handleNextCancel() {
    setNextConfirmOpen(false);
  }

  // Autosave on blur or solution change (debounced)
  useEffect(() => {
    if (!solution.trim()) return;
    if (timer === lastSavedTimer) return;
    const timeout = setTimeout(() => {
      const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
      saveWithIntegrity({
        user_id: user.id,
        prompt: challenge,
        title: challengeTitle,
        difficulty: level,
        solution,
        feedback,
        evaluation,
        status: feedback ? "completed" : "in_progress",
        notes,
        time_limit: timeLimit || 60,
        remaining_time: timer,
        time_taken: timeTaken
      }).then(saveResult => {
        setLastSavedTimer(timer);
        if (onChallengeSaved && saveResult.belt) {
          onChallengeSaved(saveResult.belt);
        }
      }).catch(() => {
        setSaveStatus({ open: true, message: "Failed to autosave challenge. Please check your connection.", severity: "error" });
      });
    }, 3000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [solution, notes, timer]);

  // Save on next challenge or difficulty change
  useEffect(() => {
    return () => {
      if (solution.trim()) {
        const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
        saveWithIntegrity({
          user_id: user.id,
          prompt: challenge,
          title: challengeTitle,
          difficulty: level,
          solution,
          feedback,
          evaluation,
          status: feedback ? "completed" : "in_progress",
          notes,
          time_limit: timeLimit || 60,
          remaining_time: timer,
          time_taken: timeTaken
        }).then(saveResult => {
          setLastSavedTimer(timer);
          if (onChallengeSaved && saveResult.belt) {
            onChallengeSaved(saveResult.belt);
          }
        }).catch(() => {
          setSaveStatus({ open: true, message: "Failed to save challenge on navigation. Please check your connection.", severity: "error" });
        });
      }
    };
    // eslint-disable-next-line
  }, [level]);

  // "Train Honest" — paste intercept. Small pastes (< threshold chars) or any
  // paste after the user already confirmed once this attempt insert freely;
  // large first-time pastes pause for a confirm, never a hard block.
  function handleSolutionPaste(e) {
    const text = e.clipboardData.getData("text");
    if (!text || text.length < PASTE_CONFIRM_THRESHOLD || pasteConfirmedThisAttempt) {
      return; // let the native paste happen
    }
    e.preventDefault();
    pendingPasteTargetRef.current = e.target;
    setPendingPasteText(text);
    setPasteMessage(pickMessage(["REPS", "LIFT"]));
    setPasteDialogOpen(true);
  }

  function handleConfirmPaste() {
    const target = pendingPasteTargetRef.current;
    const text = pendingPasteText;
    if (target && typeof target.selectionStart === "number") {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      setSolution(prev => prev.slice(0, start) + text + prev.slice(end));
    } else {
      setSolution(prev => prev + text);
    }
    pendingIntegrityEventsRef.current.push({ flag: "paste_confirmed", chars: text.length });
    setPasteConfirmedThisAttempt(true);
    setPasteDialogOpen(false);
    setPendingPasteText("");
    pendingPasteTargetRef.current = null;
  }

  function handleDeclinePaste() {
    setPasteDialogOpen(false);
    setPendingPasteText("");
    pendingPasteTargetRef.current = null;
  }

  // "Train Honest" — copy-out toast. A wink, not a wall: shown once per
  // session, never blocks the copy, never flagged.
  function handleChallengeCopy() {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    if (window.sessionStorage.getItem(COPY_TOAST_SESSION_KEY)) return;
    window.sessionStorage.setItem(COPY_TOAST_SESSION_KEY, "1");
    setIntegrityToast({ open: true, message: `🏋️ Taking it to another gym? ${INTEGRITY_MESSAGES.MIRROR}` });
  }

  // UI rendering
  return (
    <div className="game-container">
      <h2 className="game-title">{challengeTitle || "Programming Challenge"}</h2>
      <div className="challenge-timer">
        <span>Time Left: {`${Math.floor(timer / 60).toString().padStart(2, "0")}:${(timer % 60).toString().padStart(2, "0")}`}</span>
      </div>
      <div className="challenge-box" onCopy={handleChallengeCopy}>
        {loading && !submitted ? (
          <div className="loading">Loading...</div>
        ) : (
          <ReactMarkdown className="challenge-prompt">{challenge}</ReactMarkdown>
        )}
      </div>
      <form className="clarify-form" onSubmit={handleClarify} style={{ marginBottom: "18px" }}>
        <label>
          Need clarification? Ask a question about the challenge:
          <input
            type="text"
            className="solution-input"
            value={clarifyQuestion}
            onChange={e => setClarifyQuestion(e.target.value)}
            disabled={clarifyLoading}
            placeholder="Type your question..."
          />
        </label>
        <Button
          variant="contained"
          color="info"
          type="submit"
          disabled={clarifyLoading || !clarifyQuestion.trim()}
          sx={{ marginTop: "8px" }}
        >
          Clarify Challenge
        </Button>
      </form>
      {clarifyAnswer && (
        <div className="feedback-box">
          <strong>Clarification:</strong>
          <ReactMarkdown>{clarifyAnswer}</ReactMarkdown>
        </div>
      )}
      <form className="solution-form" onSubmit={handleSubmit}>
        <label>
          Your Solution (pseudocode or algorithm steps)
          <textarea
            className="solution-input"
            value={solution}
            onChange={e => setSolution(e.target.value)}
            rows={6}
            disabled={loading || submitted}
            onPaste={handleSolutionPaste}
          />
        </label>
        <label>
          Your Notes (optional)
          <textarea
            className="solution-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Add your notes here..."
            disabled={loading}
          />
        </label>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading || submitted || !solution.trim() || feedback}
          sx={{ marginTop: "8px" }}
        >
          Submit Solution
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={handleManualSave}
          disabled={loading || !solution.trim()}
          sx={{ marginTop: "8px", marginLeft: "12px" }}
        >
          Save Progress
        </Button>
        <Button
          variant="outlined"
          color="info"
          onClick={handleNextChallenge}
          sx={{ marginTop: "8px", marginLeft: "12px" }}
        >
          Next Challenge
        </Button>
        <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
          {INTEGRITY_MESSAGES.MIRROR2}
        </div>
      </form>
      {feedback && (
        <div className="feedback-box">
          <strong>Feedback:</strong>
          <ReactMarkdown>{feedback}</ReactMarkdown>
          {evaluation && (
            <div style={{ marginTop: 8, fontWeight: 600 }}>
              <span>Evaluation: </span>
              <span style={{ color: evaluation === "correct" ? "#22c55e" : evaluation === "partially correct" ? "#f59e42" : "#ef4444" }}>
                {evaluation.charAt(0).toUpperCase() + evaluation.slice(1)}
              </span>
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ marginRight: 6, fontSize: "0.9rem", color: "#64748b" }}>
              How clear was this challenge?
            </span>
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                onClick={() => handleRateClarity(n)}
                style={{ cursor: "pointer", color: "#f59e0b", display: "inline-flex" }}
                title={`Rate ${n} star${n > 1 ? "s" : ""}`}
              >
                {clarityRating && n <= clarityRating ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </span>
            ))}
          </div>
        </div>
      )}
      {timer === 0 && !feedback && (
        <div className="feedback-box" style={{ background: "#fee2e2", color: "#ef4444" }}>
          <strong>Time&apos;s up!</strong> You can still submit your solution, but extra time will be recorded.
        </div>
      )}
      <Snackbar
        open={saveStatus.open}
        autoHideDuration={3000}
        onClose={() => setSaveStatus({ ...saveStatus, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSaveStatus({ ...saveStatus, open: false })} severity={saveStatus.severity} sx={{ width: '100%' }}>
          {saveStatus.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={integrityToast.open}
        autoHideDuration={5000}
        onClose={() => setIntegrityToast({ ...integrityToast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setIntegrityToast({ ...integrityToast, open: false })} severity="info" sx={{ width: '100%' }}>
          {integrityToast.message}
        </Alert>
      </Snackbar>
      <Dialog open={nextConfirmOpen} onClose={handleNextCancel}>
        <DialogTitle>Skip This Challenge?</DialogTitle>
        <DialogContent>
          You have not submitted your solution. Are you sure you want to skip this challenge and move to the next one? Your progress will be saved as &quot;in progress&quot;.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNextCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleNextConfirm} color="primary" variant="contained">
            Next Challenge
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={pasteDialogOpen} onClose={handleDeclinePaste}>
        <DialogTitle>🏋️ Hold up — whose reps are these?</DialogTitle>
        <DialogContent>
          <p style={{ fontStyle: "italic", marginTop: 0 }}>&quot;{pasteMessage}&quot;</p>
          <p>
            Pasting an answer in usually means the thinking happened somewhere else. That&apos;s fine
            for notes you wrote yourself — but if this came from an AI or a friend, the only person
            you&apos;re shortchanging is you.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeclinePaste} color="inherit">
            You&apos;re right — I&apos;ll type it out
          </Button>
          <Button onClick={handleConfirmPaste} color="primary" variant="contained">
            It&apos;s my own work — paste it
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={suspectDialogOpen} onClose={() => {}} disableEscapeKeyDown>
        <DialogTitle>🏋️ This one&apos;s almost too clean.</DialogTitle>
        <DialogContent>
          <p style={{ fontStyle: "italic", marginTop: 0 }}>&quot;{suspectMessage}&quot;</p>
          <p>
            This answer looks like it might not be your own reps — maybe it is, fast fingers exist!
            If it&apos;s genuinely yours, keep it with a clear conscience.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuspectDiscard} color="inherit">
            Discard it — I&apos;ll redo this one honestly
          </Button>
          <Button onClick={handleSuspectKeep} color="primary" variant="contained">
            It&apos;s mine — keep the answer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default GamePage;
