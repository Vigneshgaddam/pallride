import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seatState } from "@/lib/seats";

type Ctx = { params: Promise<{ driverId: string }> };

// Public driver profile for /drivers/[driverId].
// Strips private fields: phone, email, googleSub, regNumber, session data.
export async function GET(_req: Request, ctx: Ctx) {
  const { driverId } = await ctx.params;
  const database = await db.load();
  const driver = database.drivers.find((d) => d.id === driverId);
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ratings that are not moderated away
  const hidden = new Set(
    database.reviews.filter((v) => v.status === "hidden" && v.driverId === driver.id).map((v) => v.ratingId)
  );
  const allRatings = database.ratings.filter((r) => r.driverId === driver.id && !hidden.has(r.id));
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: allRatings.filter((r) => r.stars === stars).length,
  }));
  const count = allRatings.length;
  const avg = count ? Math.round((allRatings.reduce((n, r) => n + r.stars, 0) / count) * 10) / 10 : 0;
  const category = (k: "driving" | "behaviour" | "punctuality" | "vehicle") =>
    count ? Math.round((allRatings.reduce((n, r) => n + (r[k] || r.stars), 0) / count) * 10) / 10 : 0;

  const vehicle = database.vehicles.find((v) => v.driverId === driver.id);
  const approvedReviews = database.reviews
    .filter((v) => v.driverId === driver.id && v.status === "approved" && v.comment)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)
    .map(({ id, stars, comment, createdAt }) => ({ id, stars, comment, createdAt }));

  const trips = driver.status === "active"
    ? database.trips
        .filter((t) => t.driverId === driver.id && (t.status === "published" || t.status === "started"))
        .map((t) => ({ trip: t, state: seatState(t, database.requests) }))
        .filter(({ trip, state }) => state.availableSeats > 0 && !(trip.date < new Date().toISOString().slice(0, 10)))
        .sort((a, b) => (a.trip.date + a.trip.time).localeCompare(b.trip.date + b.trip.time))
        .slice(0, 3)
        .map(({ trip, state }) => ({
          id: trip.id, shareCode: trip.shareCode, from: trip.from, to: trip.to, stops: trip.stops,
          date: trip.date, time: trip.time, priceLo: trip.priceLo, priceHi: trip.priceHi,
          availableSeats: state.availableSeats, ac: trip.ac,
        }))
    : [];

  return NextResponse.json({
    driver: {
      id: driver.id, name: driver.name, photo: driver.photo, about: driver.about,
      serviceAreas: driver.serviceAreas, verified: driver.verified, verification: driver.verification,
      rating: driver.rating, ratingsCount: driver.ratingsCount, tripsCount: driver.tripsCount,
      cancellations: driver.cancellations, joined: driver.createdAt,
      vehicle: vehicle ? {
        type: vehicle.type, make: vehicle.make, model: vehicle.model, year: vehicle.year,
        seats: vehicle.seats, ac: vehicle.ac, fuel: vehicle.fuel,
      } : null,
    },
    summary: { distribution, count, avg, category },
    reviews: approvedReviews,
    recentTrips: trips,
  });
}