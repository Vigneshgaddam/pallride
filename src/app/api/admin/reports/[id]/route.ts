import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Report lifecycle (spec §6): NEW → UNDER REVIEW → ACTION TAKEN / DISMISSED → RESOLVED.
// Every decision requires a reason, recorded with the audit trail.
const ACTIONS = ["start_review", "request_info", "action", "resolve", "dismiss", "escalate"] as const;

export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number]))
    return NextResponse.json({ error: "A valid action is required" }, { status: 400 });

  const report = database.reports.find((r) => r.id === id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 300);
  if (action !== "start_review" && action !== "action" && !note)
    return NextResponse.json({ error: "A reason is required for this decision" }, { status: 400 });

  let incident = null;
  switch (action) {
    case "start_review":
      report.status = "under_review";
      break;
    case "request_info":
      report.status = "info_requested";
      break;
    case "action":
      report.status = "action_taken";
      break;
    case "resolve":
      report.status = "resolved";
      break;
    case "dismiss":
      report.status = "dismissed";
      break;
    case "escalate":
      incident = {
        id: "si" + Date.now(),
        reportId: report.id,
        summary: note || `Escalated: ${report.category} (${report.targetId})`,
        status: "open" as const,
        createdAt: new Date().toISOString(),
      };
      database.incidents.push(incident);
      break;
  }
  audit(database, "report." + action, `report:${id}`, note);
  await db.save(database);
  return NextResponse.json({ report, incident });
}