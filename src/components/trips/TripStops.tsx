"use client";
import { useT } from "@/lib/i18n";

export function TripStops({ stops }: { stops: string[] }) {
  const t = useT();
  if (!stops.length) return null;
  return (
    <div>
      <div className="text-xs font-bold text-[var(--mute)] uppercase tracking-wide mb-2">{t("Via")}</div>
      <ol className="text-sm grid gap-1.5">
        {stops.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--tealbg)] grid place-items-center text-[10px] font-bold">
              {i + 1}
            </span>
            <span className="font-semibold">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
