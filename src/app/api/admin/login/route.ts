import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { loginRateLimit, resetLoginRateLimit } from "@/lib/admin";

// Provision the admin panel session. Public registration can never reach here:
// the shared key (ADMIN_KEY env, or dev flag OTP_DEV=1) is required, and the
// endpoint is rate-limited per IP.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = loginRateLimit(ip);
  if (!rl.allowed)
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_KEY || (process.env.OTP_DEV === "1" ? "dev123" : "");
  if (!expected || String(body.key || "") !== expected)
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });

  resetLoginRateLimit(ip);
  const database = await db.load();
  const token = "adm_" + randomBytes(24).toString("hex");
  database.adminSessions.push({ token, createdAt: new Date().toISOString() });
  await db.save(database);

  const res = NextResponse.json({ ok: true });
  const https = (req.headers.get("x-forwarded-proto") || "http").includes("https");
  res.cookies.set("pr_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
    secure: https, // secure only once actually behind TLS (Render sets x-forwarded-proto)
  });
  return res;
}