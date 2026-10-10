import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Rating, Review } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// Passenger rates a completed trip. One rating per phone per trip; a driver
// can never rate themselves. Written feedback is saved as a Review that an
// admin moderates before it appears on the public profile.
export async function POST(req: Request, ctx: Ctx) {
  const { id: tripId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const database = await db.load();
  const trip = database.trips.find((t) => t.id === tripId || t.shareCode === tripId);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.status !== "completed")
    return NextResponse.json({ error: "You can rate a trip only after it is completed" }, { status: 409 });

  const phone = String(body.phone || "").trim();
  if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: "Enter a 10-digit phone number" }, { status: 400 });
  const stars = Number(body.stars);
  if (!(stars >= 1 && stars <= 5)) return NextResponse.json({ error: "Rating must be 1–5 stars" }, { status: 400 });
  // Prevent self-rating
  if (phone === trip.driverPhone)
    return NextResponse.json({ error: "You cannot rate your own trip" }, { status: 400 });
  if (database.ratings.some((r) => r.tripId === trip.id && r.fromPhone === phone))
    return NextResponse.json({ error: "You already rated this trip" }, { status: 409 });

  const cat = (v: unknown) => Math.max(1, Math.min(5, Number(v) || stars));
  const comment = String(body.comment || "").trim().slice(0, 300);
  const rating: Rating = {
    id: "r" + Date.now(),
    tripId: trip.id,
    driverId: trip.driverId,
    stars,
    driving: cat(body.driving),
    behaviour: cat(body.behaviour),
    punctuality: cat(body.punctuality),
    vehicle: cat(body.vehicle),
    comment,
    fromPhone: phone,
    createdAt: new Date().toISOString(),
  };
  database.ratings.push(rating);

  // Written feedback → moderated Review (backend-owned moderation).
  const review: Review = {
    id: "rv" + Date.now(),
    ratingId: rating.id,
    tripId: trip.id,
    driverId: trip.driverId,
    reviewerPhone: phone,
    stars,
    comment,
    status: "pending",
    createdAt: rating.createdAt,
  };
  database.reviews.push(review);

  // Aggregate into driver profile (weighted with the stored rating/count)
  const driver = database.drivers.find((d) => d.id === trip.driverId);
  if (driver) {
    const count = driver.ratingsCount || 0;
    const avg = ((driver.rating || 0) * count + stars) / (count + 1);
    driver.rating = Math.round(avg * 10) / 10;
    driver.ratingsCount = count + 1;
    trip.driverRating = driver.rating;
  }
  await db.save(database);
  return NextResponse.json({
    rating, reviewId: review.id, reviewStatus: review.status,
    driverRating: driver?.rating, ratingsCount: driver?.ratingsCount,
  });
}
