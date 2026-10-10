"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { RentalQuery } from "@/lib/rental-search";

// URL-based search: submits to /rentals?q=…&start=…&end=…
export function RentalSearch({ initial }: { initial: RentalQuery }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [q, setQ] = useState(initial.q);
  const [start, setStart] = useState(initial.startDate);
  const [end, setEnd] = useState(initial.endDate);

  const go = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (start) p.set("start", start);
    if (end) p.set("end", end);
    if (initial.ac) p.set("ac", "1");
    if (initial.seats) p.set("seats", String(initial.seats));
    if (initial.maxPrice) p.set("maxPrice", String(initial.maxPrice));
    r.push("/rentals" + (p.toString() ? "?" + p.toString() : ""));
  };

  return (
    <div>
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-3.5 grid gap-2.5 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <Field label={t("Location")}>
          <MapPin size={16} className="text-[var(--mute)] shrink-0" />
          <Input
            placeholder={te ? "ఎక్కడ అద్దెకు కావాలి? (ఉదా: ఆర్మూర్)" : "Where do you need a car? (e.g. Armoor)"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Field>
        <Field label={te ? "నుండి" : "Start"}>
          <CalendarDays size={16} className="text-[var(--mute)] shrink-0" />
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={te ? "వరకు" : "End"}>
          <CalendarDays size={16} className="text-[var(--mute)] shrink-0" />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Button onClick={go} className="flex items-center justify-center gap-2">
          <CalendarDays size={16} /> {t("Search rentals")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          [te ? "1 వెతకండి" : "1 Search", te ? "తేదీలు + స్థలం" : "Dates + place"],
          [te ? "2 అడగండి" : "2 Enquire", te ? "వాట్సాప్‌లో" : "On WhatsApp"],
          [te ? "3 ఖచ్చితం" : "3 Confirm", te ? "యజమానితో" : "With the owner"],
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