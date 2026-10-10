import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicTrip, seatState } from "@/lib/seats";

// Driver's own trips (authenticated) with pending-request counts.
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = database.trips
    .filter((t) => t.driverId === session.driverId)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .map((t) => {
      const { availableSeats, availability, heldSeats } = seatState(t, database.requests);
      const pending = database.requests.filter((r) => r.tripId === t.id && r.status === "pending").length;
      return { ...publicTrip(t, database.requests), availableSeats, availability, heldSeats, pendingRequests: pending };
    });
  return NextResponse.json({ trips });
}
