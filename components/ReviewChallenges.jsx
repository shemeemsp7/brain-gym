// backend/components/ReviewChallenges.jsx
import React, { useEffect, useState } from "react";
import { fetchUserChallenges } from "../src/challenge/apiService";
import { formatLocalTime } from "../src/challenge/dateUtils";
import ReactMarkdown from "react-markdown";
import CircularProgress from "@mui/material/CircularProgress";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";

function ReviewChallenges({ user, onResume, showBeltRules, adminMode = false, selectedChallenges = [], onSelectChallenge, onSelectAll }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    // Only use user.id (numeric DB id) for fetching challenges
    if (!user?.id) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchUserChallenges(user.id)
      .then(data => setChallenges(data.challenges || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div>Please log in to review your challenges.</div>;
  if (loading) return <CircularProgress />;

  return (
    <div style={{ maxWidth: 900, margin: "32px auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ flex: 1, margin: 0 }}>Your Past Challenges</h2>
        <Button variant="text" color="info" onClick={showBeltRules} sx={{ fontWeight: 600 }}>
          How are belts awarded?
        </Button>
        {adminMode && challenges.length > 0 && (
          <div style={{ marginLeft: 24 }}>
            <label>
              <input
                type="checkbox"
                checked={selectedChallenges.length === challenges.length}
                onChange={e => onSelectAll && onSelectAll(e.target.checked)}
              />
              Select All
            </label>
          </div>
        )}
      </div>
      {challenges.length === 0 ? (
        <div style={{ textAlign: "center", margin: "48px 0", color: "#64748b", fontSize: "1.2em" }}>
          <img
            src="/images/brain-gym-placeholder.png"
            alt="No challenges"
            style={{ width: 120, opacity: 0.7, marginBottom: 16 }}
          />
          <div>No challenges found yet.<br />Start a challenge to see your progress here!</div>
        </div>
      ) : (
        <React.Fragment>
          {challenges.map(ch => (
            <Accordion
              key={ch.id}
              expanded={expanded === ch.id}
              onChange={() => setExpanded(expanded === ch.id ? null : ch.id)}
              sx={{ marginBottom: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {adminMode && (
                  <input
                    type="checkbox"
                    checked={selectedChallenges.includes(ch.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={e => onSelectChallenge && onSelectChallenge(ch.id, e.target.checked)}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Typography sx={{ flex: 1, fontWeight: 600 }}>
                  {ch.title || "Untitled Challenge"}
                </Typography>
                <Typography sx={{ marginLeft: 2, color: "#0ea5e9" }}>
                  {ch.difficulty.toUpperCase()}
                </Typography>
                <Typography sx={{ marginLeft: 2, color: ch.status === "completed" ? "#22c55e" : "#f59e42" }}>
                  {ch.status === "completed" ? "Completed" : ch.status === "in_progress" ? "In Progress" : "Not Completed"}
                </Typography>
                {ch.evaluation && (
                  <Typography sx={{ marginLeft: 2, color: ch.evaluation === "correct" ? "#22c55e" : ch.evaluation === "partially correct" ? "#f59e42" : "#ef4444" }}>
                    {ch.evaluation.charAt(0).toUpperCase() + ch.evaluation.slice(1)}
                  </Typography>
                )}
                {Array.isArray(ch.integrity_flags) && ch.integrity_flags.some(f => f.flag === "paste_confirmed" || f.flag === "ai_suspect_confirmed") && (
                  <Typography
                    title="You confirmed this attempt was your own work"
                    sx={{ marginLeft: 2, color: "#0891b2", fontSize: "0.85rem" }}
                  >
                    🤝 confirmed own-work
                  </Typography>
                )}
                <Typography sx={{ marginLeft: 2, color: "#64748b" }}>
                  {formatLocalTime(ch.submitted_at)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ marginBottom: 8 }}>
                  <strong>Prompt:</strong>
                  <ReactMarkdown>{ch.prompt}</ReactMarkdown>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Your Solution:</strong>
                  <pre style={{ background: "#e0e7ef", padding: 10, borderRadius: 6 }}>{ch.solution}</pre>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Feedback:</strong>
                  <ReactMarkdown>{ch.feedback || "No feedback yet."}</ReactMarkdown>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Your Notes:</strong>
                  <pre style={{ background: "#f1f5f9", padding: 8, borderRadius: 6 }}>{ch.notes || "No notes."}</pre>
                </div>
                {ch.status === "in_progress" && (
                  <button
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 18px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onClick={() => onResume && onResume(ch)}
                  >
                    Resume Challenge
                  </button>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </React.Fragment>
      )}
    </div>
  );
}

export default ReviewChallenges;