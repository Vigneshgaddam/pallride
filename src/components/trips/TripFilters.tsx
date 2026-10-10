"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, useLang } from "@/lib/i18n";
import type { TripQuery } from "@/lib/trip-search";

// Optional filters (spec): price, departure time, AC, vehicle type, verified driver.
// Every change pushes a new URL — results stay server-side, shareable and SEO-friendly.
export function TripFilters({ initial }: { initial: TripQuery }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [open, setOpen] = useState(
    !!(initial.maxPrice || initial.time || initial.ac || initial.verified || initial.type)
  );

  const push = (patch: Partial<TripQuery>) => {
    const q: TripQuery = { ...initial, ...patch, page: 1 };
    const p = new URLSearchParams();
    if (q.from) p.set("from", q.from);
    if (q.to) p.set("to", q.to);
    if (q.date) p.set("date", q.date);
    if (q.seats) p.set("seats", String(q.seats));
    if (q.maxPrice) p.set("maxPrice", String(q.maxPrice));
    if (q.time) p.set("time", q.time);
    if (q.ac) p.set("ac", "1");
    if (q.verified) p.set("verified", "1");
    if (q.type) p.set("type", q.type);
    r.push("/trips" + (p.toString() ? "?" + p.toString() : ""));
  };

  const active = !!(initial.maxPrice || initial.time || initial.ac || initial.verified || initial.type);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 border rounded-full px-3.5 py-2 text-sm font-bold cursor-pointer",
          active ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--tealbg)]" : "border-[var(--line)] bg-[var(--card)]"
        )}
      >
        <SlidersHorizontal size={15} /> {t("More filters")}
        {active && <X size={14} />}
      </button>

      {open && (
        <div className="mt-2.5 bg-[var(--card)] border border-[var(--line)] rounded-[20px] p-3.5 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Price up to")}
              <input
                type="number"
                min={0}
                value={initial.maxPrice || ""}
                onChange={(e) => push({ maxPrice: Number(e.target.value) || 0 })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="₹"
              />
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Departure")}
              <select
                value={initial.time}
                onChange={(e) => push({ time: e.target.value as TripQuery["time"] })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                <option value="early">{te ? "6 AM ముందు" : "Before 6 AM"}</option>
                <option value="morning">{te ? "6 AM – 12 PM" : "6 AM – 12 PM"}</option>
                <option value="afternoon">{te ? "12 PM – 6 PM" : "12 PM – 6 PM"}</option>
                <option value="night">{te ? "6 PM తర్వాత" : "After 6 PM"}</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Vehicle type")}
              <select
                value={initial.type}
                onChange={(e) => push({ type: e.target.value as TripQuery["type"] })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                <option value="suv">SUV</option>
                <option value="tempo">Tempo / Van</option>
                <option value="small">{te ? "చిన్న కారు" : "Small car"}</option>
              </select>
            </label>
            <div className="flex flex-col justify-end gap-2 pb-0.5">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input type="checkbox" checked={initial.ac} onChange={(e) => push({ ac: e.target.checked })} className="accent-[var(--primary)]" />
                AC
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input type="checkbox" checked={initial.verified} onChange={(e) => push({ verified: e.target.checked })} className="accent-[var(--primary)]" />
                {t("Verified drivers only")}
              </label>
            </div>
          </div>

          {active && (
            <button onClick={() => push({ maxPrice: 0, time: "", ac: false, verified: false, type: "" })} className="text-sm font-bold text-[var(--mute)] w-fit cursor-pointer inline-flex items-center gap-1">
              {t("Clear")} <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
