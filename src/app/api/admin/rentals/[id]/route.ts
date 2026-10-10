import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Remove / restore a rental listing. Removing records the previous status so a
// valid listing can be restored verbatim after review.
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const rental = database.rentals.find((r) => r.id === id || r.shareCode === id);
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);

  if (action === "remove") {
    if (rental.status !== "removed") {
      rental.prevStatus = rental.status;
      rental.status = "removed";
    }
  } else if (action === "restore") {
    rental.status = (rental.prevStatus as typeof rental.status) || "available";
    rental.prevStatus = undefined;
  } else {
    return NextResponse.json({ error: "action must be remove or restore" }, { status: 400 });
  }

  rental.updatedAt = new Date().toISOString();
  audit(database, "rental." + action, `rental:${id}`, note);
  await db.save(database);
  return NextResponse.json({ id: rental.id, status: rental.status, prevStatus: rental.prevStatus || null });
}