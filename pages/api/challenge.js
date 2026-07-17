// backend/pages/api/challenge.js
import { getChallengePrompt } from "../../src/challenge/prompts";
import { chatCompletion } from "../../src/llmClient";
import { withAuth } from "../../lib/auth";
import { withRateLimit } from "../../src/rateLimit";

const LEVELS = ["easy", "medium", "advanced"];

function extractTitleFromPrompt(prompt) {
  // Try to extract a markdown heading or first non-empty line as title
  if (!prompt) return "";
  const lines = prompt.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return prompt.slice(0, 60) + "...";
  const heading = lines.find(l => l.startsWith("#")) || lines[0];
  return heading.replace(/^#+/, "").trim().slice(0, 120) + (heading.length > 120 ? "..." : "");
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { level } = req.body || {};
  if (!LEVELS.includes(level)) {
    return res.status(400).json({ error: "Invalid or missing level" });
  }

  // The prompt is built from the authenticated session user, never from the body.
  const prompt = getChallengePrompt(req.user, level);

  try {
    const content = await chatCompletion(prompt);
    let challengeObj;
    try {
      challengeObj = JSON.parse(content || "{}");
    } catch {
      challengeObj = { prompt: content || "Failed to fetch challenge.", timeLimit: 60 };
    }
    challengeObj.title = challengeObj.title || extractTitleFromPrompt(challengeObj.prompt);
    res.status(200).json(challengeObj);
  } catch (err) {
    console.error("[API/challenge] Error:", err);
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
}

export default withAuth(withRateLimit(handler, { name: "llm", limit: 20, windowMs: 60_000 }));
