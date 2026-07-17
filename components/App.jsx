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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // Trophy icon as belt symbol

// Belt color mapping
const BELT_COLORS = {
  white: "#fff",
  yellow: "#fde68a",
  orange: "#fb923c",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a78bfa",
  brown: "#92400e",
  black: "#000"
};

const LEVELS = [
  { label: "Easy (Beginner)", value: "easy" },
  { label: "Medium (Intermediate)", value: "medium" },
  { label: "Advanced (Expert)", value: "advanced" }
];

function App() {
  const { data: session, status } = useSession();
  const user = session?.user || null;
  const [level, setLevel] = useState("");
  const [levelSelected, setLevelSelected] = useState(false);
  const [canChangeLevel, setCanChangeLevel] = useState(true);
  const [challengeActive, setChallengeActive] = useState(false);
  const [pendingLevel, setPendingLevel] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [belt, setBelt] = useState(user?.belt || "white");

  // Ensure belt updates when session changes
  React.useEffect(() => {
    setBelt(user?.belt || "white");
  }, [user?.belt]);
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
      setConfirmOpen(true);
    } else {
      setLevel(lvl);
      setLevelSelected(true);
      setCanChangeLevel(false);
      setResumeChallengeData(null);
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
  }

  function handleChangeLevel() {
    setLevelSelected(false);
    setCanChangeLevel(true);
    setChallengeActive(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
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
    setLevelSelected(true);
    setCanChangeLevel(false);
    setChallengeActive(false);
    setConfirmOpen(false);
    setChallengeLoaded(false);
    setResumeChallengeData(null);
  }

  function handleCancelChangeLevel() {
    setPendingLevel("");
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
  }

  function handleShowBeltRules() {
    setBeltRulesOpen(true);
  }

  function handleHideBeltRules() {
    setBeltRulesOpen(false);
  }

  // Update belt in UI after challenge save (if backend returns new belt)
  function handleChallengeSaved(newBelt) {
    if (newBelt && newBelt !== belt) {
      setBelt(newBelt);
      // Also update user object so belt persists on reload
      setUser(prev => prev ? { ...prev, belt: newBelt } : prev);
    }
  }

  return (
    <div>
      {user && (
        <div className="banner">
          <div className="banner-left">
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
                // Log the belt color for debugging
                background: (() => {
                  const color = BELT_COLORS[belt?.toLowerCase()] || "#fff";
                  return color;
                })(),
                color: belt?.toLowerCase() === "white" ? "#222" : "#fff",
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
              title="Click to see belt rules"
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
          </div>
          <div className="banner-right">
            <Button
              variant={showReview ? "contained" : "outlined"}
              color="info"
              sx={{
                marginLeft: "12px",
                fontWeight: 600,
                borderRadius: 8,
                boxShadow: "none",
                textTransform: "none",
                padding: "6px 18px"
              }}
              onClick={handleShowReview}
            >
              Review Past Challenges
            </Button>
            <Button
              variant={showLeaderboard ? "contained" : "outlined"}
              color="info"
              sx={{
                marginLeft: "12px",
                fontWeight: 600,
                borderRadius: 8,
                boxShadow: "none",
                textTransform: "none",
                padding: "6px 18px"
              }}
              onClick={handleShowLeaderboard}
            >
              Leaderboard
            </Button>
            {user?.role === "admin" && (
              <Button
                variant={showAdminPage ? "contained" : "outlined"}
                color="info"
                sx={{
                  marginLeft: "12px",
                  fontWeight: 600,
                  borderRadius: 8,
                  boxShadow: "none",
                  textTransform: "none",
                  padding: "6px 18px"
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
            <GamePage
              key={level}
              user={user}
              level={level}
              onChallengeComplete={enableChangeLevel}
              onChallengeActive={handleChallengeActive}
              resumeChallengeData={resumeChallengeData}
              onChallengeSaved={handleChallengeSaved}
            />
          )}
          <Dialog open={confirmOpen} onClose={handleCancelChangeLevel}>
            <DialogTitle>Change Difficulty Level?</DialogTitle>
            <DialogContent>
              A challenge is currently active. Do you want to exit and change the difficulty level?
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