// backend/lib/auth.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

// Collect EVERY user identifier the request carries (body and query).
// Headers are deliberately ignored — a client-controlled header must never
// influence authorization decisions.
function extractTargetUserIds(req) {
  const body = req.body || {};
  const query = req.query || {};
  return [
    body.user_id, body.userId, body.id,
    query.user_id, query.userId, query.id
  ].filter(v => v !== undefined && v !== null && v !== "");
}

function isAdmin(session) {
  return (session?.user?.role || "").toString().toLowerCase() === "admin";
}

export async function getSessionUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return session?.user || null;
}

export function withAuth(handler, { enforceUserId = false, allowAdminOverride = true } = {}) {
  return async function withAuthWrapped(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach for downstream use
    req.session = session;
    req.user = session.user;

    if (enforceUserId) {
      // Every identifier present must match the session user — checking only
      // the first one found would let a mismatched id slip through elsewhere.
      const targetIds = extractTargetUserIds(req);
      const mismatch = targetIds.some(id => String(id) !== String(session.user.id));
      if (mismatch && !(allowAdminOverride && isAdmin(session))) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    return handler(req, res);
  };
}
