import type { DB } from "./types";

// Admin auth (Phase 4). Roles are enforced on the server by every admin route:
//  - Automation/scripts still use the shared key via `x-admin-key` (used since
//    Phase 1D and by the acceptance scripts).
//  - The admin panel logs in with the same key once and receives a short-lived,
//    revocable session (HttpOnly `pr_admin` cookie; the same token also works
//    as `Authorization: Bearer <token>` for API clients).
// The key itself lives only in env (`ADMIN_KEY`) or the dev flag (OTP_DEV=1);
// public registration can never mint admin access.

export function adminKeyOk(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  const expected = process.env.ADMIN_KEY || (process.env.OTP_DEV === "1" ? "dev123" : "");
  return !!expected && key === expected;
}

// Three ways authority is presented server-side, all validated against the
// same stores (env key / adminSessions ledger):
//  1. Automation & scripts : `x-admin-key` header
//  2. API sessions         : `Authorization: Bearer <token>`
//  3. The web panel        : the HttpOnly `pr_admin` cookie the browser sends
export function adminAuthorized(req: Request, db: DB) {
  if (adminKeyOk(req)) return true;
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const cookie = (req.headers.get("cookie") || "").match(/(?:^|;\s*)pr_admin=([^;]+)/)?.[1] || "";
  const token = auth || cookie;
  return Boolean(token) && db.adminSessions.some((s) => s.token === token);
}

// Throttle the login endpoint so an exposed key can't be brute-forced.
// Bounded in-memory map (one entry per IP) — fine for a single free-tier host.
const loginAttempts = new Map<string, { n: number; resetAt: number }>();
export function loginRateLimit(ip: string) {
  const now = Date.now();
  const e = loginAttempts.get(ip);
  if (!e || now > e.resetAt) {
    loginAttempts.set(ip, { n: 1, resetAt: now + 60000 });
    return { allowed: true, remaining: 4 };
  }
  if (e.n >= 5) return { allowed: false, remaining: 0 };
  e.n++;
  return { allowed: true, remaining: 5 - e.n };
}

export function resetLoginRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// Every privileged change is appended to the audit log: who, what, target,
// reason and timestamp. Ordinary users never touch this collection.
export function audit(db: DB, action: string, target: string, note = "", actor = "admin") {
  db.audit.push({
    id: "a" + Date.now() + Math.floor(Math.random() * 1000),
    actor,
    action,
    target,
    note,
    at: new Date().toISOString(),
  });
  if (db.audit.length > 2000) db.audit = db.audit.slice(-2000);
}

export const CHECKS = ["phone", "profile", "vehicle", "background"] as const;