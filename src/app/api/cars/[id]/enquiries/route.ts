import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { carExpired } from "@/lib/car-search";
import type { CarEnquiry } from "@/lib/types";

// Phase 3: WhatsApp enquiries are recorded here (a message, not a sale).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<CarEnquiry>;
  const database = await db.load();
  const listing = database.cars.find((c) => c.id === id || c.shareCode === id);
  if (!listing) return NextResponse.json({ error: "Car listing not found" }, { status: 404 });
  if (listing.status !== "published" || carExpired(listing))
    return NextResponse.json({ error: "This listing is not currently available" }, { status: 409 });
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  if (!name || !phone) return NextResponse.json({ error: "Your name and phone are required" }, { status: 400 });

  const enquiry: CarEnquiry = {
    id: "cq" + Date.now(),
    listingId: listing.id,
    name,
    phone,
    message: String(body.message || "").trim().slice(0, 500),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  database.carEnquiries.unshift(enquiry);
  await db.save(database);
  return NextResponse.json({ enquiry, ok: true });
}