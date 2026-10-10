import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Paginated driver/user directory. regNumber stays out of the payload —
// least-privilege: reviewers fetch vehicle details only inside the
// verification workflow.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 20;

  const filtered = database.drivers
    .filter((d) => (!status || d.status === status))
    .filter((d) => !q || `${d.name} ${d.phone} ${d.serviceAreas.join(" ")}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);
  const vehicles = new Map(database.vehicles.filter((v) => slice.some((d) => d.id === v.driverId)).map((v) => [v.driverId, v.make + " " + v.model]));

  return NextResponse.json({
    users: slice.map((d) => ({
      id: d.id, name: d.name, phone: d.phone, email: d.email || "",
      verified: d.verified, verification: d.verification, status: d.status,
      rating: d.rating, tripsCount: d.tripsCount, createdAt: d.createdAt,
      vehicle: vehicles.get(d.id) || d.vehicle || "",
      reviewNote: d.reviewNote || "",
    })),
    total, page, pageCount,
  });
}