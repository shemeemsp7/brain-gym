// backend/pages/api/clarify.js
import { getClarificationPrompt } from "../../src/challenge/prompts";
import { chatCompletion } from "../../src/llmClient";
import { withAuth } from "../../lib/auth";
import { withRateLimit } from "../../src/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { challenge, question } = req.body || {};
  if (typeof challenge !== "string" || !challenge || typeof question !== "string" || !question) {
    return res.status(400).json({ error: "Missing challenge or question" });
  }

  const prompt = getClarificationPrompt(challenge, question, req.user);

  try {
    const content = await chatCompletion(prompt);
    const clarification = content || "Failed to get clarification. Please try again.";
    res.status(200).json({ clarification });
  } catch (err) {
    console.error("[API/clarify] Error:", err);
    res.status(500).json({ error: "Failed to get clarification" });
  }
}

export default withAuth(withRateLimit(handler, { name: "llm", limit: 20, windowMs: 60_000 }));
