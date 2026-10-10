import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit, CHECKS } from "@/lib/admin";
import type { VerifCheck, VerificationStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// Review decisions for a driver's verification. `check` toggles one evidence
// check; `approve`/`changes`/`reject` set the overall status. The reviewer
// note and every transition land in the audit log.
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  const driver = database.drivers.find((d) => d.id === id);
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);
  driver.checks ??= {};

  if (action === "check") {
    const check = String(body.check || "") as VerifCheck;
    if (!(CHECKS as readonly string[]).includes(check))
      return NextResponse.json({ error: "Unknown check" }, { status: 400 });
    driver.checks[check] = !!body.ok;
    if (note) driver.reviewNote = note;
    audit(database, "verification.check", `driver:${id}`, `${check}=${driver.checks[check]} ${note}`);
  } else if (action === "approve" || action === "changes" || action === "reject") {
    const map: Record<string, VerificationStatus> = {
      approve: "approved",
      changes: "changes_required",
      reject: "none",
    };
    driver.verification = map[action];
    driver.reviewNote = note;
    if (action === "approve") {
      for (const c of CHECKS) driver.checks[c] = true;
      driver.verified = true;
      driver.status = "active";
    }
    if (action === "reject") {
      for (const c of CHECKS) driver.checks[c] = false;
      driver.verified = false;
      driver.status = "rejected";
    }
    audit(database, "verification." + action, `driver:${id}`, note);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await db.save(database);
  return NextResponse.json({
    driver: {
      id: driver.id,
      verification: driver.verification,
      status: driver.status,
      verified: driver.verified,
      checks: Object.fromEntries(CHECKS.map((c) => [c, driver.checks![c] === true])),
      reviewNote: driver.reviewNote,
    },
  });
}