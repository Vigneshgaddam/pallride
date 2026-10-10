import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { daysBetween } from "@/lib/rental-search";
import type { RentalEnquiry } from "@/lib/types";

// Phase 2: WhatsApp enquiries are recorded here (a record, not a confirmed booking).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<RentalEnquiry>;
  const database = await db.load();
  const listing = database.rentals.find((l) => l.id === id || l.shareCode === id);
  if (!listing) return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  // Enquiries open only while the listing is bookable.
  if (listing.status !== "available")
    return NextResponse.json({ error: "This listing is not currently available" }, { status: 409 });
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const startDate = String(body.startDate || "");
  const endDate = String(body.endDate || "");
  if (!name || !phone) return NextResponse.json({ error: "Your name and phone are required" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
    return NextResponse.json({ error: "Valid start and end dates are required" }, { status: 400 });
  if (startDate < listing.availableFrom || endDate > listing.availableTo)
    return NextResponse.json({ error: "Those dates are outside the availability window" }, { status: 400 });

  const enquiry: RentalEnquiry = {
    id: "eq" + Date.now(),
    listingId: listing.id,
    name,
    phone,
    startDate,
    endDate,
    durationDays: Math.max(1, daysBetween(startDate, endDate) || 1),
    message: String(body.message || "").trim().slice(0, 500),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  database.enquiries.unshift(enquiry);
  await db.save(database);
  return NextResponse.json({ enquiry, ok: true });
}