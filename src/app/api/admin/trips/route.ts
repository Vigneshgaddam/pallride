import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";
import { effectiveStatus } from "@/lib/seats";

// Trip moderation queue (paginated, status-filtered). Public search hides
// `hidden` trips and the admin can load related booking counts.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 20;

  const filtered = database.trips
    .map((t) => ({ ...t, effective: t.hidden ? "hidden" : effectiveStatus(t) }))
    .filter((t) => (!status || t.effective === status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return NextResponse.json({
    trips: slice.map((t) => ({
      id: t.id, shareCode: t.shareCode, from: t.from, to: t.to, stops: t.stops,
      date: t.date, time: t.time, priceLo: t.priceLo, priceHi: t.priceHi,
      seatsTotal: t.seatsTotal, seatsTaken: t.seatsTaken, car: t.car,
      driverId: t.driverId, driverName: t.driverName, status: t.effective, hidden: !!t.hidden,
      bookings: database.requests.filter((r) => r.tripId === t.id && r.status === "pending").length,
    })),
    total, page, pageCount,
  });
}