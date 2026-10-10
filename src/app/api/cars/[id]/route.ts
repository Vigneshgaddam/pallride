import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCar } from "@/lib/validate";
import { publicCar, carExpired } from "@/lib/car-search";
import type { CarListing } from "@/lib/types";

// Phase 3: public detail (GET) + owner lifecycle/edit (PATCH).
// Every mutation is ownership-checked server-side; suspended sellers can't manage.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const database = await db.load();
  const listing = database.cars.find((c) => c.id === id || c.shareCode === id);
  if (!listing) return NextResponse.json({ error: "Car listing not found" }, { status: 404 });
  const seller = database.drivers.find((d) => d.id === listing.sellerId);
  return NextResponse.json({
    listing: {
      ...publicCar(listing, database),
      photos: listing.photos.slice(0, 8),
      description: listing.description,
      ownership: listing.ownership,
      expired: carExpired(listing),
    },
    seller: {
      id: seller?.id,
      name: seller?.name || "Seller",
      photo: seller?.photo || "",
      rating: seller?.rating || 0,
      verified: !!seller?.verified,
      joined: seller?.createdAt || "",
      phone: seller?.phone || "",
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<CarListing> & {
    token?: string;
    action?: string;
  };
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const listing = database.cars.find((c) => c.id === id);
  if (!listing) return NextResponse.json({ error: "Car listing not found" }, { status: 404 });
  if (listing.sellerId !== session.driverId)
    return NextResponse.json({ error: "You can only manage your own listings" }, { status: 403 });
  const seller = database.drivers.find((d) => d.id === listing.sellerId)!;
  if (seller.status === "suspended" || seller.status === "rejected")
    return NextResponse.json({ error: "Your account cannot manage listings right now" }, { status: 403 });

  const action = body.action || "";
  if (action === "publish") {
    if (listing.status === "sold" || listing.status === "removed")
      return NextResponse.json({ error: "This listing cannot be republished" }, { status: 400 });
    const err = validateCar(listing);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    listing.status = "published";
  } else if (action === "pause") {
    if (listing.status === "draft") return NextResponse.json({ error: "Draft is not published" }, { status: 400 });
    if (listing.status === "sold" || listing.status === "removed")
      return NextResponse.json({ error: "Listing is closed" }, { status: 400 });
    listing.status = "paused";
  } else if (action === "resume") {
    if (listing.status === "sold" || listing.status === "removed")
      return NextResponse.json({ error: "Listing is closed" }, { status: 400 });
    listing.status = "published";
  } else if (action === "reserve" || action === "sold") {
    if (listing.status === "draft") return NextResponse.json({ error: "Draft is not published" }, { status: 400 });
    if (listing.status === "removed") return NextResponse.json({ error: "Listing was removed" }, { status: 400 });
    listing.status = action === "sold" ? "sold" : "reserved";
  } else if (action === "remove") {
    if (listing.status === "sold") return NextResponse.json({ error: "Sold listings keep history" }, { status: 400 });
    listing.status = "removed";
  } else if (action === "") {
    if (listing.status === "sold" || listing.status === "removed")
      return NextResponse.json({ error: "Sold or removed listings cannot be edited" }, { status: 400 });
    listing.make = body.make !== undefined ? String(body.make).trim() : listing.make;
    listing.model = body.model !== undefined ? String(body.model).trim() : listing.model;
    listing.year = body.year !== undefined ? String(body.year).trim() : listing.year;
    listing.price = body.price !== undefined ? Number(body.price) : listing.price;
    listing.location = body.location !== undefined ? String(body.location).trim() : listing.location;
    listing.fuel = body.fuel !== undefined ? body.fuel : listing.fuel;
    listing.transmission = body.transmission !== undefined ? body.transmission : listing.transmission;
    listing.odometer = body.odometer !== undefined ? Number(body.odometer) : listing.odometer;
    listing.photos = body.photos !== undefined
      ? body.photos.map((p) => String(p).trim()).filter(Boolean).slice(0, 8)
      : listing.photos;
    listing.description = body.description !== undefined ? String(body.description).trim().slice(0, 500) : listing.description;
    listing.ownership = body.ownership !== undefined ? String(body.ownership).trim().slice(0, 300) : listing.ownership;
    const err = validateCar(listing);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  listing.updatedAt = new Date().toISOString();
  await db.save(database);
  return NextResponse.json({ listing: publicCar(listing, database), status: listing.status });
}