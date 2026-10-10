"use client";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { inr, priceLabel } from "@/lib/utils";

// Selected-seat summary: count + total price
export function SeatCounter({
  selected, priceLo, priceHi, onClear,
}: {
  selected: number[];
  priceLo: number;
  priceHi: number;
  onClear?: () => void;
}) {
  const t = useT();
  return (
    <div className="flex justify-between font-extrabold text-lg my-3.5 items-center">
      <span>
        {selected.length ? (
          <>
            {t("Selected")}: {selected.join(", ")}
            {onClear && (
              <button
                onClick={onClear}
                className="ml-2 align-middle text-[var(--mute)] hover:text-red-600 cursor-pointer"
                aria-label={t("Close")}
              >
                <X size={15} />
              </button>
            )}
          </>
        ) : (
          t("Tap a seat")
        )}
      </span>
      <span className="text-[var(--primary)]">
        {selected.length ? priceLabel(priceLo, priceHi, selected.length) : inr(0)}
      </span>
    </div>
  );
}
