"use client";
import { Card } from "@/components/ui";
import { useT } from "@/lib/i18n";

// Backend-computed averages + star distribution (never computed in the browser).
export function RatingSummary({
  avg, count, distribution = [], category = { driving: 0, behaviour: 0, punctuality: 0, vehicle: 0 },
}: {
  avg: number;
  count: number;
  distribution?: { stars: number; count: number }[];
  category?: { driving: number; behaviour: number; punctuality: number; vehicle: number };
}) {
  const t = useT();
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold">{avg || "—"}</div>
          <div className="text-[var(--amber)] text-lg tracking-tight mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (i <= Math.round(avg) ? "★" : "☆")).join("")}
          </div>
          <div className="text-xs text-[var(--mute)] font-semibold mt-0.5">{count} {t("ratings").toLowerCase()}</div>
        </div>
        <div className="flex-1 grid gap-1">
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-bold">{d.stars}★</span>
              <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--amber)] rounded-full" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="w-7 text-right text-[var(--mute)] font-semibold">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        {([["driving", t("Driving")], ["behaviour", t("Behaviour")], ["punctuality", t("Punctuality")], ["vehicle", t("Vehicle")]] as const).map(([k, label]) => (
          <div key={k} className="bg-[var(--bg)] rounded-[14px] py-2">
            <div className="font-extrabold text-sm">{category[k] ? category[k].toFixed(1) : "—"}</div>
            <div className="text-[10px] text-[var(--mute)] font-semibold">{label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}