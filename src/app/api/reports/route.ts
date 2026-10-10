import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimitReq } from "@/lib/rates";
import type { Report, ReportCategory } from "@/lib/types";

const CATEGORIES: ReportCategory[] = [
  "unsafe-driving", "harassment", "fake-profile", "scam", "vehicle-details", "spam", "other",
];
const TARGETS = ["trip", "driver", "passenger", "vehicle", "other"];

function uid() {
  return "rp" + Date.now() + Math.floor(Math.random() * 1000);
}

// POST /api/reports — category, targetType/targetId, details, phone.
// Slow-network safe: a clientRef idempotency key means a retry never creates a duplicate.
export async function POST(req: Request) {
  const lim = rateLimitReq(req, "reports", 10, 60000);
  if (!lim.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const category = String(body.category || "other");
  const targetType = String(body.targetType || "other");
  const clientRef = String(body.clientRef || "").trim().slice(0, 80);
  const phone = String(body.phone || "").trim().slice(0, 15);
  const details = String(body.details || "").trim().slice(0, 1000);
  const blockPhone = String(body.blockPhone || "").trim().slice(0, 15);

  if (!CATEGORIES.includes(category as ReportCategory))
    return NextResponse.json({ error: "Select a valid reason" }, { status: 400 });
  if (!TARGETS.includes(targetType))
    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  if (!phone || !/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10)))
    return NextResponse.json({ error: "Add your 10-digit phone number" }, { status: 400 });
  if (!details) return NextResponse.json({ error: "Describe what happened" }, { status: 400 });

  const database = await db.load();

  // Idempotent: if the same client retried, return the existing report instead of duplicating.
  if (clientRef) {
    const existing = database.reports.find((r) => r.clientRef === clientRef);
    if (existing) return NextResponse.json({ report: existing, created: false });
  }

  const report: Report = {
    id: uid(),
    clientRef: clientRef || undefined,
    category: category as ReportCategory,
    targetType,
    targetId: String(body.targetId || "").slice(0, 80),
    details: details.slice(0, 1000),
    phone,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  database.reports.push(report);

  if (blockPhone && blockPhone !== phone) {
    const dup = database.blocks.some((b) => b.fromPhone === phone && b.targetPhone === blockPhone);
    if (!dup)
      database.blocks.push({ id: "bl" + Date.now(), fromPhone: phone, targetPhone: blockPhone, createdAt: report.createdAt });
  }

  await db.save(database);
  return NextResponse.json({ report, created: true });
}

// GET /api/reports?phone=XXXX — the reports a phone number submitted
// (used by the driver dashboard safety page). MVP phone-scoped identity.
export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  const database = await db.load();
  if (!phone)
    return NextResponse.json({ reports: database.reports });

  const reports = database.reports
    .filter((r) => r.phone === phone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ reports });
}