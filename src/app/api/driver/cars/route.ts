import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicCar } from "@/lib/car-search";

// Phase 3: seller dashboard — own listings with pending enquiry counts + enquiries.
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = database.cars.filter((c) => c.sellerId === session.driverId);
  const myIds = new Set(mine.map((c) => c.id));
  const enquiries = database.carEnquiries
    .filter((e) => myIds.has(e.listingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    listings: mine
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => ({
        ...publicCar(c, database),
        photos: c.photos.slice(0, 4),
        description: c.description,
        ownership: c.ownership,
        pendingCount: enquiries.filter((e) => e.listingId === c.id && e.status === "pending").length,
      })),
    enquiries,
  });
}