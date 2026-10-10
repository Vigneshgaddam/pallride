import { NextResponse } from "next/server";
import { adminAuthorized } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const dbObj = await db.load();
  if (!adminAuthorized(req, dbObj)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = JSON.stringify(dbObj);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=\"palleride-db-export.json\"",
    },
  });
}