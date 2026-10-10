"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Search } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { CarQuery } from "@/lib/car-search";

// URL-based search: submits to /cars?q=… (location / make / model words).
export function CarSearch({ initial }: { initial: CarQuery }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [q, setQ] = useState(initial.q);

  const push = (patch: Partial<CarQuery>) => {
    const c: CarQuery = { ...initial, ...patch, page: 1 };
    const p = new URLSearchParams();
    if (c.q) p.set("q", c.q);
    if (c.minPrice) p.set("minPrice", String(c.minPrice));
    if (c.maxPrice) p.set("maxPrice", String(c.maxPrice));
    if (c.make) p.set("make", c.make);
    if (c.model) p.set("model", c.model);
    if (c.minYear) p.set("minYear", String(c.minYear));
    if (c.fuel) p.set("fuel", c.fuel);
    if (c.transmission) p.set("transmission", c.transmission);
    if (c.maxKm) p.set("maxKm", String(c.maxKm));
    if (c.verified) p.set("verified", "1");
    if (c.sort !== "newest") p.set("sort", c.sort);
    r.push("/cars" + (p.toString() ? "?" + p.toString() : ""));
  };

  return (
    <div>
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-3.5 grid gap-2.5 md:grid-cols-[1fr_auto] md:items-end">
        <Field label={te ? "ఏ కారు?" : "Car"}>
          <CarFront size={16} className="text-[var(--mute)] shrink-0" />
          <Input
            placeholder={te ? "తయారీ, మోడల్ లేదా స్థలం (ఉదా: i10, కమ్మర్‌పల్లి)" : "Make, model or place (e.g. i10, Kammarpally)"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Field>
        <Button onClick={() => push({})} className="flex items-center justify-center gap-2 md:w-auto">
          <Search size={16} /> {t("Search cars")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          [te ? "1 వెతకండి" : "1 Search", te ? "కారు కనుగొనండి" : "Find the car"],
          [te ? "2 అడగండి" : "2 Enquire", te ? "వాట్సాప్‌లో" : "On WhatsApp"],
          [te ? "3 తనిఖీ" : "3 Inspect", te ? "కారును చూసుకోండి" : "Check the car first"],
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