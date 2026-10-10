import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Booking request directory (joined with trip + driver), for investigations.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 20;

  const filtered = database.requests
    .filter((r) => (!status || r.status === status))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return NextResponse.json({
    bookings: slice.map((r) => {
      const trip = database.trips.find((t) => t.id === r.tripId);
      const driver = trip && database.drivers.find((d) => d.id === trip.driverId);
      return {
        id: r.id, tripId: r.tripId, name: r.name, phone: r.phone, seats: r.seats,
        status: r.status, createdAt: r.createdAt,
        trip: trip ? `${trip.from} → ${trip.to} · ${trip.date} ${trip.time}` : "",
        driverName: driver?.name || trip?.driverName || "",
      };
    }),
    total, page, pageCount,
  });
}