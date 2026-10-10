import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTrip } from "@/lib/validate";
import { publicTrip, seatState } from "@/lib/seats";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const database = await db.load();
  const { trips, requests } = database;
  const trip = trips.find((t) => t.id === id || t.shareCode === id);
  if (!trip || trip.hidden) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { heldSeats } = seatState(trip, requests);
  return NextResponse.json({
    trip: {
      ...publicTrip(trip, requests),
      seatsTaken: trip.seatsTaken,
      seatsHeld: heldSeats,
      driverPhone: trip.driverPhone,
      driverTrips: database.drivers.find((d) => d.id === trip.driverId)?.tripsCount ?? 0,
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trip = database.trips.find((t) => t.id === id || t.shareCode === id);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.driverId !== session.driverId) return NextResponse.json({ error: "Not your trip" }, { status: 403 });

  const owner = database.drivers.find((d) => d.id === session.driverId);
  const blocked = owner?.status === "suspended" || owner?.status === "rejected";

  const transitions: Record<string, typeof trip.status> = {
    publish: "published", start: "started", complete: "completed",
    cancel: "cancelled", reopen: "published",
  };

  if (body.action && transitions[body.action]) {
    if (blocked && (body.action === "publish" || body.action === "start"))
      return NextResponse.json({ error: "Your account cannot publish trips right now" }, { status: 403 });
    trip.status = transitions[body.action];
    if (body.action === "cancel" && owner) owner.cancellations = (owner.cancellations || 0) + 1;
  } else if (body.action === "seats") {
    // Manual seat override (driver marks booked seats offline)
    const seats: number[] = Array.isArray(body.seats) ? body.seats : [];
    trip.seatsTaken = [...new Set(seats)].filter((n) => n >= 1 && n <= trip.seatsTotal).sort((a, b) => a - b);
  } else {
    const merged = { ...trip, ...body, id: trip.id, shareCode: trip.shareCode, driverId: trip.driverId };
    const err = validateTrip(merged);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    trip.from = merged.from!.trim();
    trip.to = merged.to!.trim();
    trip.stops = Array.isArray(merged.stops)
      ? (merged.stops as unknown[]).map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
      : trip.stops;
    trip.date = merged.date!;
    trip.time = merged.time!;
    trip.priceLo = Number(merged.priceLo);
    trip.priceHi = Number(merged.priceHi) || Number(merged.priceLo);
    trip.seatsTotal = Number(merged.seatsTotal);
    trip.car = merged.car || trip.car;
    trip.ac = merged.ac !== undefined ? !!merged.ac : trip.ac;
    trip.luggage = merged.luggage !== undefined ? !!merged.luggage : trip.luggage;
    trip.notes = merged.notes !== undefined ? String(merged.notes).trim().slice(0, 300) : trip.notes;
    trip.seatsTaken = trip.seatsTaken.filter((n) => n <= trip.seatsTotal);
  }
  await db.save(database);
  const { heldSeats, availableSeats, availability } = seatState(trip, database.requests);
  return NextResponse.json({
    trip: { ...publicTrip(trip, database.requests), seatsHeld: heldSeats, availableSeats, availability },
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({} as { token?: string }));
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trip = database.trips.find((t) => t.id === id || t.shareCode === id);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.driverId !== session.driverId) return NextResponse.json({ error: "Not your trip" }, { status: 403 });
  database.trips = database.trips.filter((t) => t.id !== trip.id);
  await db.save(database);
  return NextResponse.json({ ok: true });
}
