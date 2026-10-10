import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// Driver confirms (seats become booked) or rejects (seats freed).
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = database.requests.find((r) => r.id === id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const trip = database.trips.find((t) => t.id === request.tripId);
  if (!trip || trip.driverId !== session.driverId) {
    return NextResponse.json({ error: "Not your request" }, { status: 403 });
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request already handled" }, { status: 409 });
  }

  if (body.action === "confirm") {
    trip.seatsTaken = [...new Set([...trip.seatsTaken, ...request.seats])].sort((a, b) => a - b);
    request.status = "confirmed";
  } else if (body.action === "reject") {
    request.status = "rejected";
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  await db.save(database);
  return NextResponse.json({ request, seatsTaken: trip.seatsTaken });
}
