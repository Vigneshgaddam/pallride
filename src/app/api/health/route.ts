import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const database = await db.load();
    const status = "ok";
    const counts = {
      trips: database.trips.length,
      drivers: database.drivers.length,
      rentals: database.rentals.length,
      cars: database.cars.length,
      requests: database.requests.length,
      reports: database.reports.length,
      reviews: database.reviews.length,
      incidents: database.incidents.length,
      audit: database.audit.length,
    };
    const hasSettings = !!database.settings;
    return NextResponse.json({ status, counts, hasSettings });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}