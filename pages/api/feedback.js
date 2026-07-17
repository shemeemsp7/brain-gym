// backend/pages/api/feedback.js
import { getFeedbackPrompt } from "../../src/challenge/prompts";
import { chatCompletion } from "../../src/llmClient";
import { withAuth } from "../../lib/auth";
import { withRateLimit } from "../../src/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { challenge, solution } = req.body || {};
  if (typeof challenge !== "string" || !challenge || typeof solution !== "string" || !solution) {
    return res.status(400).json({ error: "Missing challenge or solution" });
  }

  const prompt = getFeedbackPrompt(challenge, solution, req.user);

  try {
    const content = await chatCompletion(prompt);
    let feedback = "";
    let evaluation = "";
    try {
      const parsed = JSON.parse(content || "{}");
      feedback = parsed.feedback || "";
      evaluation = parsed.evaluation || "";
    } catch {
      feedback = content || "Failed to get feedback. Please try again.";
      evaluation = "";
    }
    res.status(200).json({ feedback, evaluation });
  } catch (err) {
    console.error("[API/feedback] Error:", err);
    res.status(500).json({ error: "Failed to get feedback" });
  }
}

export default withAuth(withRateLimit(handler, { name: "llm", limit: 20, windowMs: 60_000 }));
