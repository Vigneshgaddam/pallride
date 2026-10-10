import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyGoogleCredential } from "@/lib/google";
import { rateLimitReq } from "@/lib/rates";
import type { Driver } from "@/lib/types";

// Google Sign-In (primary login). When NEXT_PUBLIC_GOOGLE_CLIENT_ID is not
// configured the endpoint reports configured:false and the app falls back to OTP.

export async function POST(req: Request) {
  const lim = rateLimitReq(req, "google.login", 20, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const { credential } = await req.json().catch(() => ({ credential: "" }));
  if (!credential) return NextResponse.json({ error: "Missing credential" }, { status: 400 });

  const claims = await verifyGoogleCredential(String(credential));
  if (!claims) return NextResponse.json({ error: "Google sign-in failed" }, { status: 401 });

  const database = await db.load();
  let driver =
    database.drivers.find((d) => d.googleSub === claims.sub) ||
    database.drivers.find((d) => claims.email && d.email === claims.email);
  if (!driver) {
    driver = newDriver(claims);
    database.drivers.push(driver);
  } else {
    driver.googleSub = claims.sub;
    if (claims.email) driver.email = claims.email;
    if (!driver.name && claims.name) driver.name = claims.name;
    if (!driver.photo && claims.picture) driver.photo = claims.picture;
  }
  const token = "tk_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  database.sessions.push({ token, driverId: driver.id, createdAt: new Date().toISOString() });
  await db.save(database);
  const needsPhone = !driver.phone;
  return NextResponse.json({ token, driver, needsPhone });
}

function newDriver(claims: { sub: string; email?: string; name?: string; picture?: string }): Driver {
  return {
    id: "d" + Date.now(),
    phone: "",
    email: claims.email || "",
    googleSub: claims.sub,
    name: claims.name || "Driver",
    photo: claims.picture || "",
    about: "",
    serviceAreas: [],
    verified: false,
    verification: "none",
    status: "active",
    rating: 0,
    ratingsCount: 0,
    tripsCount: 0,
    cancellations: 0,
    vehicle: "",
    createdAt: new Date().toISOString(),
  };
}
