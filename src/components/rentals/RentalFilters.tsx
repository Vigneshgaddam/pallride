"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { RentalQuery } from "@/lib/rental-search";

// Optional rental filters: AC, min seats, max price. Every change pushes a new
// URL so results stay server-side, shareable and fast on 2G.
export function RentalFilters({ initial }: { initial: RentalQuery }) {
  const t = useT();
  const r = useRouter();
  const [open, setOpen] = useState(!!(initial.ac || initial.seats || initial.maxPrice));

  const push = (patch: Partial<RentalQuery>) => {
    const q: RentalQuery = { ...initial, ...patch, page: 1 };
    const p = new URLSearchParams();
    if (q.q) p.set("q", q.q);
    if (q.startDate) p.set("start", q.startDate);
    if (q.endDate) p.set("end", q.endDate);
    if (q.ac) p.set("ac", "1");
    if (q.seats) p.set("seats", String(q.seats));
    if (q.maxPrice) p.set("maxPrice", String(q.maxPrice));
    r.push("/rentals" + (p.toString() ? "?" + p.toString() : ""));
  };

  const active = !!(initial.ac || initial.seats || initial.maxPrice);

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
              {t("Price per day up to")}
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
              {t("Min seats")}
              <select
                value={initial.seats || ""}
                onChange={(e) => push({ seats: Number(e.target.value) || 0 })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
                <option value="6">6+</option>
                <option value="7">7+</option>
              </select>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={initial.ac} onChange={(e) => push({ ac: e.target.checked })} className="accent-[var(--primary)]" />
              AC
            </label>
          </div>

          {active && (
            <button onClick={() => push({ ac: false, seats: 0, maxPrice: 0 })} className="text-sm font-bold text-[var(--mute)] w-fit cursor-pointer inline-flex items-center gap-1">
              {t("Clear")} <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}