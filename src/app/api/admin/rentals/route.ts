import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Rental listing moderation queue.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 20;

  const filtered = database.rentals
    .filter((r) => (!status || r.status === status))
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return NextResponse.json({
    rentals: slice.map((r) => ({
      id: r.id, shareCode: r.shareCode, make: r.make, model: r.model, year: r.year,
      location: r.location, pricePerDay: r.pricePerDay, seats: r.seats, ac: r.ac,
      status: r.status, prevStatus: r.prevStatus || null,
      owner: database.drivers.find((d) => d.id === r.ownerId)?.name || "",
      enquiries: database.enquiries.filter((e) => e.listingId === r.id && e.status === "pending").length,
    })),
    total, page, pageCount,
  });
}