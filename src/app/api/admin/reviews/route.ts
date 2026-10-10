import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Review moderation queue. GET returns everyone the current admin status
// requested (default: pending) — approving a review makes it public on the
// driver profile, hiding it moderates it away.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";
  const filtered = database.reviews
    .filter((v) => (!status || v.status === status))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const byPhone = new Map(database.drivers.map((d) => [d.phone.replace(/^0+/, ""), d.name]));
  const byId = new Map(database.drivers.map((d) => [d.id, d.name]));
  return NextResponse.json({
    reviews: filtered.map((v) => ({
      ...v,
      stars: v.stars,
      riderName: byPhone.get(v.reviewerPhone.replace(/^0+/, "")) || v.reviewerPhone,
      driverName: byId.get(v.driverId) || "",
    })),
  });
}