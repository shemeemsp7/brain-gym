// src/challenge/reviewFormat.js
// Serializes/parses the AI Code Review Gym composer state into the existing
// `solution` column's plain-text format (doc/AI_CODE_REVIEW_GYM.md §4.3) — no
// schema changes; ReviewChallenges renders it readably as plain text as-is.

export function emptyFinding() {
  return { where: "", why: "", trigger: "" };
}

export function composeReviewSolution({ verdict, findings, approveJustification }) {
  if (!verdict) return "";
  const lines = [`VERDICT: ${verdict === "approve" ? "approve" : "request-changes"}`, ""];
  if (verdict === "approve") {
    lines.push("JUSTIFICATION:", approveJustification || "");
  } else {
    (findings || []).forEach((f, i) => {
      lines.push(`FINDING ${i + 1}`);
      lines.push(`Where: ${f.where || ""}`);
      lines.push(`Why: ${f.why || ""}`);
      lines.push(`Trigger: ${f.trigger || ""}`);
      lines.push("");
    });
  }
  return lines.join("\n").trim();
}

export function parseReviewSolution(text) {
  const result = { verdict: null, findings: [emptyFinding()], approveJustification: "" };
  if (!text) return result;
  const verdictMatch = text.match(/^VERDICT:\s*(approve|request-changes)/m);
  if (!verdictMatch) return result;
  result.verdict = verdictMatch[1];
  if (result.verdict === "approve") {
    const justMatch = text.match(/JUSTIFICATION:\s*([\s\S]*)/);
    result.approveJustification = justMatch ? justMatch[1].trim() : "";
  } else {
    const blocks = text.split(/\nFINDING \d+\n/).slice(1);
    const findings = blocks.map(block => ({
      where: (block.match(/Where:\s*(.*)/) || [])[1] || "",
      why: (block.match(/Why:\s*(.*)/) || [])[1] || "",
      trigger: (block.match(/Trigger:\s*(.*)/) || [])[1] || ""
    }));
    result.findings = findings.length ? findings : [emptyFinding()];
  }
  return result;
}

// Gates the Submit button only — Save Progress/autosave accept partial drafts
// (any composed text at all), since those are meant to preserve in-progress work.
export function isReviewComposerValid({ verdict, findings, approveJustification }) {
  if (verdict === "approve") return (approveJustification || "").trim().length >= 80;
  if (verdict === "request-changes") {
    return (findings || []).some(f => f.where?.trim() && f.why?.trim() && f.trigger?.trim());
  }
  return false;
}
