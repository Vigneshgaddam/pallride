import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Audit trail (spec §3/§5). Append-only from the panel's perspective — regular
// users can never write to it. Paginated newest-first.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const PAGE = 25;

  const filtered = database.audit
    .filter((a) => (!action || a.action.includes(action)))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);
  return NextResponse.json({ logs: slice, total, page, pageCount });
}