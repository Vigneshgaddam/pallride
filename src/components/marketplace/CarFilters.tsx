"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, useLang } from "@/lib/i18n";
import type { CarQuery } from "@/lib/car-search";
import { carQueryToParams } from "@/lib/car-search";

// Buyers' filters (spec §5) — every change pushes a new URL so results stay
// server-side, shareable and fast on 2G.
const YEARS = Array.from({ length: 22 }, (_, i) => String(new Date().getFullYear() - i));

export function CarFilters({ initial }: { initial: CarQuery }) {
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const [open, setOpen] = useState(
    !!(initial.minPrice || initial.maxPrice || initial.make || initial.model || initial.minYear ||
      initial.fuel || initial.transmission || initial.maxKm || initial.verified || initial.sort !== "newest")
  );

  const push = (patch: Partial<CarQuery>) => {
    const c: CarQuery = { ...initial, ...patch, page: 1 };
    r.push("/cars" + (carQueryToParams(c) ? "?" + carQueryToParams(c) : ""));
  };

  const active =
    !!(initial.minPrice || initial.maxPrice || initial.make || initial.model || initial.minYear ||
      initial.fuel || initial.transmission || initial.maxKm || initial.verified || initial.sort !== "newest");

  const num = (v: string) => Number(v) || 0;

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
              {te ? "కనిష్ఠ ధర" : "Min price"}
              <input
                type="number" min={0} step={1000}
                value={initial.minPrice || ""}
                onChange={(e) => push({ minPrice: num(e.target.value) })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="₹"
              />
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {te ? "గరిష్ఠ ధర" : "Max price"}
              <input
                type="number" min={0} step={1000}
                value={initial.maxPrice || ""}
                onChange={(e) => push({ maxPrice: num(e.target.value) })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="₹"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Make")}
              <input
                type="text"
                value={initial.make}
                onChange={(e) => push({ make: e.target.value })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="Maruti"
              />
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Model")}
              <input
                type="text"
                value={initial.model}
                onChange={(e) => push({ model: e.target.value })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="Swift"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--mute)]">
              {te ? "మిన్ సంవత్సరం" : "Min year"}
              <select
                value={initial.minYear || ""}
                onChange={(e) => push({ minYear: Number(e.target.value) || 0 })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {te ? "మరోమీటరు (మాక్స్)" : "Odometer (max km)"}
              <input
                type="number" min={0} step={1000}
                value={initial.maxKm || ""}
                onChange={(e) => push({ maxKm: num(e.target.value) })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
                placeholder="50,000"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Fuel")}
              <select
                value={initial.fuel}
                onChange={(e) => push({ fuel: e.target.value as CarQuery["fuel"] })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Gearbox")}
              <select
                value={initial.transmission}
                onChange={(e) => push({ transmission: e.target.value as CarQuery["transmission"] })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="">{t("Any")}</option>
                <option value="manual">{te ? "మాన్యువల్" : "Manual"}</option>
                <option value="automatic">{te ? "ఆటోమాటిక్" : "Automatic"}</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-[var(--mute)]">
              {t("Sort")}
              <select
                value={initial.sort}
                onChange={(e) => push({ sort: e.target.value as CarQuery["sort"] })}
                className="mt-1 w-full border border-[var(--line)] rounded-[14px] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--ink)]"
              >
                <option value="newest">{te ? "కొత్తవి ముందు" : "Newest"}</option>
                <option value="price">{te ? "ధర (తక్కువ)" : "Price low → high"}</option>
                <option value="priceDesc">{te ? "ధర (ఎక్కువ)" : "Price high → low"}</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input type="checkbox" checked={initial.verified} onChange={(e) => push({ verified: e.target.checked })} className="accent-[var(--primary)]" />
            {t("Verified sellers only")}
          </label>

          {active && (
            <button
              onClick={() => push({ minPrice: 0, maxPrice: 0, make: "", model: "", minYear: 0, fuel: "", transmission: "", maxKm: 0, verified: false, sort: "newest" })}
              className="text-sm font-bold text-[var(--mute)] w-fit cursor-pointer inline-flex items-center gap-1"
            >
              {t("Clear")} <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}