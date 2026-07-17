// backend/pages/api/leaderboard.js
import { query } from "../../db";
import { withAuth } from "../../lib/auth";
import { computeBelt } from "../../src/belt";

// Belt order for sorting (higher index = higher belt)
const BELT_ORDER = [
  "white", "yellow", "orange", "green", "blue", "purple", "brown", "black"
];

function beltRank(belt) {
  const idx = BELT_ORDER.indexOf((belt || "white").toLowerCase());
  return idx === -1 ? 0 : idx;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { user_id, all } = req.query;
  const returnAll = String(all || "").toLowerCase() === "true" || String(all) === "1";
  if (returnAll && (req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Get all users with their challenge stats
    const result = await query(`
      SELECT
        u.id,
        u.name,
        u.belt,
        COUNT(CASE WHEN c.difficulty = 'easy' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS easy_count,
        COUNT(CASE WHEN c.difficulty = 'medium' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS medium_count,
        COUNT(CASE WHEN c.difficulty = 'advanced' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS advanced_count,
        COUNT(CASE WHEN (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS total_completed,
        MAX(uc.submitted_at) AS last_submission
      FROM users u
      LEFT JOIN user_challenges uc ON uc.user_id = u.id
      LEFT JOIN challenges c ON uc.challenge_id = c.id
      GROUP BY u.id, u.name, u.belt
    `);

    // Calculate score and sort
    let users = result.rows.map(u => {
      const easy = Number(u.easy_count) || 0;
      const medium = Number(u.medium_count) || 0;
      const advanced = Number(u.advanced_count) || 0;
      const total = Number(u.total_completed) || 0;
      const belt = computeBelt({ medium, advanced, total });
      return {
        ...u,
        belt,
        score: easy * 1 + medium * 3 + advanced * 7,
        belt_rank: beltRank(belt),
      };
    });

    // Sort: belt (desc), score (desc), advanced (desc), medium (desc), last_submission (asc)
    users.sort((a, b) => {
      if (b.belt_rank !== a.belt_rank) return b.belt_rank - a.belt_rank;
      if (b.score !== a.score) return b.score - a.score;
      if (b.advanced_count !== a.advanced_count) return b.advanced_count - a.advanced_count;
      if (b.medium_count !== a.medium_count) return b.medium_count - a.medium_count;
      if (a.last_submission && b.last_submission) {
        return new Date(a.last_submission) - new Date(b.last_submission);
      }
      return 0;
    });

    // Assign rank to all
    users = users.map((u, i) => ({ ...u, rank: i + 1 }));

    // Top 10 (default)
    const top10 = users.slice(0, 10);

    // Current user (if not in top 10)
    let currentUser = null;
    if (user_id) {
      currentUser = users.find(u => String(u.id) === String(user_id));
      if (currentUser && !top10.some(u => u.id === currentUser.id)) {
        currentUser.isCurrent = true;
      } else {
        currentUser = null;
      }
    }

    const payload = {
      leaderboard: returnAll ? users : top10,
      currentUser: returnAll ? null : currentUser
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error("[API/leaderboard] Error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}, { enforceUserId: false });
