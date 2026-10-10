import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuthorized, audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

// Moderate a written review: approve (public) / hide (moderated away).
export async function PATCH(req: Request, ctx: Ctx) {
  const database = await db.load();
  if (!adminAuthorized(req, database)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  if (action !== "approve" && action !== "hide")
    return NextResponse.json({ error: "action must be approve or hide" }, { status: 400 });

  const review = database.reviews.find((v) => v.id === id);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  review.status = action === "approve" ? "approved" : "hidden";
  audit(database, "review." + action, `review:${id}`, String(body.note || "").slice(0, 300));
  await db.save(database);
  return NextResponse.json({ review });
}