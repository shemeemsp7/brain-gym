import React, { useState, useEffect } from "react";
import LeaderboardModal from "./LeaderboardModal";
import ReviewChallenges from "./ReviewChallenges";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

function AdminPage({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearAll, setClearAll] = useState(false);

  const [selectedChallenges, setSelectedChallenges] = useState([]);
  useEffect(() => {
    fetch("/api/leaderboard?all=true")
      .then(res => res.json())
      .then(data => setUsers(data.leaderboard || []));
  }, []);

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

  function formatLocalTime(utcString) {
    if (!utcString) return "";
    let date;
    if (utcString.includes("T")) {
      date = new Date(utcString);
    } else {
      const match = utcString.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?/);
      if (match) {
        const iso = `${match[1]}T${match[2]}${match[3] ? match[3].slice(0, 4) : ""}Z`;
        date = new Date(iso);
      } else {
        date = new Date(utcString);
      }
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  function handleUserClick(u) {
    setSelectedUser(u);
  }

  function handleBack() {
    setSelectedUser(null);
    if (onBack) onBack();
  }

  function handleClearAllChallenges() {
    setClearAll(true);
    setClearDialogOpen(true);
  }

  function handleClearSomeChallenges() {
    setClearAll(false);
    setClearDialogOpen(true);
  }

  function handleConfirmClear() {
    // TODO: Implement API call to clear challenges
    setClearDialogOpen(false);
  }

  function handleCancelClear() {
    setClearDialogOpen(false);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "32px auto" }}>
      <h2>Admin Page</h2>
      {!selectedUser ? (
        <div>
          <h3>User List</h3>
          <div style={{ marginBottom: 16 }}>
            <Button variant="contained" color="primary" onClick={onBack}>
              Back
            </Button>
          </div>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #e0e7ef" }}>
              <thead>
                <tr style={{ background: "#e0e7ef" }}>
                  <th style={{ padding: "10px 8px" }}>Rank</th>
                  <th style={{ padding: "10px 8px" }}>Name</th>
                  <th style={{ padding: "10px 8px" }}>Belt</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Score</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Easy</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Medium</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Advanced</th>
                  <th style={{ padding: "10px 8px" }}>Last Submission</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ cursor: "pointer", background: u.isCurrent ? "#e0e7ef" : "#fff" }} onClick={() => handleUserClick(u)}>
                    <td style={{ padding: "8px" }}>{u.rank}</td>
                    <td style={{ padding: "8px" }}>{u.name}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        {/* KarateBeltIcon can be imported and used here if available */}
                        <span style={{
                          display: "inline-block",
                          width: 22,
                          height: 12,
                          background: BELT_COLORS[u.belt] || "#fff",
                          borderRadius: 4,
                          marginRight: 4,
                          border: "1px solid #e2e8f0"
                        }} />
                        {u.belt ? u.belt.charAt(0).toUpperCase() + u.belt.slice(1) : "White"}
                      </span>
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{u.score}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{u.easy_count}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{u.medium_count}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{u.advanced_count}</td>
                    <td style={{ padding: "8px" }}>{formatLocalTime(u.last_submission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="outlined" color="info" onClick={handleBack} sx={{ marginBottom: 2 }}>
            Back to User List
          </Button>
          <ReviewChallenges
            user={selectedUser}
            adminMode={true}
            selectedChallenges={selectedChallenges}
            onSelectChallenge={(id, checked) => {
              setSelectedChallenges(prev =>
                checked ? [...prev, id] : prev.filter(cid => cid !== id)
              );
            }}
            onSelectAll={checked => {
              if (checked) {
                fetch(`/api/user-challenge-list?user_id=${selectedUser.id}`)
                  .then(res => res.json())
                  .then(data => {
                    setSelectedChallenges((data.challenges || []).map(ch => ch.id));
                  });
              } else {
                setSelectedChallenges([]);
              }
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleClearAllChallenges}
              sx={{ marginRight: 2 }}
            >
              Clear All Challenges
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleClearSomeChallenges}
              disabled={selectedChallenges.length === 0}
            >
              Clear Selected Challenges
            </Button>
          </div>
          <Dialog open={clearDialogOpen} onClose={handleCancelClear}>
            <DialogTitle>
              {clearAll ? "Clear All Challenges" : "Clear Selected Challenges"}
            </DialogTitle>
            <DialogContent>
              Are you sure you want to {clearAll ? "clear all challenges" : "clear selected challenges"} for this user? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelClear} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (clearAll) {
                    await fetch(`/api/user-challenge-list?user_id=${selectedUser.id}`, {
                      method: "DELETE"
                    });
                  } else {
                    await fetch(`/api/user-challenge-list?user_id=${selectedUser.id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ challenge_ids: selectedChallenges })
                    });
                  }
                  setSelectedChallenges([]);
                  setClearDialogOpen(false);
                  // Re-fetch challenges for selected user
                  fetch(`/api/user-challenge-list?user_id=${selectedUser.id}`)
                    .then(res => res.json())
                    .then(data => {
                      // If ReviewChallenges is using local state, trigger a refresh via prop or state
                      // For now, reload the page section by resetting selectedUser
                      setSelectedUser({ ...selectedUser }); // triggers re-render
                    });
                }}
                color="error"
                variant="contained"
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
    </div>
  );
}

export default AdminPage;