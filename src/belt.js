// Shared belt logic — single source of truth for thresholds (see BELT_RULES.md).
import { query } from "../db";

export function computeBelt({ medium = 0, advanced = 0, total = 0 }) {
  if (total >= 50 && medium >= 20 && advanced >= 10) return "black";
  if (total >= 40 && medium >= 15 && advanced >= 5) return "brown";
  if (total >= 30 && medium >= 10 && advanced >= 2) return "purple";
  if (total >= 20 && medium >= 5) return "blue";
  if (total >= 10 && medium >= 2) return "green";
  if (total >= 5) return "orange";
  if (total >= 1) return "yellow";
  return "white";
}

export async function getBeltStats(user_id) {
  const result = await query(
    `SELECT
      COUNT(CASE WHEN c.difficulty = 'easy' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS easy_count,
      COUNT(CASE WHEN c.difficulty = 'medium' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS medium_count,
      COUNT(CASE WHEN c.difficulty = 'advanced' AND (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS advanced_count,
      COUNT(CASE WHEN (uc.evaluation = 'correct' OR uc.evaluation = 'partially correct') THEN 1 END) AS total_completed
    FROM user_challenges uc
    LEFT JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = $1`,
    [user_id]
  );
  const s = result.rows[0] || {};
  return {
    easy: Number(s.easy_count) || 0,
    medium: Number(s.medium_count) || 0,
    advanced: Number(s.advanced_count) || 0,
    total: Number(s.total_completed) || 0
  };
}

export async function getBeltForUser(user_id) {
  return computeBelt(await getBeltStats(user_id));
}
