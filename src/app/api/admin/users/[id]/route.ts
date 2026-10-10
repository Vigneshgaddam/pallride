import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Suspend / reinstate a user. Enforced server-side everywhere: suspended or
// rejected accounts cannot publish trips, rentals or car listings.
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  if (action !== "suspend" && action !== "activate")
    return NextResponse.json({ error: "action must be suspend or activate" }, { status: 400 });

  const driver = database.drivers.find((d) => d.id === id);
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);
  if (action === "suspend" && !note)
    return NextResponse.json({ error: "A reason is required to suspend an account" }, { status: 400 });

  driver.status = action === "suspend" ? "suspended" : "active";
  driver.reviewNote = note || driver.reviewNote;
  audit(database, "user." + action, `driver:${id}`, note);
  await db.save(database);
  return NextResponse.json({
    user: { id: driver.id, name: driver.name, status: driver.status, reviewNote: driver.reviewNote },
  });
}