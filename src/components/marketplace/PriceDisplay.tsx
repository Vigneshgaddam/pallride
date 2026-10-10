"use client";
import { useT, useLang } from "@/lib/i18n";
import { inr } from "@/lib/utils";
import { lakh } from "@/lib/car-search";

// Big, readable asking price — including an "Asking price" label (never a guarantee).
export function PriceDisplay({ price }: { price: number }) {
  const t = useT();
  const { te } = useLang();
  return (
    <div>
      <div className="text-[var(--primary)] font-extrabold text-2xl leading-none">{inr(price)}</div>
      <div className="text-[11px] text-[var(--mute)] uppercase tracking-wide font-bold mt-1">
        {te ? "అడిగిన ధర" : t("Asking price")}
      </div>
      {price >= 100000 && (
        <div className="text-xs text-[var(--mute)] mt-0.5">≈ {lakh(price)}</div>
      )}
    </div>
  );
}