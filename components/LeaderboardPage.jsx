// backend/components/LeaderboardPage.jsx
import React, { useEffect, useState } from "react";
import KarateBeltIcon from "./KarateBeltIcon";
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

export default function LeaderboardPage({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard${user ? `?user_id=${user.id}` : ""}`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ maxWidth: 900, margin: "32px auto" }}>
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
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 8px #2563eb22" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Belt</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Score</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Easy</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Medium</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Advanced</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Submission</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map(row => (
                <TableRow key={row.id} style={row.isCurrent ? { background: "#e0e7ef" } : {}}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <KarateBeltIcon color={BELT_COLORS[row.belt] || "#fff"} size={22} />
                      {row.belt ? row.belt.charAt(0).toUpperCase() + row.belt.slice(1) : "White"}
                    </span>
                  </TableCell>
                  <TableCell align="right">{row.score}</TableCell>
                  <TableCell align="right">{row.easy_count}</TableCell>
                  <TableCell align="right">{row.medium_count}</TableCell>
                  <TableCell align="right">{row.advanced_count}</TableCell>
                  <TableCell>{formatLocalTime(row.last_submission)}</TableCell>
                </TableRow>
              ))}
              {currentUser && (
                <TableRow style={{ background: "#fef9c3" }}>
                  <TableCell>{currentUser.rank}</TableCell>
                  <TableCell>{currentUser.name}</TableCell>
                  <TableCell>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <KarateBeltIcon color={BELT_COLORS[currentUser.belt?.toLowerCase()] || "#fff"} size={22} />
                      {currentUser.belt ? currentUser.belt.charAt(0).toUpperCase() + currentUser.belt.slice(1) : "White"}
                    </span>
                  </TableCell>
                  <TableCell align="right">{currentUser.score}</TableCell>
                  <TableCell align="right">{currentUser.easy_count}</TableCell>
                  <TableCell align="right">{currentUser.medium_count}</TableCell>
                  <TableCell align="right">{currentUser.advanced_count}</TableCell>
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