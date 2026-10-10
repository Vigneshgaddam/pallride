import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Revoke the current admin session and clear the cookie.
export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/(?:^|;\s*)pr_admin=([^;]+)/)?.[1] || "";
  const database = await db.load();
  if (token) database.adminSessions = database.adminSessions.filter((s) => s.token !== token);
  await db.save(database);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pr_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}