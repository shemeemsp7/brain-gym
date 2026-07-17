// Simple in-memory fixed-window rate limiter.
// Good enough for a single-replica deployment; swap for a Redis-backed
// limiter (or enforce at the Istio gateway) if the app scales horizontally.
const buckets = new Map();

function keyFor(req, name) {
  const id = req.user?.id;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  return `${name}:${id || ip}`;
}

// Periodically drop expired buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, 60_000).unref?.();

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param {string} name  bucket name, e.g. "llm" or "auth"
 * @param {number} limit max requests per window
 * @param {number} windowMs window length in ms
 */
export function checkRateLimit(req, name, limit, windowMs) {
  const key = keyFor(req, name);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Wraps a handler with a rate limit; responds 429 when exceeded. */
export function withRateLimit(handler, { name, limit, windowMs }) {
  return async function rateLimited(req, res) {
    if (!checkRateLimit(req, name, limit, windowMs)) {
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }
    return handler(req, res);
  };
}
