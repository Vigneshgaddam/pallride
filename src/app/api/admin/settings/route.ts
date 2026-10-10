import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

// Instance settings: operator label (shown on the audit trail) and the
// admin-configured status. No secrets are ever returned.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const hasKey = !!process.env.ADMIN_KEY || process.env.OTP_DEV === "1";
  return NextResponse.json({
    settings: database.settings,
    instance: { dev: process.env.OTP_DEV === "1", adminConfigured: hasKey },
  });
}

export async function PATCH(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (body.operator !== undefined) {
    database.settings.operator = String(body.operator).trim().slice(0, 80) || "PalleRide Team";
  }
  if (body.maintenance !== undefined) {
    database.settings.maintenance = !!body.maintenance;
  }
  audit(database, "settings.update", "instance", "Operator or maintenance flag updated");
  await db.save(database);
  return NextResponse.json({ settings: database.settings });
}