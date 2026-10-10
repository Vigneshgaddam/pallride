import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";
import { CHECKS } from "@/lib/admin";

// Verification queue (spec §4). Each driver carries an independent per-check
// ledger: phone ownership, profile, vehicle documents, background. Checkboxes
// are set by the reviewer; approval is only meaningful once evidence exists.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const queue = database.drivers
    .filter((d) => d.verification !== "approved")
    .map((d) => {
      const vehicles = database.vehicles
        .filter((v) => v.driverId === d.id)
        .map((v) => ({
          id: v.id, type: v.type, make: v.make, model: v.model, year: v.year,
          seats: v.seats, ac: v.ac, fuel: v.fuel, photos: v.photos.slice(0, 3),
          regNumber: v.regNumber, // restricted: only the reviewer sees this
        }));
      return {
        id: d.id, name: d.name, phone: d.phone, email: d.email || "",
        status: d.status, verification: d.verification, reviewNote: d.reviewNote || "",
        checks: Object.fromEntries(CHECKS.map((c) => [c, d.checks?.[c] === true])),
        vehicles, createdAt: d.createdAt,
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ verifications: queue });
}