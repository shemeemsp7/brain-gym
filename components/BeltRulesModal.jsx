// backend/components/BeltRulesModal.jsx
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const BELT_RULES = [
  {
    belt: "White",
    desc: "Default for all users."
  },
  {
    belt: "Yellow",
    desc: "1–4 completed challenges (any difficulty, correct or partially correct)."
  },
  {
    belt: "Orange",
    desc: "5–9 completed challenges (any difficulty, correct or partially correct)."
  },
  {
    belt: "Green",
    desc: "10–19 completed challenges, at least 2 must be Medium."
  },
  {
    belt: "Blue",
    desc: "20–29 completed challenges, at least 5 must be Medium."
  },
  {
    belt: "Purple",
    desc: "30–39 completed challenges, at least 10 Medium and 2 Advanced."
  },
  {
    belt: "Brown",
    desc: "40–49 completed challenges, at least 15 Medium and 5 Advanced."
  },
  {
    belt: "Black",
    desc: "50+ completed challenges, at least 20 Medium and 10 Advanced."
  }
];

export default function BeltRulesModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Belt Progression Rules</DialogTitle>
      <DialogContent dividers>
        <ul style={{ fontSize: "1.1rem", color: "#334155", lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
          {BELT_RULES.map(rule => (
            <li key={rule.belt}>
              <strong>{rule.belt} Belt:</strong> {rule.desc}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 24, color: "#64748b", fontSize: "1rem" }}>
          <em>
            Only challenges marked as <b>correct</b> or <b>partially correct</b> count towards belt progression.
            <br />
            Medium and Advanced challenges must also be correct or partially correct.
          </em>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}