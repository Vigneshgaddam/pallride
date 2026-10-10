import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit, CHECKS } from "@/lib/admin";

// Driver verification + moderation (the admin panel's driver decisions and the
// legacy smoke-test hook). Only this endpoint changes verification/status.

const ACTIONS = ["approve", "changes", "reject", "suspend", "activate"] as const;

export async function POST(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { driverId, action } = body as { driverId?: string; action?: string; note?: string };
  if (!driverId || !ACTIONS.includes(action as (typeof ACTIONS)[number]))
    return NextResponse.json({ error: "driverId and a valid action are required" }, { status: 400 });

  const driver = database.drivers.find((d) => d.id === driverId);
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);
  driver.reviewNote = note || driver.reviewNote;

  switch (action) {
    case "approve":
      driver.verification = "approved";
      // Approving implies every evidence check passed.
      for (const c of CHECKS) driver.checks![c] = true;
      driver.verified = true;
      driver.status = "active";
      break;
    case "changes":
      driver.verification = "changes_required";
      break;
    case "reject":
      driver.verification = "none";
      for (const c of CHECKS) driver.checks![c] = false;
      driver.verified = false;
      driver.status = "rejected";
      break;
    case "suspend":
      driver.status = "suspended";
      break;
    case "activate":
      driver.status = "active";
      break;
  }
  audit(database, "driver." + action, `driver:${driverId}`, note);
  await db.save(database);
  return NextResponse.json({ driver });
}