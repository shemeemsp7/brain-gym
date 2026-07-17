// backend/pages/api/auth/register.js
import crypto from "crypto";
import { query } from "../../../db";
import bcrypt from "bcrypt";
import { withRateLimit } from "../../../src/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, password } = req.body || {};
  if (typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    // Role is always 'user' — admins are promoted directly in the DB, never via this endpoint.
    const result = await query(
      `INSERT INTO users (id, name, email, password_hash, role, provider)
       VALUES ($1, $2, $3, $4, 'user', 'credentials')
       RETURNING id, name, email, role`,
      [crypto.randomUUID(), name.trim(), email.trim().toLowerCase(), password_hash]
    );
    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error("[API/auth/register] Registration failed:", err.code || err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
}

export default withRateLimit(handler, { name: "register", limit: 5, windowMs: 60_000 });
