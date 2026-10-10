import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Moderate a live trip: hide (leave public search), restore, or cancel when
// authorised. Decisions record a reason in the audit trail.
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const trip = database.trips.find((t) => t.id === id || t.shareCode === id);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);

  if (action === "hide") {
    trip.hidden = true;
    if (trip.status === "published") trip.status = "published";
  } else if (action === "restore") {
    trip.hidden = false;
  } else if (action === "cancel") {
    if (!note) return NextResponse.json({ error: "A reason is required to cancel a trip" }, { status: 400 });
    trip.status = "cancelled";
    trip.hidden = false;
  } else {
    return NextResponse.json({ error: "action must be hide, restore or cancel" }, { status: 400 });
  }

  audit(database, "trip." + action, `trip:${id}`, note);
  await db.save(database);
  return NextResponse.json({ id: trip.id, status: trip.status, hidden: !!trip.hidden });
}