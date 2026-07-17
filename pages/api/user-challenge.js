// backend/pages/api/user-challenge.js
import { query } from "../../db";
import { withAuth } from "../../lib/auth";
import { getBeltForUser } from "../../src/belt";

const VALID_STATUSES = ["completed", "not_completed", "in_progress"];

// Collapse whitespace so cosmetic differences don't create duplicate challenge rows.
function normalizePrompt(prompt) {
  return String(prompt).replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

async function determineAndUpdateBelt(user_id) {
  const belt = await getBeltForUser(user_id);
  await query("UPDATE users SET belt = $1 WHERE id = $2", [belt, user_id]);
  return belt;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let { user_id, prompt, title, difficulty, solution, feedback, evaluation, status, notes, time_limit, remaining_time, time_taken } = req.body || {};

  if (!user_id || !prompt || !title || !difficulty || !solution || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Ensure user_id is always a string (for TEXT PK)
  user_id = String(user_id);

  // Enforce the caller is the owner
  if (user_id !== String(req.user.id) && (req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  prompt = normalizePrompt(prompt);

  try {
    // 1. Insert or get challenge (now with title and time_limit)
    let challengeResult = await query(
      "SELECT id FROM challenges WHERE prompt = $1 AND difficulty = $2",
      [prompt, difficulty]
    );
    let challenge_id;
    if (challengeResult.rows.length === 0) {
      const insertChallenge = await query(
        "INSERT INTO challenges (title, prompt, difficulty, time_limit) VALUES ($1, $2, $3, $4) RETURNING id",
        [title, prompt, difficulty, time_limit || 60]
      );
      challenge_id = insertChallenge.rows[0].id;
    } else {
      challenge_id = challengeResult.rows[0].id;
    }

    // 2. Upsert user_challenge (override if exists)
    const upsert = await query(
      `INSERT INTO user_challenges (user_id, challenge_id, solution, feedback, evaluation, status, notes, remaining_time, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, challenge_id)
       DO UPDATE SET solution = $3, feedback = $4, evaluation = $5, status = $6, notes = $7, remaining_time = $8, time_taken = $9, submitted_at = NOW()
       RETURNING *`,
      [
        user_id,
        challenge_id,
        solution,
        feedback,
        evaluation,
        status,
        notes || null,
        typeof remaining_time === "number" ? remaining_time : null,
        typeof time_taken === "number" ? time_taken : null
      ]
    );

    // 3. Update belt after challenge save
    const belt = await determineAndUpdateBelt(user_id);

    return res.status(200).json({ saved: true, user_challenge: upsert.rows[0], belt });
  } catch (err) {
    console.error("[API/user-challenge] Error:", err);
    return res.status(500).json({ error: "Failed to save challenge" });
  }
}, { enforceUserId: true });
