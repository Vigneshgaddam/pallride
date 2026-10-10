import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCar } from "@/lib/validate";
import { newShareCode } from "@/lib/utils";
import type { CarListing } from "@/lib/types";
import { parseCarQuery, searchCars, publicCar } from "@/lib/car-search";
import { rateLimitReq } from "@/lib/rates";

// Phase 3: public car feed (GET) + create a sale listing draft (POST).
export async function GET(req: Request) {
  const database = await db.load();
  const q = parseCarQuery(Object.fromEntries(new URL(req.url).searchParams));
  const result = await searchCars(q, database);
  return NextResponse.json({
    cars: result.cars,
    total: result.total,
    page: result.page,
    pageCount: result.pageCount,
  });
}

export async function POST(req: Request) {
  const lim = rateLimitReq(req, "cars.post", 10, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const body = (await req.json()) as Partial<CarListing> & { token?: string };
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const seller = database.drivers.find((d) => d.id === session.driverId)!;
  if (seller.status === "suspended" || seller.status === "rejected")
    return NextResponse.json({ error: "Your account cannot sell cars right now" }, { status: 403 });
  const err = validateCar(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const now = new Date().toISOString();
  const listing: CarListing = {
    id: "c" + Date.now(),
    shareCode: newShareCode(new Set(database.trips.map((t) => t.shareCode).concat(database.rentals.map((r) => r.shareCode)).concat(database.cars.map((c) => c.shareCode)))),
    sellerId: seller.id,
    make: String(body.make || "").trim(),
    model: String(body.model || "").trim(),
    year: String(body.year || "").trim(),
    price: Number(body.price) || 0,
    location: String(body.location || "").trim(),
    fuel: body.fuel || "petrol",
    transmission: body.transmission || "manual",
    odometer: Number(body.odometer) || 0,
    photos: Array.isArray(body.photos) ? body.photos.map((p) => String(p).trim()).filter(Boolean).slice(0, 8) : [],
    description: String(body.description || "").trim().slice(0, 500),
    ownership: String(body.ownership || "").trim().slice(0, 300),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  database.cars.unshift(listing);
  await db.save(database);
  return NextResponse.json({ listing: publicCar(listing, database) });
}