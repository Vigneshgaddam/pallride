import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Phase 2: confirm/decline an enquiry. Confirming marks the listing reserved
// (owner-confirmed) so other enquirers see it as taken.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as { action?: string };
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enquiry = database.enquiries.find((e) => e.id === id);
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  const listing = database.rentals.find((l) => l.id === enquiry.listingId);
  if (!listing || listing.ownerId !== session.driverId)
    return NextResponse.json({ error: "You can only manage your own enquiries" }, { status: 403 });

  const action = body.action || "";
  if (action === "confirm") {
    if (listing.status === "removed")
      return NextResponse.json({ error: "Listing was removed" }, { status: 400 });
    enquiry.status = "confirmed";
    if (listing.status === "available") listing.status = "reserved";
  } else if (action === "decline") {
    enquiry.status = "declined";
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  listing.updatedAt = new Date().toISOString();
  await db.save(database);
  return NextResponse.json({ enquiry, listingStatus: listing.status });
}