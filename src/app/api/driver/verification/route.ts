import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Driver submits documents for review. Only the admin backend may change
// verification to approved / changes_required / rejected (see /api/admin/driver).

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicle = database.vehicles.find((v) => v.driverId === driver.id);
  return NextResponse.json({
    verification: driver.verification,
    status: driver.status,
    ready: { profile: !!driver.name && !!driver.phone, vehicle: !!vehicle },
    vehicle: vehicle ? { model: vehicle.model, regNumber: vehicle.regNumber } : null,
  });
}

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicle = database.vehicles.find((v) => v.driverId === driver.id);
  if (!driver.name || !driver.phone)
    return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
  if (!vehicle)
    return NextResponse.json({ error: "Add your vehicle first" }, { status: 400 });
  if (driver.verification === "under_review")
    return NextResponse.json({ error: "Already under review" }, { status: 409 });
  if (driver.verification === "approved")
    return NextResponse.json({ error: "Already verified" }, { status: 409 });

  driver.verification = "under_review";
  if (driver.status === "pending_verification" || driver.status === "rejected") driver.status = "active";
  await db.save(database);
  return NextResponse.json({ verification: driver.verification, driver });
}
