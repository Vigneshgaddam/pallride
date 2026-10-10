import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateVehicle } from "@/lib/validate";
import type { Vehicle } from "@/lib/types";

function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  return token;
}

export async function GET(req: Request) {
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === auth(req));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicles = database.vehicles.filter((v) => v.driverId === session.driverId);
  return NextResponse.json({ vehicles });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === auth(req));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId)!;

  if (database.vehicles.some((v) => v.driverId === driver.id))
    return NextResponse.json({ error: "You already added a vehicle" }, { status: 409 });

  const err = validateVehicle(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const vehicle: Vehicle = {
    id: "v" + Date.now(),
    driverId: driver.id,
    type: String(body.type || "hatchback"),
    make: String(body.make).trim().slice(0, 40),
    model: String(body.model).trim().slice(0, 40),
    year: String(body.year).trim().slice(0, 4),
    regNumber: String(body.regNumber).trim().toUpperCase().slice(0, 15),
    seats: Number(body.seats) || 4,
    ac: body.ac !== false,
    fuel: String(body.fuel || "petrol"),
    photos: Array.isArray(body.photos) ? body.photos.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 4) : [],
    createdAt: new Date().toISOString(),
  };
  database.vehicles.push(vehicle);
  driver.vehicle = `${vehicle.model} · ${vehicle.ac ? "AC" : "Non-AC"}`;
  await db.save(database);
  return NextResponse.json({ vehicle });
}
