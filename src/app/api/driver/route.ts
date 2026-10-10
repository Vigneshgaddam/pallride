import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Driver } from "@/lib/types";

// Phase 1: mock OTP (no SMS cost). OTP returned in response for dev/demo.

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone || !/^\d{10}$/.test(String(phone).trim()))
    return NextResponse.json({ error: "Enter a 10-digit phone number" }, { status: 400 });
  const database = await db.load();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  database.otps = database.otps.filter((o) => o.phone !== phone);
  database.otps.push({ phone, otp, exp: Date.now() + 5 * 60 * 1000 });
  await db.save(database);
  // Never expose the OTP in production — only for local/demo (real SMS comes in Phase 2).
  const devOtp = process.env.NODE_ENV !== "production" || process.env.OTP_DEV === "1" ? otp : undefined;
  return NextResponse.json({ ok: true, devOtp });
}

export async function PATCH(req: Request) {
  const { phone, otp, name, vehicle, photo, about, serviceAreas } = await req.json();
  const database = await db.load();

  if (otp) {
    const rec = database.otps.find((o) => o.phone === phone && o.otp === otp && o.exp > Date.now());
    if (!rec) return NextResponse.json({ error: "Wrong or expired OTP" }, { status: 400 });
    database.otps = database.otps.filter((o) => o.phone !== phone);
    let driver = database.drivers.find((d) => d.phone === phone);
    if (!driver) {
      driver = newDriver(phone);
      database.drivers.push(driver);
    }
    const token = "tk_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    database.sessions.push({ token, driverId: driver.id, createdAt: new Date().toISOString() });
    await db.save(database);
    return NextResponse.json({ token, driver });
  }

  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (name) driver.name = String(name).trim().slice(0, 50);
  if (vehicle !== undefined) driver.vehicle = String(vehicle).trim().slice(0, 60);
  if (photo !== undefined) driver.photo = String(photo).trim().slice(0, 300);
  if (about !== undefined) driver.about = String(about).trim().slice(0, 300);
  if (Array.isArray(serviceAreas)) {
    driver.serviceAreas = serviceAreas.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
  }
  if (phone !== undefined) {
    const p = String(phone).trim();
    if (!/^\d{10}$/.test(p)) return NextResponse.json({ error: "Enter a 10-digit phone number" }, { status: 400 });
    if (database.drivers.some((d) => d.phone === p && d.id !== driver.id))
      return NextResponse.json({ error: "That phone number is already linked to another account" }, { status: 409 });
    driver.phone = p;
  }
  await db.save(database);
  return NextResponse.json({ driver });
}

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const driver = database.drivers.find((d) => d.id === session.driverId);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ driver });
}

export async function DELETE(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const database = await db.load();
  database.sessions = database.sessions.filter((s) => s.token !== token);
  await db.save(database);
  return NextResponse.json({ ok: true });
}

function newDriver(phone: string): Driver {
  return {
    id: "d" + Date.now(), phone, name: "Driver " + phone.slice(-4),
    email: "", photo: "", about: "", serviceAreas: [],
    verified: false, verification: "none", status: "active",
    rating: 0, ratingsCount: 0, tripsCount: 0, cancellations: 0,
    vehicle: "", createdAt: new Date().toISOString(),
  };
}
