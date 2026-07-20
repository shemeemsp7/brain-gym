// backend/components/App.jsx
import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import GamePage from "./GamePage";
import ReviewChallenges from "./ReviewChallenges";
import BeltRulesModal from "./BeltRulesModal";
import LeaderboardPage from "./LeaderboardPage";
import AdminPage from "./AdminPage";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // Trophy icon as belt symbol
import { fetchUserProfile } from "../src/challenge/apiService";
import { beltColor, beltTextColor } from "../src/beltColors";
import { PRODUCT_NAME } from "../src/config";

const LEVELS = [
  { label: "Easy (Beginner)", value: "easy" },
  { label: "Medium (Intermediate)", value: "medium" },
  { label: "Advanced (Expert)", value: "advanced" }
];

function formatBeltProgress(beltProgress) {
  if (!beltProgress || !beltProgress.next) return null;
  const { missing, next } = beltProgress;
  const parts = [];
  if (missing.total > 0) parts.push(`${missing.total} more solved`);
  if (missing.medium > 0) parts.push(`${missing.medium} medium`);
  if (missing.advanced > 0) parts.push(`${missing.advanced} advanced`);
  return parts.length ? `${parts.join(", ")} to ${next} belt` : null;
}

function App() {
  const { data: session, status } = useSession();
  const user = session?.user || null;
  const [level, setLevel] = useState("");
  const [levelSelected, setLevelSelected] = useState(false);
  const [canChangeLevel, setCanChangeLevel] = useState(true);
  const [challengeActive, setChallengeActive] = useState(false);
  const [pendingLevel, setPendingLevel] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [challengeType, setChallengeType] = useState("");
  const [modeSelected, setModeSelected] = useState(false);
  const [pendingType, setPendingType] = useState("solve");
  const [showRegister, setShowRegister] = useState(false);
  const [belt, setBelt] = useState(user?.belt || "white");
  const [profile, setProfile] = useState(null);
  const [beltCelebration, setBeltCelebration] = useState(null);
  const [streakToast, setStreakToast] = useState({ open: false, message: "" });

  // Ensure belt updates when session changes
  React.useEffect(() => {
    setBelt(user?.belt || "white");
  }, [user?.belt]);

  const refreshProfile = React.useCallback(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then(data => setProfile(data))
      .catch(() => {
        // Non-critical — stats/streak just won't show this time.
      });
  }, [user?.id]);

  React.useEffect(() => {
    if (user?.id) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [user?.id, refreshProfile]);
  const [showReview, setShowReview] = useState(false);
  const [beltRulesOpen, setBeltRulesOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);

  // Track if a challenge is currently loaded and active
  const [challengeLoaded, setChallengeLoaded] = useState(false);

  // For resuming a challenge
  const [resumeChallengeData, setResumeChallengeData] = useState(null);

  function handleLevelSelect(lvl) {
    // Always show confirmation if a challenge is loaded and active
    if (challengeLoaded && challengeActive) {
      setPendingLevel(lvl);
      setPendingType(challengeType);
      setConfirmOpen(true);
    } else {
      setLevel(lvl);
      setLevelSelected(true);
      setCanChangeLevel(false);
      setResumeChallengeData(null);
    }
  }

  function handleTypeSelect(t) {
    // Same confirm-before-switching flow as changing difficulty (doc/AI_CODE_REVIEW_GYM.md §5.1).
    if (challengeLoaded && challengeActive) {
      setPendingLevel(level);
      setPendingType(t);
      setConfirmOpen(true);
    } else {
      setChallengeType(t);
      setModeSelected(true);
    }
  }

  function handleLogout() {
    signOut();
    setLevel("");
    setLevelSelected(false);
    setCanChangeLevel(true);
    setChallengeActive(false);
    setBelt("white");
    setChallengeLoaded(false);
    setShowReview(false);
    setResumeChallengeData(null);
    setShowLeaderboard(false);
    setChallengeType("");
    setModeSelected(false);
  }

  function handleChangeLevel() {
    setLevelSelected(false);
    setCanChangeLevel(true);
    setChallengeActive(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
    setChallengeType("");
    setModeSelected(false);
  }

  function enableChangeLevel() {
    setCanChangeLevel(true);
    setChallengeActive(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
  }

  function handleChallengeActive(active) {
    setChallengeActive(active);
    setChallengeLoaded(active);
  }

  function handleConfirmChangeLevel() {
    setLevel(pendingLevel);
    setChallengeType(pendingType || "solve");
    setModeSelected(true);
    setLevelSelected(true);
    setCanChangeLevel(false);
    setChallengeActive(false);
    setConfirmOpen(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
  }

  function handleCancelChangeLevel() {
    setPendingLevel("");
    setPendingType("solve");
    setConfirmOpen(false);
  }

  // No longer needed: handleLogin, handleRegister

  function handleRegister(userObj) {
    setShowRegister(false);
  }

  function handleSwitchToRegister() {
    setShowRegister(true);
  }

  function handleSwitchToLogin() {
    setShowRegister(false);
  }

  function handleShowReview() {
    setShowReview(true);
    setShowLeaderboard(false);
    setShowAdminPage(false);
  }

  function handleHideReview() {
    setShowReview(false);
  }

  function handleShowLeaderboard() {
    setShowLeaderboard(true);
    setShowReview(false);
    setShowAdminPage(false);
  }

  function handleHideLeaderboard() {
    setShowLeaderboard(false);
  }

  function handleResumeChallenge(challenge) {
    setShowReview(false);
    setShowLeaderboard(false);
    setLevel(challenge.difficulty);
    setChallengeType(challenge.type || "solve");
    setModeSelected(true);
    setLevelSelected(true);
    setCanChangeLevel(false);
    setResumeChallengeData(challenge);
  }

  function handleHome() {
    setShowReview(false);
    setShowLeaderboard(false);
    setShowAdminPage(false);
    setLevelSelected(false);
    setLevel("");
    setCanChangeLevel(true);
    setChallengeActive(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
    setChallengeType("");
    setModeSelected(false);
  }

  function handleShowBeltRules() {
    setBeltRulesOpen(true);
  }

  function handleHideBeltRules() {
    setBeltRulesOpen(false);
  }

  // Update belt in UI after challenge save (if backend returns new belt),
  // and surface the two moments of delight the product has but never shows:
  // a belt promotion, and the streak ticking up for the day.
  function handleChallengeSaved(newBelt) {
    const beltChanged = Boolean(newBelt && newBelt !== belt);
    if (beltChanged) {
      setBelt(newBelt);
      setBeltCelebration(newBelt);
    }
    const prevStreakCount = profile?.streak?.count ?? 0;
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then(data => {
        setProfile(data);
        const newStreakCount = data?.streak?.count ?? 0;
        if (newStreakCount > prevStreakCount) {
          setStreakToast({ open: true, message: `Day ${newStreakCount} — streak alive 🔥` });
        }
      })
      .catch(() => {
        // Non-critical — stats/streak just won't show this time.
      });
  }

  return (
    <div>
      {user && (
        <div className="banner">
          <div className="banner-left">
            <span
              className="banner-logo"
              onClick={handleHome}
              title="Go to Home"
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleHome(); }}
            >
              🧠💪 {PRODUCT_NAME}
            </span>
            <span
              className="banner-welcome"
              style={{ cursor: "pointer" }}
              onClick={handleHome}
              title="Go to Home"
            >
              Welcome, {user.name || user.email}
            </span>
            <span
              className="banner-belt"
              style={{
                background: beltColor(belt),
                color: beltTextColor(belt),
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                padding: "2px 12px",
                marginLeft: "16px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
              title={formatBeltProgress(profile?.beltProgress) || "Click to see belt rules"}
              onClick={handleShowBeltRules}
            >
              <EmojiEventsIcon
                style={{
                  color: belt?.toLowerCase() === "white" ? "#bdbdbd" : "#fbbf24",
                  fontSize: "1.3em",
                  verticalAlign: "middle"
                }}
              />
              {(belt?.charAt(0).toUpperCase() + belt?.slice(1)) || "White"} Belt
            </span>
            {profile?.streak && (
              <span
                className="banner-streak"
                title={profile.streak.active ? "You've trained today — streak is live" : profile.streak.count > 0 ? "Train today to keep your streak alive" : "Start a streak by completing a challenge"}
                style={{
                  marginLeft: "12px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: profile.streak.count > 0 ? "#fed7aa" : "rgba(255,255,255,0.75)"
                }}
              >
                🔥 {profile.streak.count}-day streak
              </span>
            )}
            {profile?.stats && (
              <span
                className="banner-stats"
                style={{ marginLeft: "12px", fontSize: "0.85rem", color: "rgba(255,255,255,0.85)" }}
              >
                Easy {profile.stats.easy} · Medium {profile.stats.medium} · Advanced {profile.stats.advanced}
              </span>
            )}
          </div>
          <div className="banner-right">
            <Button
              variant={showReview ? "contained" : "outlined"}
              sx={{
                marginLeft: "12px",
                fontWeight: 600,
                borderRadius: 8,
                boxShadow: "none",
                textTransform: "none",
                padding: "6px 18px",
                color: showReview ? "#2563eb" : "#fff",
                backgroundColor: showReview ? "#fff" : "transparent",
                borderColor: "rgba(255,255,255,0.7)",
                "&:hover": {
                  backgroundColor: showReview ? "#e2e8f0" : "rgba(255,255,255,0.15)",
                  borderColor: "#fff"
                }
              }}
              onClick={handleShowReview}
            >
              Training Log
            </Button>
            <Button
              variant={showLeaderboard ? "contained" : "outlined"}
              sx={{
                marginLeft: "12px",
                fontWeight: 600,
                borderRadius: 8,
                boxShadow: "none",
                textTransform: "none",
                padding: "6px 18px",
                color: showLeaderboard ? "#2563eb" : "#fff",
                backgroundColor: showLeaderboard ? "#fff" : "transparent",
                borderColor: "rgba(255,255,255,0.7)",
                "&:hover": {
                  backgroundColor: showLeaderboard ? "#e2e8f0" : "rgba(255,255,255,0.15)",
                  borderColor: "#fff"
                }
              }}
              onClick={handleShowLeaderboard}
            >
              Leaderboard
            </Button>
            {user?.role === "admin" && (
              <Button
                variant={showAdminPage ? "contained" : "outlined"}
                sx={{
                  marginLeft: "12px",
                  fontWeight: 600,
                  borderRadius: 8,
                  boxShadow: "none",
                  textTransform: "none",
                  padding: "6px 18px",
                  color: showAdminPage ? "#2563eb" : "#fff",
                  backgroundColor: showAdminPage ? "#fff" : "transparent",
                  borderColor: "rgba(255,255,255,0.7)",
                  "&:hover": {
                    backgroundColor: showAdminPage ? "#e2e8f0" : "rgba(255,255,255,0.15)",
                    borderColor: "#fff"
                  }
                }}
                onClick={() => setShowAdminPage(true)}
              >
                Admin Page
              </Button>
            )}
            <Button variant="contained" color="primary" sx={{ marginLeft: "12px" }} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      )}
      <BeltRulesModal open={beltRulesOpen} onClose={handleHideBeltRules} />
      <Dialog open={!!beltCelebration} onClose={() => setBeltCelebration(null)}>
        <DialogTitle>🎉 New belt earned!</DialogTitle>
        <DialogContent style={{ textAlign: "center", padding: "24px 32px" }}>
          <EmojiEventsIcon style={{ color: "#fbbf24", fontSize: "3rem" }} />
          <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1e293b", margin: "8px 0 0" }}>
            You earned your {beltCelebration} belt!
          </p>
          <p style={{ color: "#64748b" }}>Keep training — the next one&apos;s already within reach.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBeltCelebration(null)} color="primary" variant="contained">
            Nice!
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={streakToast.open}
        autoHideDuration={4000}
        onClose={() => setStreakToast({ ...streakToast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setStreakToast({ ...streakToast, open: false })} severity="success" sx={{ width: "100%" }}>
          {streakToast.message}
        </Alert>
      </Snackbar>
      {!user ? (
        showRegister ? (
          <RegisterPage onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <LoginPage onSwitchToRegister={handleSwitchToRegister} />
        )
      ) : showAdminPage ? (
       <AdminPage user={user} onBack={handleHome} />
     ) : showLeaderboard ? (
       <LeaderboardPage user={user} onBack={handleHome} />
     ) : showReview ? (
       <ReviewChallenges user={user} onResume={handleResumeChallenge} showBeltRules={handleShowBeltRules} />
     ) : (
       <>
          <div className="level-select-container">
            <span className="level-select-label">Select Problem Level:</span>
            {LEVELS.map(lvl => (
              <Button
                key={lvl.value}
                variant={level === lvl.value ? "contained" : "outlined"}
                color={level === lvl.value ? "primary" : "inherit"}
                className={`level-select-btn${level === lvl.value ? " selected" : ""}`}
                onClick={() => handleLevelSelect(lvl.value)}
                sx={{ marginRight: "8px" }}
              >
                {lvl.label}
              </Button>
            ))}
            {levelSelected && canChangeLevel && (
              <Button
                variant="contained"
                color="warning"
                className="level-select-btn"
                sx={{ marginLeft: "18px" }}
                onClick={handleChangeLevel}
              >
                Change Level
              </Button>
            )}
          </div>
          {levelSelected && (
            <div className="level-select-container" style={{ marginTop: 8 }}>
              <span className="level-select-label">Mode:</span>
              <Tooltip title="Write it yourself">
                <Button
                  variant={challengeType === "solve" ? "contained" : "outlined"}
                  color={challengeType === "solve" ? "primary" : "inherit"}
                  onClick={() => handleTypeSelect("solve")}
                  sx={{ marginRight: "8px" }}
                >
                  💪 Lift
                </Button>
              </Tooltip>
              <Tooltip title="Spot the AI's mistakes">
                <Button
                  variant={challengeType === "review" ? "contained" : "outlined"}
                  color={challengeType === "review" ? "primary" : "inherit"}
                  onClick={() => handleTypeSelect("review")}
                  sx={{ marginRight: "8px" }}
                >
                  🐛 Spot
                </Button>
              </Tooltip>
            </div>
          )}
          {levelSelected && modeSelected && (
            <GamePage
              key={level + ":" + challengeType}
              user={user}
              level={level}
              type={challengeType}
              onChallengeComplete={enableChangeLevel}
              onChallengeActive={handleChallengeActive}
              resumeChallengeData={resumeChallengeData}
              onChallengeSaved={handleChallengeSaved}
            />
          )}
          <Dialog open={confirmOpen} onClose={handleCancelChangeLevel}>
            <DialogTitle>Change Level or Mode?</DialogTitle>
            <DialogContent>
              A challenge is currently active. Do you want to exit and change the difficulty level or mode?
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelChangeLevel} color="inherit">
                Cancel
              </Button>
              <Button onClick={handleConfirmChangeLevel} color="primary" variant="contained">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
}

export default App;