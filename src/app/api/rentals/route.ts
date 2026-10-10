import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRental } from "@/lib/validate";
import { newShareCode } from "@/lib/utils";
import type { RentalListing } from "@/lib/types";
import { parseRentalQuery, searchRentals, publicRental } from "@/lib/rental-search";
import { rateLimitReq } from "@/lib/rates";

// Phase 2: public rental feed (GET) + create a rental draft (POST).
export async function GET(req: Request) {
  const database = await db.load();
  const q = parseRentalQuery(Object.fromEntries(new URL(req.url).searchParams));
  const result = await searchRentals(q, database);
  return NextResponse.json({
    listings: result.listings,
    total: result.total,
    page: result.page,
    pageCount: result.pageCount,
  });
}

export async function POST(req: Request) {
  const lim = rateLimitReq(req, "rentals.post", 10, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const body = (await req.json()) as Partial<RentalListing> & { token?: string };
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId)!;
  if (driver.status === "suspended" || driver.status === "rejected")
    return NextResponse.json({ error: "Your account cannot publish rentals right now" }, { status: 403 });
  const err = validateRental(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const now = new Date().toISOString();
  const listing: RentalListing = {
    id: "rn" + Date.now(),
    shareCode: newShareCode(new Set(database.trips.map((t) => t.shareCode).concat(database.rentals.map((r) => r.shareCode)))),
    ownerId: driver.id,
    make: String(body.make || "").trim(),
    model: String(body.model || "").trim(),
    year: String(body.year || "").trim(),
    photos: Array.isArray(body.photos) ? body.photos.map((p) => String(p).trim()).filter(Boolean).slice(0, 8) : [],
    location: String(body.location || "").trim(),
    seats: Number(body.seats) || 4,
    ac: !!body.ac,
    pricePerDay: Number(body.pricePerDay),
    unit: "day",
    description: String(body.description || "").trim().slice(0, 500),
    conditions: String(body.conditions || "").trim().slice(0, 500),
    availableFrom: String(body.availableFrom || ""),
    availableTo: String(body.availableTo || ""),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  database.rentals.unshift(listing);
  await db.save(database);
  return NextResponse.json({ listing: publicRental(listing, database) });
}