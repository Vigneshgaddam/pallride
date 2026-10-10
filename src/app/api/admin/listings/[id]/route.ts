import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Remove / restore a used-car listing (same semantics as rentals).
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const car = database.cars.find((c) => c.id === id || c.shareCode === id);
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);

  if (action === "remove") {
    if (car.status !== "removed") {
      car.prevStatus = car.status;
      car.status = "removed";
    }
  } else if (action === "restore") {
    car.status = (car.prevStatus as typeof car.status) || "published";
    car.prevStatus = undefined;
  } else {
    return NextResponse.json({ error: "action must be remove or restore" }, { status: 400 });
  }

  car.updatedAt = new Date().toISOString();
  audit(database, "listing." + action, `car:${id}`, note);
  await db.save(database);
  return NextResponse.json({ id: car.id, status: car.status, prevStatus: car.prevStatus || null });
}