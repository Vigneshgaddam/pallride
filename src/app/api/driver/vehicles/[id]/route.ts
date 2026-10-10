import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// Ownership: a driver can only edit/remove their own vehicles.
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const database = await db.load();
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicle = database.vehicles.find((v) => v.id === id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (vehicle.driverId !== session.driverId) return NextResponse.json({ error: "Not your vehicle" }, { status: 403 });

  if (body.type !== undefined) vehicle.type = String(body.type);
  if (body.make !== undefined) vehicle.make = String(body.make).trim().slice(0, 40);
  if (body.model !== undefined) vehicle.model = String(body.model).trim().slice(0, 40);
  if (body.year !== undefined) vehicle.year = String(body.year).trim().slice(0, 4);
  if (body.regNumber !== undefined) vehicle.regNumber = String(body.regNumber).trim().toUpperCase().slice(0, 15);
  if (body.seats !== undefined) vehicle.seats = Math.max(1, Math.min(12, Number(body.seats) || 1));
  if (body.ac !== undefined) vehicle.ac = !!body.ac;
  if (body.fuel !== undefined) vehicle.fuel = String(body.fuel);
  if (Array.isArray(body.photos)) vehicle.photos = body.photos.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 4);

  const driver = database.drivers.find((d) => d.id === vehicle.driverId);
  if (driver) driver.vehicle = `${vehicle.model} · ${vehicle.ac ? "AC" : "Non-AC"}`;
  await db.save(database);
  return NextResponse.json({ vehicle });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const database = await db.load();
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicle = database.vehicles.find((v) => v.id === id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (vehicle.driverId !== session.driverId) return NextResponse.json({ error: "Not your vehicle" }, { status: 403 });
  database.vehicles = database.vehicles.filter((v) => v.id !== vehicle.id);
  await db.save(database);
  return NextResponse.json({ ok: true });
}
