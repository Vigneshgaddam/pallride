import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// The driver's own ratings list + aggregates (auth: Bearer token).
export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = database.drivers.find((d) => d.id === session.driverId);
  const reviewBy = new Map(database.reviews.map((v) => [v.ratingId, v.status]));
  const ownRatings = database.ratings.filter((r) => r.driverId === session.driverId);
  const list = ownRatings
    .map((r) => {
      const trip = database.trips.find((t) => t.id === r.tripId);
      return {
        ...r,
        route: trip ? [trip.from, trip.to].join(" → ") : "Past trip",
        date: trip?.date || r.createdAt.slice(0, 10),
        reviewStatus: reviewBy.get(r.id) || "approved",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Averages are computed on the backend over all of this driver's rating rows.
  const rows = ownRatings.length;
  const categoryAvg = (k: "driving" | "behaviour" | "punctuality" | "vehicle") =>
    rows ? Math.round((ownRatings.reduce((n, r) => n + (r[k] || r.stars), 0) / rows) * 10) / 10 : 0;

  return NextResponse.json({
    ratings: list,
    rating: driver?.rating ?? 0,
    ratingsCount: driver?.ratingsCount ?? 0,
    categories: { driving: categoryAvg("driving"), behaviour: categoryAvg("behaviour"), punctuality: categoryAvg("punctuality"), vehicle: categoryAvg("vehicle") },
  });
}
