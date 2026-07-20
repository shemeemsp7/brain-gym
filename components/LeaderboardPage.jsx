// backend/components/LeaderboardPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import BeltBadge from "./BeltBadge";
import { formatLocalTime } from "../src/challenge/dateUtils";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const CURRENT_USER_HIGHLIGHT = "#fef9c3";

export default function LeaderboardPage({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/leaderboard${user ? `?user_id=${user.id}` : ""}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load leaderboard");
        return res.json();
      })
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ flex: 1, margin: 0 }}>Global Leaderboard</h2>
        <Button
          variant="outlined"
          color="primary"
          sx={{
            fontWeight: 600,
            borderRadius: 8,
            boxShadow: "none",
            textTransform: "none",
            padding: "6px 18px"
          }}
          onClick={onBack}
        >
          Back
        </Button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <CircularProgress aria-label="Loading leaderboard" />
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
          <p>Couldn&apos;t load the leaderboard. Check your connection and try again.</p>
          <Button variant="outlined" color="primary" onClick={load}>
            Retry
          </Button>
        </div>
      ) : leaderboard.length === 0 && !currentUser ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
          Nobody&apos;s lifted yet. Be the first on the board.
        </div>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 8px #2563eb22" }}>
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
              {leaderboard.map(row => (
                <TableRow key={row.id} style={row.isCurrent ? { background: CURRENT_USER_HIGHLIGHT } : {}}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <BeltBadge belt={row.belt} />
                  </TableCell>
                  <TableCell align="right">{row.score}</TableCell>
                  <TableCell align="right">{row.easy_count} / {row.medium_count} / {row.advanced_count}</TableCell>
                  <TableCell>{formatLocalTime(row.last_submission)}</TableCell>
                </TableRow>
              ))}
              {currentUser && (
                <TableRow style={{ background: CURRENT_USER_HIGHLIGHT }}>
                  <TableCell>{currentUser.rank}</TableCell>
                  <TableCell>{currentUser.name}</TableCell>
                  <TableCell>
                    <BeltBadge belt={currentUser.belt} />
                  </TableCell>
                  <TableCell align="right">{currentUser.score}</TableCell>
                  <TableCell align="right">{currentUser.easy_count} / {currentUser.medium_count} / {currentUser.advanced_count}</TableCell>
                  <TableCell>{formatLocalTime(currentUser.last_submission)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
