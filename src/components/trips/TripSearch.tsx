"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { TripQuery } from "@/lib/trip-search";

const ROUTES = ["Hyderabad ⇄ Nizamabad", "Hyderabad ⇄ Armoor", "Korutla ⇄ Hyderabad"];

// URL-based search: submits to /trips?from=…&to=…&date=…&seats=…
export function TripSearch({ initial }: { initial: TripQuery }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [date, setDate] = useState(initial.date);
  const [seats, setSeats] = useState(initial.seats ? String(initial.seats) : "");

  const go = (f = from, d = to, dt = date, s = seats) => {
    const p = new URLSearchParams();
    if (f) p.set("from", f);
    if (d) p.set("to", d);
    if (dt) p.set("date", dt);
    if (Number(s)) p.set("seats", String(Number(s)));
    // keep optional filters, reset pagination
    if (initial.maxPrice) p.set("maxPrice", String(initial.maxPrice));
    if (initial.time) p.set("time", initial.time);
    if (initial.ac) p.set("ac", "1");
    if (initial.verified) p.set("verified", "1");
    if (initial.type) p.set("type", initial.type);
    r.push("/trips" + (p.toString() ? "?" + p.toString() : ""));
  };

  return (
    <div>
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-3.5 grid gap-2.5 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <Field label={t("From")}>
          <Input placeholder={te ? "ఎక్కడ మొదలు?" : "Where are you starting?"} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t("To")}>
          <Input placeholder={te ? "ఎక్కడికి వెళ్తున్నారు?" : "Where are you going?"} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label={t("Date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("Seats")}>
          <Input type="number" min={1} max={12} placeholder={te ? "సీట్లు" : "Seats"} value={seats} onChange={(e) => setSeats(e.target.value)} />
        </Field>
        <Button onClick={() => go()} className="flex items-center justify-center gap-2 md:col-span-2 lg:col-span-4">
          <Search size={16} /> {te ? "వెతకండి" : "Search"}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
        {ROUTES.map((route) => (
          <button
            key={route}
            className="shrink-0 border border-[var(--line)] bg-[var(--card)] rounded-full px-3.5 py-2 text-sm cursor-pointer"
            onClick={() => {
              const [a, b] = route.split(" ⇄ ");
              setFrom(a);
              setTo(b);
              go(a, b, date, seats);
            }}
          >
            {route}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          [te ? "1 వెతకండి" : "1 Search", te ? "రూట్ ఎంచుకోండి" : "Pick route"],
          [te ? "2 బుక్" : "2 Book", te ? "సీట్లు ఎంచుకోండి" : "Choose seats"],
          [te ? "3 నిర్ధారణ" : "3 Confirm", te ? "వాట్సాప్‌లో" : "On WhatsApp"],
        ].map(([a, b]) => (
          <div key={a} className="bg-[var(--tealbg)] rounded-[14px] p-3 text-xs text-[var(--mute)]">
            <b className="block text-[var(--ink)] text-sm">{a}</b>
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}
