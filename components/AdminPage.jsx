import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReviewChallenges from "./ReviewChallenges";
import BeltBadge from "./BeltBadge";
import { formatLocalTime } from "../src/challenge/dateUtils";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

function AdminPage({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearAll, setClearAll] = useState(false);
  const [clearAllCount, setClearAllCount] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [selectedChallenges, setSelectedChallenges] = useState([]);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/leaderboard?all=true")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then(data => setUsers(data.leaderboard || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleUserClick(u) {
    setSelectedUser(u);
  }

  function handleUserKeyDown(e, u) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleUserClick(u);
    }
  }

  function handleBack() {
    setSelectedUser(null);
    if (onBack) onBack();
  }

  function handleClearAllChallenges() {
    setClearAll(true);
    setClearAllCount(null);
    setClearDialogOpen(true);
    fetch(`/api/user-challenge-list?user_id=${selectedUser.id}`)
      .then(res => res.json())
      .then(data => setClearAllCount((data.challenges || []).length))
      .catch(() => setClearAllCount(null));
  }

  function handleClearSomeChallenges() {
    setClearAll(false);
    setClearDialogOpen(true);
  }

  function handleCancelClear() {
    setClearDialogOpen(false);
  }

  async function handleConfirmClear() {
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
    // ReviewChallenges refetches whenever its `user` prop reference changes;
    // bumping this token forces a fresh object even though selectedUser's
    // fields haven't changed, which is enough to trigger its effect.
    setRefreshToken(t => t + 1);
  }

  const clearCount = clearAll ? clearAllCount : selectedChallenges.length;

  // Only produce a new object (and thus re-trigger ReviewChallenges' fetch
  // effect, which depends on `user` by reference) when the selected user or
  // the refresh token actually changes — not on every unrelated re-render.
  const reviewUser = useMemo(
    () => (selectedUser ? { ...selectedUser, _refresh: refreshToken } : null),
    [selectedUser, refreshToken]
  );

  return (
    <div style={{ maxWidth: 1000, margin: "32px auto", padding: "0 16px" }}>
      <h2>Admin Page</h2>
      {!selectedUser ? (
        <div>
          <h3>User List</h3>
          <div style={{ marginBottom: 16 }}>
            <Button variant="contained" color="primary" onClick={onBack}>
              Back
            </Button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <CircularProgress aria-label="Loading users" />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
              <p>Couldn&apos;t load users. Check your connection and try again.</p>
              <Button variant="outlined" color="primary" onClick={loadUsers}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
              No users yet.
            </div>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 8px #2563eb22" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Belt</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Score</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }} title="Easy / Medium / Advanced">E / M / A</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Submission</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow
                      key={u.id}
                      hover
                      role="button"
                      tabIndex={0}
                      onClick={() => handleUserClick(u)}
                      onKeyDown={e => handleUserKeyDown(e, u)}
                      style={{ cursor: "pointer", background: u.isCurrent ? "#e0e7ef" : undefined }}
                    >
                      <TableCell>{u.rank}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell><BeltBadge belt={u.belt} /></TableCell>
                      <TableCell align="right">{u.score}</TableCell>
                      <TableCell align="right">{u.easy_count} / {u.medium_count} / {u.advanced_count}</TableCell>
                      <TableCell>{formatLocalTime(u.last_submission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      ) : (
        <div>
          <Button variant="outlined" color="info" onClick={handleBack} sx={{ marginBottom: 2 }}>
            Back to User List
          </Button>
          <ReviewChallenges
            user={reviewUser}
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
              Are you sure you want to {clearAll
                ? `clear ${clearCount === null ? "all" : `${clearCount}`} challenge${clearCount === 1 ? "" : "s"}`
                : `clear ${clearCount} selected challenge${clearCount === 1 ? "" : "s"}`} for {selectedUser.name}?
              This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelClear} color="inherit">
                Cancel
              </Button>
              <Button onClick={handleConfirmClear} color="error" variant="contained">
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
