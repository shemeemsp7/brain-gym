// backend/db.js
import { Pool } from "pg";
import { POSTGRES_URL } from "./src/config";

// Only log DB host and database, not password
try {
  const url = new URL(POSTGRES_URL);
  console.log(`[DB] Connecting to PostgreSQL: host=${url.hostname} db=${url.pathname.replace("/", "")} user=${url.username}`);
} catch (e) {
  console.log("[DB] Connecting to PostgreSQL: [unable to parse connection string]");
}

const pool = new Pool({
  connectionString: POSTGRES_URL
});

export const query = (text, params) => pool.query(text, params);
export { pool };