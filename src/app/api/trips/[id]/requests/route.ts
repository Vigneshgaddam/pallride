import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seatState } from "@/lib/seats";
import { rateLimitReq } from "@/lib/rates";

type Ctx = { params: Promise<{ id: string }> };

// Passenger creates a booking request → seats are HELD server-side
// until the driver confirms or rejects. Availability is never trusted from the browser.
export async function POST(req: Request, ctx: Ctx) {
  const lim = rateLimitReq(req, "bookings", 10, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const { id } = await ctx.params;
  const body = await req.json();
  const rawSeats: unknown = body.seats;
  const seats: number[] = Array.isArray(rawSeats)
    ? [...new Set(rawSeats.map((x) => Number(x)))].sort((a, b) => a - b)
    : [];
  const name = String(body.name || "").trim().slice(0, 50);
  const phone = String(body.phone || "").trim().slice(0, 15);

  if (!seats.length || seats.some((n) => !Number.isInteger(n) || n < 1)) {
    return NextResponse.json({ error: "Select at least one seat" }, { status: 400 });
  }
  if (!name || !/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
    return NextResponse.json({ error: "Add your name and 10-digit phone" }, { status: 400 });
  }

  const database = await db.load();
  const trip = database.trips.find((t) => t.id === id);
  if (!trip || trip.status !== "published") {
    return NextResponse.json({ error: "Trip is not open for booking" }, { status: 400 });
  }

  // A driver who blocked this contact does not get their requests.
  if (database.blocks.some((b) => b.fromPhone === trip.driverPhone && b.targetPhone === phone)) {
    return NextResponse.json({ error: "This contact is blocked by the driver" }, { status: 403 });
  }

  const { heldSeats, availableSeats } = seatState(trip, database.requests);
  const busy = new Set([...trip.seatsTaken, ...heldSeats]);
  const clash = seats.filter((n) => n > trip.seatsTotal || busy.has(n));
  if (clash.length) {
    return NextResponse.json({ error: `Seat(s) ${clash.join(", ")} no longer available` }, { status: 409 });
  }
  if (seats.length > availableSeats) {
    return NextResponse.json({ error: `Only ${availableSeats} seat(s) left` }, { status: 409 });
  }

  const request = {
    id: "b" + Date.now(),
    tripId: trip.id,
    seats,
    name,
    phone,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  database.requests.push(request);
  database.notifications.push({
    id: "n" + Date.now(),
    driverId: trip.driverId,
    text: `New request: ${seats.join(", ")} on ${trip.from} → ${trip.to}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
  await db.save(database);

  const after = seatState(trip, database.requests);
  return NextResponse.json({ request, availableSeats: after.availableSeats, availability: after.availability });
}
