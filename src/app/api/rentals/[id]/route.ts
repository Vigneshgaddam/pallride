import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRental } from "@/lib/validate";
import { publicRental, rentalExpired } from "@/lib/rental-search";
import type { RentalListing } from "@/lib/types";

// Phase 2: public rental detail (GET) + owner lifecycle/edit (PATCH).
// Every mutation is ownership-checked server-side; suspended owners can't publish.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const database = await db.load();
  const listing = database.rentals.find(
    (l) => l.id === id || l.shareCode === id
  );
  if (!listing)
    return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  const driver = database.drivers.find((d) => d.id === listing.ownerId);
  return NextResponse.json({
    listing: {
      ...publicRental(listing, database),
      photos: listing.photos.slice(0, 8),
      description: listing.description,
      conditions: listing.conditions,
      expired: rentalExpired(listing),
    },
    owner: {
      id: driver?.id,
      name: driver?.name || "Owner",
      photo: driver?.photo || "",
      rating: driver?.rating || 0,
      verified: !!driver?.verified,
      joined: driver?.createdAt || "",
      phone: driver?.phone || "",
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<RentalListing> & {
    token?: string;
    action?: string;
  };
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === body.token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const listing = database.rentals.find((l) => l.id === id);
  if (!listing) return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  if (listing.ownerId !== session.driverId)
    return NextResponse.json({ error: "You can only manage your own listings" }, { status: 403 });
  const driver = database.drivers.find((d) => d.id === listing.ownerId)!;
  if (driver.status === "suspended" || driver.status === "rejected")
    return NextResponse.json({ error: "Your account cannot manage rentals right now" }, { status: 403 });

  const action = body.action || "";
  // Publish requires a complete, valid listing.
  if (action === "publish") {
    if (listing.status === "removed")
      return NextResponse.json({ error: "Removed listings cannot be republished" }, { status: 400 });
    const err = validateRental(listing);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    listing.status = "available";
  } else if (action === "pause") {
    if (listing.status === "draft") return NextResponse.json({ error: "Draft is not published" }, { status: 400 });
    if (listing.status === "removed") return NextResponse.json({ error: "Listing was removed" }, { status: 400 });
    listing.status = "unavailable";
  } else if (action === "resume") {
    if (listing.status === "draft") return NextResponse.json({ error: "Publish the listing first" }, { status: 400 });
    if (listing.status === "removed") return NextResponse.json({ error: "Listing was removed" }, { status: 400 });
    listing.status = "available";
  } else if (action === "reserve" || action === "complete" || action === "remove") {
    if (listing.status === "removed") return NextResponse.json({ error: "Listing was removed" }, { status: 400 });
    listing.status = action === "reserve" ? "reserved" : action === "complete" ? "completed" : "removed";
  } else if (action === "") {
    // Field edit — only allowed while the listing is not completed/removed.
    if (listing.status === "completed" || listing.status === "removed")
      return NextResponse.json({ error: "Completed or removed listings cannot be edited" }, { status: 400 });
    listing.make = body.make !== undefined ? String(body.make).trim() : listing.make;
    listing.model = body.model !== undefined ? String(body.model).trim() : listing.model;
    listing.year = body.year !== undefined ? String(body.year).trim() : listing.year;
    listing.photos = body.photos !== undefined
      ? body.photos.map((p) => String(p).trim()).filter(Boolean).slice(0, 8)
      : listing.photos;
    listing.location = body.location !== undefined ? String(body.location).trim() : listing.location;
    listing.seats = body.seats !== undefined ? Number(body.seats) : listing.seats;
    listing.ac = body.ac !== undefined ? !!body.ac : listing.ac;
    listing.pricePerDay = body.pricePerDay !== undefined ? Number(body.pricePerDay) : listing.pricePerDay;
    listing.description = body.description !== undefined ? String(body.description).trim().slice(0, 500) : listing.description;
    listing.conditions = body.conditions !== undefined ? String(body.conditions).trim().slice(0, 500) : listing.conditions;
    listing.availableFrom = body.availableFrom !== undefined ? String(body.availableFrom) : listing.availableFrom;
    listing.availableTo = body.availableTo !== undefined ? String(body.availableTo) : listing.availableTo;
    const err = validateRental(listing);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  listing.updatedAt = new Date().toISOString();
  await db.save(database);
  return NextResponse.json({ listing: publicRental(listing, database), status: listing.status });
}