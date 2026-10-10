import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicRental } from "@/lib/rental-search";

// Phase 2: owner dashboard — own listings with pending enquiry counts + enquiries.
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = database.rentals.filter((l) => l.ownerId === session.driverId);
  const myIds = new Set(mine.map((l) => l.id));
  const enquiries = database.enquiries
    .filter((e) => myIds.has(e.listingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    listings: mine
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => ({
        ...publicRental(l, database),
        photos: l.photos.slice(0, 4),
        description: l.description,
        conditions: l.conditions,
        pendingCount: enquiries.filter((e) => e.listingId === l.id && e.status === "pending").length,
      })),
    enquiries,
  });
}