import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized } from "@/lib/admin";

// Safety incidents (spec §3/§6). Least-privilege summary view: serious
// escalations are shown to authorised reviewers only, and free text is kept
// to a synopsis plus the linked report category/id.
export async function GET(req: Request) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const incidents = database.incidents
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => {
      const report = database.reports.find((r) => r.id === i.reportId);
      return {
        id: i.id,
        summary: i.summary,
        status: i.status,
        createdAt: i.createdAt,
        report: report
          ? { id: report.id, category: report.category, targetType: report.targetType, targetId: report.targetId, status: report.status }
          : null,
      };
    });

  return NextResponse.json({ incidents });
}