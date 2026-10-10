"use client";
import { User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function SeatMap({
  total, taken, held = [], selected, editable, onToggle,
}: {
  total: number;
  taken: number[];
  held?: number[];
  selected: number[];
  editable?: boolean;
  onToggle?: (n: number) => void;
}) {
  const t = useT();
  const seat = (n: number) => {
    const isTaken = taken.includes(n);
    const isHeld = held.includes(n);
    const isSel = selected.includes(n);
    return (
      <button
        key={n}
        disabled={isTaken || isHeld}
        onClick={() => !isTaken && !isHeld && onToggle?.(n)}
        aria-label={`Seat ${n}`}
        className={cn(
          "w-[52px] h-[52px] rounded-[14px_14px_10px_10px] border-2 font-extrabold grid place-items-center",
          isTaken ? "bg-[var(--line)] border-[var(--line)] text-[var(--mute)] cursor-not-allowed"
            : isHeld ? "bg-[var(--amber)]/30 border-[var(--amber)] text-[var(--ink)] cursor-not-allowed"
            : isSel ? "bg-[var(--primary)] border-[var(--primary)] text-white cursor-pointer"
            : "bg-[var(--card)] border-[var(--primary)] cursor-pointer"
        )}
      >
        {isTaken && editable ? <X size={18} /> : n}
      </button>
    );
  };
  const rows = [
    <div key="d" className="flex justify-center gap-3 mb-3" style={{ justifyContent: "space-between" }}>
      <div className="w-[52px] h-[52px] rounded-[14px] border-2 border-dashed border-[var(--mute)] grid place-items-center text-[var(--mute)]"><User size={22} /></div>
      {seat(1)}
    </div>,
  ];
  for (let k = 2; k <= total; k += 3) {
    rows.push(
      <div key={k} className="flex justify-center gap-3 mb-3">
        {[0, 1, 2].filter((i) => k + i <= total).map((i) => seat(k + i))}
      </div>
    );
  }
  return (
    <div>
      <div className="bg-[var(--tealbg,var(--primary-soft))] border-2 border-[var(--line)] rounded-[40px_40px_20px_20px] px-[22px] pt-[30px] pb-2.5 max-w-[250px] mx-auto mb-3 relative before:content-[''] before:absolute before:top-2.5 before:left-[38px] before:right-[38px] before:h-2 before:rounded-md before:bg-[var(--line)]">
        {rows}
      </div>
      <div className="flex justify-center gap-3.5 text-xs text-[var(--mute)] mb-3.5 flex-wrap">
        <span><i className="inline-block w-3 h-3 rounded bg-[var(--card)] border-2 border-[var(--primary)] mr-1.5 -mt-px" />{t("Available seat")}</span>
        <span><i className="inline-block w-3 h-3 rounded bg-[var(--primary)] mr-1.5 -mt-px" />{t("Selected")}</span>
        {held.length > 0 && (
          <span><i className="inline-block w-3 h-3 rounded bg-[var(--amber)]/40 border-2 border-[var(--amber)] mr-1.5 -mt-px" />{t("Held")}</span>
        )}
        <span><i className="inline-block w-3 h-3 rounded bg-[var(--line)] mr-1.5 -mt-px" />{t("Booked seat")}</span>
      </div>
    </div>
  );
}
