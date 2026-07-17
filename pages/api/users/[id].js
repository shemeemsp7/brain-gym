// backend/pages/api/users/[id].js
import { query } from "../../../db";
import { withAuth } from "../../../lib/auth";

export default withAuth(async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing user id" });

  // Enforce ownership or admin
  if (String(id) !== String(req.user.id) && (req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await query(
      "SELECT id, name, email, role, belt FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error("[API/users/[id]] Error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});