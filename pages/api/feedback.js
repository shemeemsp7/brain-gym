// backend/pages/api/feedback.js
import { getFeedbackPrompt } from "../../src/challenge/prompts";
import { chatCompletion } from "../../src/llmClient";
import { withAuth } from "../../lib/auth";
import { withRateLimit } from "../../src/rateLimit";

const AI_LIKELIHOOD_VALUES = ["low", "medium", "high"];
// ~72 wpm sustained including thinking time — conservative, to keep false positives rare.
const SPEED_FLAG_CHARS_PER_SECOND = 6;

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { challenge, solution, time_taken } = req.body || {};
  if (typeof challenge !== "string" || !challenge || typeof solution !== "string" || !solution) {
    return res.status(400).json({ error: "Missing challenge or solution" });
  }

  const prompt = getFeedbackPrompt(challenge, solution, req.user);

  try {
    const content = await chatCompletion(prompt);
    let feedback = "";
    let evaluation = "";
    let aiLikelihood = null;
    try {
      const parsed = JSON.parse(content || "{}");
      feedback = parsed.feedback || "";
      evaluation = parsed.evaluation || "";
      if (AI_LIKELIHOOD_VALUES.includes(parsed.aiLikelihood)) {
        aiLikelihood = parsed.aiLikelihood;
      }
    } catch {
      feedback = content || "Failed to get feedback. Please try again.";
      evaluation = "";
    }

    // Behavioral cross-check the model itself can't see: implausible typing speed.
    // Never derived from anything the client could control besides the timer it
    // already can't rewind (remaining_time is tracked server-side via saves).
    const validTime = typeof time_taken === "number" && time_taken > 0;
    const charsPerSecond = validTime ? solution.length / time_taken : null;
    const speedFlag = validTime && charsPerSecond > SPEED_FLAG_CHARS_PER_SECOND;
    const integritySuspect = aiLikelihood === "high" || (aiLikelihood === "medium" && speedFlag);

    // aiLikelihood and cps ride along so the client can echo them back into
    // the integrity ledger if the user Keeps/Discards a suspect submission
    // (see doc/ANTI_CHEAT_DESIGN.md) — computed here rather than recomputed
    // at save time because a Discard clears the solution text before saving,
    // which would otherwise zero out the chars-per-second figure. Neither
    // adds meaningful reconnaissance value beyond what integritySuspect
    // already reveals, since the dialog already told the user something
    // looked off.
    res.status(200).json({
      feedback,
      evaluation,
      integritySuspect,
      aiLikelihood,
      cps: charsPerSecond !== null ? Math.round(charsPerSecond * 100) / 100 : null
    });
  } catch (err) {
    console.error("[API/feedback] Error:", err);
    res.status(500).json({ error: "Failed to get feedback" });
  }
}

export default withAuth(withRateLimit(handler, { name: "llm", limit: 20, windowMs: 60_000 }));
