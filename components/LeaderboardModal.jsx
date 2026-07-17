// backend/components/LeaderboardModal.jsx
import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import KarateBeltIcon from "./KarateBeltIcon";

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

export default function LeaderboardModal({ open, onClose, user }) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/leaderboard${user ? `?user_id=${user.id}` : ""}`)
        .then(res => res.json())
        .then(data => {
          setLeaderboard(data.leaderboard || []);
          setCurrentUser(data.currentUser || null);
        })
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Global Leaderboard</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Belt</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Easy</TableCell>
                  <TableCell align="right">Medium</TableCell>
                  <TableCell align="right">Advanced</TableCell>
                  <TableCell>Last Submission</TableCell>
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
                        <KarateBeltIcon color={BELT_COLORS[currentUser.belt] || "#fff"} size={22} />
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}