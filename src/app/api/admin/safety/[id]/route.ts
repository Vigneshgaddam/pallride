import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Resolve / reopen a safety incident. Reopen keeps the full history.
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const incident = database.incidents.find((i) => i.id === id);
  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);

  if (action === "resolve") {
    incident.status = "resolved";
  } else if (action === "reopen") {
    incident.status = "open";
  } else {
    return NextResponse.json({ error: "action must be resolve or reopen" }, { status: 400 });
  }

  audit(database, "incident." + action, `incident:${id}`, note);
  await db.save(database);
  return NextResponse.json({ id: incident.id, status: incident.status });
}