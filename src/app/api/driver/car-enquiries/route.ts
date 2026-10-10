import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Phase 3: seller enquiry inbox (newest first).
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = new Set(
    database.cars.filter((c) => c.sellerId === session.driverId).map((c) => c.id)
  );
  const enquiries = database.carEnquiries
    .filter((e) => mine.has(e.listingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => {
      const car = database.cars.find((c) => c.id === e.listingId);
      return {
        ...e,
        listing: car
          ? {
              id: car.id,
              shareCode: car.shareCode,
              title: `${car.make} ${car.model}`.trim(),
              location: car.location,
            }
          : null,
      };
    });

  return NextResponse.json({ enquiries });
}