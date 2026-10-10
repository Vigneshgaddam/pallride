import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Buy & Sell (used-car) listing moderation queue.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 20;

  const filtered = database.cars
    .filter((c) => (!status || c.status === status))
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return NextResponse.json({
    listings: slice.map((c) => ({
      id: c.id, shareCode: c.shareCode, make: c.make, model: c.model, year: c.year,
      location: c.location, price: c.price, fuel: c.fuel, transmission: c.transmission,
      odometer: c.odometer, status: c.status, prevStatus: c.prevStatus || null,
      seller: database.drivers.find((d) => d.id === c.sellerId)?.name || "",
      enquiries: database.carEnquiries.filter((e) => e.listingId === c.id && e.status === "pending").length,
    })),
    total, page, pageCount,
  });
}