import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicTrip, seatState } from "@/lib/seats";

async function driverOf(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  const driver = session && database.drivers.find((d) => d.id === session.driverId);
  return { database, driver };
}

// Booking requests for this driver's trips (newest first)
export async function GET(req: Request) {
  const { database, driver } = await driverOf(req);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripIds = new Set(database.trips.filter((t) => t.driverId === driver.id).map((t) => t.id));
  const list = database.requests
    .filter((r) => tripIds.has(r.tripId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const trip = database.trips.find((t) => t.id === r.tripId)!;
      return {
        ...r,
        trip: publicTrip(trip, database.requests),
        tripAvailable: seatState(trip, database.requests).availableSeats,
      };
    });
  return NextResponse.json({ requests: list, unread: database.notifications.filter((n) => n.driverId === driver.id && !n.read).length });
}
