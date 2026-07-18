// Shared belt logic — single source of truth for thresholds (see BELT_RULES.md).
import { query } from "../db";

// Each tier's requirements are a strict superset of the previous tier's, so
// tiers can be evaluated independently and the highest one satisfied wins.
export const BELT_LADDER = [
  { name: "white", total: 0, medium: 0, advanced: 0 },
  { name: "yellow", total: 1, medium: 0, advanced: 0 },
  { name: "orange", total: 5, medium: 0, advanced: 0 },
  { name: "green", total: 10, medium: 2, advanced: 0 },
  { name: "blue", total: 20, medium: 5, advanced: 0 },
  { name: "purple", total: 30, medium: 10, advanced: 2 },
  { name: "brown", total: 40, medium: 15, advanced: 5 },
  { name: "black", total: 50, medium: 20, advanced: 10 }
];

function meetsRequirement(stats, tier) {
  return stats.total >= tier.total && stats.medium >= tier.medium && stats.advanced >= tier.advanced;
}

export function computeBelt({ medium = 0, advanced = 0, total = 0 } = {}) {
  const stats = { medium, advanced, total };
  let current = BELT_LADDER[0].name;
  for (const tier of BELT_LADDER) {
    if (meetsRequirement(stats, tier)) current = tier.name;
  }
  return current;
}

// Returns how many more easy/medium/advanced completions are needed for the next belt.
export function getNextBeltProgress({ medium = 0, advanced = 0, total = 0 } = {}) {
  const stats = { medium, advanced, total };
  const currentIdx = BELT_LADDER.findIndex(tier => tier.name === computeBelt(stats));
  const next = BELT_LADDER[currentIdx + 1];
  if (!next) {
    return { current: BELT_LADDER[currentIdx].name, next: null, missing: null };
  }
  return {
    current: BELT_LADDER[currentIdx].name,
    next: next.name,
    missing: {
      total: Math.max(0, next.total - stats.total),
      medium: Math.max(0, next.medium - stats.medium),
      advanced: Math.max(0, next.advanced - stats.advanced)
    }
  };
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
