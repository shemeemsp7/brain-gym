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
import { fetchChallenge, fetchFeedback, fetchClarification, saveUserChallenge } from "../src/challenge/apiService";

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
  const [saveStatus, setSaveStatus] = useState({ open: false, message: "", severity: "success" });
  const timerRef = useRef();
  const [lastSavedTimer, setLastSavedTimer] = useState(null);
  const [startTimestamp, setStartTimestamp] = useState(null);

  // Next challenge confirmation dialog
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false);
 
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
    if (resumeChallengeData) {
      setChallenge(resumeChallengeData.prompt);
      setChallengeTitle(resumeChallengeData.title || "");
      setSolution(resumeChallengeData.solution || "");
      setFeedback(resumeChallengeData.feedback || "");
      setEvaluation(resumeChallengeData.evaluation || "");
      setNotes(resumeChallengeData.notes || "");
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
    setLastSavedTimer(null);
    setStartTimestamp(Date.now());
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    clearTimeout(timerRef.current); // Stop timer on submit
    setLoading(true);
    setFeedback("");
    setEvaluation("");
    try {
      const { feedback: fb, evaluation: ev } = await fetchFeedback(challenge, solution, user);
      setFeedback(fb);
      setEvaluation(ev);
      // Save challenge as completed
      try {
        const timeTaken = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : null;
        const saveResult = await saveUserChallenge({
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
    } catch {
      setFeedback("Failed to get feedback. Please try again.");
      setSaveStatus({ open: true, message: "Failed to save challenge.", severity: "error" });
    }
    setLoading(false);
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
      const saveResult = await saveUserChallenge({
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
      await saveUserChallenge({
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
      saveUserChallenge({
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
        saveUserChallenge({
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

  // UI rendering
  return (
    <div className="game-container">
      <h2 className="game-title">{challengeTitle || "Programming Challenge"}</h2>
      <div className="challenge-timer">
        <span>Time Left: {`${Math.floor(timer / 60).toString().padStart(2, "0")}:${(timer % 60).toString().padStart(2, "0")}`}</span>
      </div>
      <div className="challenge-box">
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
            onPaste={e => e.preventDefault()}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
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
    </div>
  );
}

export default GamePage;