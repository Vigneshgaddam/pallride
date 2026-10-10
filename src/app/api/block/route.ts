import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Block management. Identity is phone-number based in the MVP.
// GET /api/block?phone= → the blocks a phone created
// POST /api/block {phone, targetPhone} → add (idempotent)
// DELETE /api/block {phone, targetPhone} → remove
export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  const database = await db.load();
  const blocks = database.blocks
    .filter((b) => b.fromPhone === phone || phone === "")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ blocks });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").trim().slice(0, 15);
  const targetPhone = String(body.targetPhone || "").trim().slice(0, 15);
  if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10)) || !/^\d{10}$/.test(targetPhone.replace(/\D/g, "").slice(-10)))
    return NextResponse.json({ error: "Blocking needs your phone and the target phone" }, { status: 400 });
  if (phone === targetPhone) return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });

  const database = await db.load();
  let block = database.blocks.find((b) => b.fromPhone === phone && b.targetPhone === targetPhone);
  if (!block) {
    block = { id: "bl" + Date.now(), fromPhone: phone, targetPhone, createdAt: new Date().toISOString() };
    database.blocks.push(block);
    await db.save(database);
  }
  return NextResponse.json({ block });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").trim().slice(0, 15);
  const targetPhone = String(body.targetPhone || "").trim().slice(0, 15);
  const database = await db.load();
  const before = database.blocks.length;
  database.blocks = database.blocks.filter((b) => !(b.fromPhone === phone && b.targetPhone === targetPhone));
  if (database.blocks.length !== before) await db.save(database);
  return NextResponse.json({ removed: database.blocks.length !== before });
}