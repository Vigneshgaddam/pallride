import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Phase 2: owner enquiry inbox (all enquiries for own listings, newest first).
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = new Set(
    database.rentals.filter((l) => l.ownerId === session.driverId).map((l) => l.id)
  );
  const enquiries = database.enquiries
    .filter((e) => mine.has(e.listingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => {
      const listing = database.rentals.find((l) => l.id === e.listingId);
      return {
        ...e,
        listing: listing
          ? {
              id: listing.id,
              shareCode: listing.shareCode,
              title: `${listing.make} ${listing.model}`.trim(),
              location: listing.location,
            }
          : null,
      };
    });

  return NextResponse.json({ enquiries });
}