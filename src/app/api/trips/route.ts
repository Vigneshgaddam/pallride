import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTrip } from "@/lib/validate";
import { publicTrip } from "@/lib/seats";
import { parseTripQuery, searchTrips } from "@/lib/trip-search";
import { newShareCode } from "@/lib/utils";
import { rateLimitReq } from "@/lib/rates";
import type { Trip } from "@/lib/types";

export async function GET(req: Request) {
  const database = await db.load();
  const q = parseTripQuery(Object.fromEntries(new URL(req.url).searchParams));
  const result = await searchTrips(q, database);
  return NextResponse.json({
    trips: result.trips,
    total: result.total,
    page: result.page,
    pageCount: result.pageCount,
  });
}

export async function POST(req: Request) {
  const lim = rateLimitReq(req, "trips.post", 10, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const body = (await req.json()) as Partial<Trip> & { token?: string; publish?: boolean };
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId)!;
  if (driver.status === "suspended" || driver.status === "rejected")
    return NextResponse.json({ error: "Your account cannot publish trips right now" }, { status: 403 });
  const err = validateTrip(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const stops = Array.isArray(body.stops)
    ? body.stops.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
    : [];

  const trip: Trip = {
    id: "t" + Date.now(),
    shareCode: newShareCode(new Set(database.trips.map((t) => t.shareCode))),
    from: body.from!.trim(),
    to: body.to!.trim(),
    stops,
    date: body.date!,
    time: body.time!,
    priceLo: Number(body.priceLo),
    priceHi: Number(body.priceHi) || Number(body.priceLo),
    seatsTotal: Number(body.seatsTotal) || 4,
    seatsTaken: [],
    car: body.car || driver.vehicle || "AC car",
    ac: body.ac !== undefined ? !!body.ac : /\bAC\b/i.test(body.car || driver.vehicle || ""),
    luggage: !!body.luggage,
    notes: String(body.notes || "").trim().slice(0, 300),
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    driverVerified: driver.verified,
    driverRating: driver.rating,
    status: body.publish === false ? "draft" : "published",
    createdAt: new Date().toISOString(),
  };
  database.trips.unshift(trip);
  driver.tripsCount++;
  await db.save(database);
  return NextResponse.json({ trip: publicTrip(trip, database.requests) });
}
