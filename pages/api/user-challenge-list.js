// backend/pages/api/user-challenge-list.js
import { query } from "../../db";
import { withAuth } from "../../lib/auth";

export default withAuth(async function handler(req, res) {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  // Enforce the caller is the owner
  if (String(user_id) !== String(req.user.id) && (req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const result = await query(
        `SELECT uc.id, uc.solution, uc.feedback, uc.evaluation, uc.status, uc.notes, uc.submitted_at,
                uc.remaining_time, c.prompt, c.difficulty, c.title, c.time_limit
           FROM user_challenges uc
           JOIN challenges c ON uc.challenge_id = c.id
          WHERE uc.user_id = $1
          ORDER BY uc.submitted_at DESC`,
        [String(user_id)]
      );
      return res.status(200).json({ challenges: result.rows });
    } catch (err) {
      console.error("[API/user-challenge-list] Error:", err);
      return res.status(500).json({ error: "Failed to fetch user challenges" });
    }
  } else if (req.method === "DELETE") {
    try {
      if (req.body && req.body.challenge_ids) {
        // Delete selected challenges
        const ids = req.body.challenge_ids;
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ error: "No challenge_ids provided" });
        }
        await query(
          `DELETE FROM user_challenges WHERE user_id = $1 AND id = ANY($2::bigint[])`,
          [String(user_id), ids]
        );
        return res.status(200).json({ success: true, deleted: ids.length });
      } else {
        // Delete all challenges for user
        await query(
          `DELETE FROM user_challenges WHERE user_id = $1`,
          [String(user_id)]
        );
        return res.status(200).json({ success: true, deleted: "all" });
      }
    } catch (err) {
      console.error("[API/user-challenge-list] DELETE Error:", err);
      return res.status(500).json({ error: "Failed to delete user challenges" });
    }
  } else {
    return res.status(405).end();
  }
}, { enforceUserId: true });