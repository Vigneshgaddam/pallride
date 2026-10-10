// Lightweight per-IP rate limiting for abuse-prone public endpoints.
// In-memory (one map), because the free-first backend is a single Node process.
// Bounded: entries older than the window are pruned on every call, so the map
// cannot grow past (requests/minute) live buckets.
type Bucket = { n: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max = 10, windowMs = 60000) {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || now > hit.resetAt) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (hit.n >= max) return { allowed: false, remaining: 0 };
  hit.n++;
  return { allowed: true, remaining: max - hit.n };
}

// Stable-ish identity without trusting proxies blindly: last x-forwarded-for
// hop (set by the host) or the socket address falling back to "local".
export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((s) => s.trim());
    return list[0] || "local";
  }
  return "local";
}

export function rateLimitReq(req: Request, scope: string, max = 10, windowMs = 60000) {
  return rateLimit(`${scope}:${clientIp(req)}`, max, windowMs);
}