import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";
import { effectiveStatus } from "@/lib/seats";
import { carExpired } from "@/lib/car-search";

// Control Center summaries (spec §1). Loaded once on the dashboard; every
// module page fetches its own table only when opened.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const stats = [
    { key: "users", label: "Total users", value: database.drivers.length, href: "/admin/users" },
    {
      key: "verifications",
      label: "Pending reviews",
      value: database.drivers.filter((d) => d.verification !== "approved").length,
      href: "/admin/verifications",
    },
    {
      key: "trips",
      label: "Live trips",
      value: database.trips.filter((t) => !t.hidden && ["published", "started"].includes(effectiveStatus(t, now))).length,
      href: "/admin/trips",
    },
    {
      key: "reports",
      label: "Safety queue",
      value: database.reports.filter((r) => ["open", "under_review", "info_requested"].includes(r.status)).length,
      href: "/admin/reports",
    },
    {
      key: "reviews",
      label: "Reviews to moderate",
      value: database.reviews.filter((v) => v.status === "pending").length,
      href: "/admin/reviews",
    },
    {
      key: "incidents",
      label: "Open incidents",
      value: database.incidents.filter((i) => i.status === "open").length,
      href: "/admin/safety",
    },
    {
      key: "rentals",
      label: "Active rentals",
      value: database.rentals.filter((r) => r.status === "available").length,
      href: "/admin/rentals",
    },
    {
      key: "cars",
      label: "Cars for sale",
      value: database.cars.filter((c) => c.status === "published" && !carExpired(c)).length,
      href: "/admin/listings",
    },
  ];

  return NextResponse.json({
    stats,
    settings: database.settings,
    instance: { dev: process.env.OTP_DEV === "1", adminConfigured: !!process.env.ADMIN_KEY || process.env.OTP_DEV === "1" },
  });
}