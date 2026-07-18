// Daily streak computed from existing user_challenges.submitted_at — no new writes.
import { query } from "../db";

const DAY_MS = 24 * 60 * 60 * 1000;

// Parses a 'YYYY-MM-DD' string as UTC midnight. Do NOT do `new Date(pgDateValue)`
// on a raw SQL DATE result — node-pg parses SQL DATE columns into JS Date
// objects at LOCAL midnight, which silently shifts the day by one whenever
// the server process's timezone has a non-zero UTC offset (i.e. almost
// everywhere outside UTC). Selecting the date as text sidesteps that parser.
function parseUTCDateString(s) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export async function getStreak(user_id) {
  const result = await query(
    `SELECT DISTINCT TO_CHAR(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
     FROM user_challenges
     WHERE user_id = $1
     ORDER BY day DESC
     LIMIT 366`,
    [user_id]
  );
  if (result.rows.length === 0) {
    return { count: 0, active: false };
  }

  const days = result.rows.map(r => parseUTCDateString(r.day));
  const todayMs = parseUTCDateString(new Date().toISOString().slice(0, 10));
  const mostRecent = days[0];

  // The streak is only "alive" if the user trained today or yesterday.
  if (mostRecent !== todayMs && mostRecent !== todayMs - DAY_MS) {
    return { count: 0, active: false };
  }

  let count = 0;
  let cursor = mostRecent;
  for (const day of days) {
    if (day === cursor) {
      count += 1;
      cursor -= DAY_MS;
    } else if (day < cursor) {
      break;
    }
    // day > cursor can't happen: rows are DISTINCT and ordered descending.
  }

  return { count, active: mostRecent === todayMs };
}
