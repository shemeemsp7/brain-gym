// backend/pages/api/user-challenge.js
import { query } from "../../db";
import { withAuth } from "../../lib/auth";
import { getBeltForUser } from "../../src/belt";

const VALID_STATUSES = ["completed", "not_completed", "in_progress"];
// ai_suspect_discarded is recorded purely for aggregate reporting (e.g. "the
// system flags N/week and users self-correct M% of the time") — it never
// affects scoring/belt and is never shown to the user as a warning.
const ALLOWED_INTEGRITY_FLAGS = ["paste_confirmed", "ai_suspect_confirmed", "ai_suspect_discarded"];
const AI_LIKELIHOOD_VALUES = ["low", "medium", "high"];
const MAX_INTEGRITY_EVENTS_PER_SAVE = 5;

// Collapse whitespace so cosmetic differences don't create duplicate challenge rows.
function normalizePrompt(prompt) {
  return String(prompt).replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

// Whitelist + cap client-reported integrity events; the server stamps its own
// timestamp so the ledger can't be backdated or forged. aiLikelihood/cps for
// ai_suspect_* events are echoed from /api/feedback's response (computed once,
// at detection time) rather than recomputed here — a Discard clears the
// solution text before this save fires, which would otherwise zero out a
// server-recomputed chars-per-second figure. Neither field affects scoring.
function sanitizeIntegrityEvents(events) {
  if (!Array.isArray(events)) return [];
  const at = new Date().toISOString();
  return events
    .filter(e => e && typeof e === "object" && ALLOWED_INTEGRITY_FLAGS.includes(e.flag))
    .slice(0, MAX_INTEGRITY_EVENTS_PER_SAVE)
    .map(e => {
      const entry = { flag: e.flag, at };
      if (e.flag === "paste_confirmed" && Number.isFinite(e.chars)) {
        entry.chars = Math.max(0, Math.round(e.chars));
      }
      if (e.flag === "ai_suspect_confirmed" || e.flag === "ai_suspect_discarded") {
        if (AI_LIKELIHOOD_VALUES.includes(e.aiLikelihood)) {
          entry.aiLikelihood = e.aiLikelihood;
        }
        if (Number.isFinite(e.cps)) {
          entry.cps = Math.max(0, Math.round(e.cps * 100) / 100);
        }
      }
      return entry;
    });
}

async function determineAndUpdateBelt(user_id) {
  const belt = await getBeltForUser(user_id);
  await query("UPDATE users SET belt = $1 WHERE id = $2", [belt, user_id]);
  return belt;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let { user_id, prompt, title, difficulty, solution, feedback, evaluation, status, notes, time_limit, remaining_time, time_taken, clarity_rating, integrity_events } = req.body || {};

  // solution may legitimately be an empty string (e.g. a discarded attempt
  // being cleared for an honest redo) — require the field, not truthiness.
  if (!user_id || !prompt || !title || !difficulty || typeof solution !== "string" || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (clarity_rating !== undefined && clarity_rating !== null) {
    if (!Number.isInteger(clarity_rating) || clarity_rating < 1 || clarity_rating > 5) {
      return res.status(400).json({ error: "clarity_rating must be an integer from 1 to 5" });
    }
  }

  // Ensure user_id is always a string (for TEXT PK)
  user_id = String(user_id);

  // Enforce the caller is the owner
  if (user_id !== String(req.user.id) && (req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  prompt = normalizePrompt(prompt);
  const integrityEvents = sanitizeIntegrityEvents(integrity_events);

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

    // 2. Upsert user_challenge (override if exists). clarity_rating is only
    // touched when explicitly provided — autosave calls omit it, and must
    // not clobber a rating the user already gave. integrity_flags always
    // appends (never replaces) so the ledger accumulates across saves.
    const upsert = await query(
      `INSERT INTO user_challenges (user_id, challenge_id, solution, feedback, evaluation, status, notes, remaining_time, time_taken, clarity_rating, integrity_flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id, challenge_id)
       DO UPDATE SET solution = $3, feedback = $4, evaluation = $5, status = $6, notes = $7, remaining_time = $8, time_taken = $9,
         clarity_rating = COALESCE($10, user_challenges.clarity_rating),
         integrity_flags = user_challenges.integrity_flags || $11::jsonb,
         submitted_at = NOW()
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
        typeof time_taken === "number" ? time_taken : null,
        clarity_rating ?? null,
        JSON.stringify(integrityEvents)
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
