"use client";
import { Card } from "@/components/ui";
import { inr } from "@/lib/utils";
import { useT, useLang } from "@/lib/i18n";
import { daysBetween } from "@/lib/rental-search";

// Indicative total: rate × duration. The final amount is always agreed with the owner.
export function RentalPriceBreakdown({
  pricePerDay, start, end,
}: {
  pricePerDay: number;
  start: string;
  end: string;
}) {
  const t = useT();
  const { te } = useLang();
  const days = start && end ? Math.max(1, daysBetween(start, end) || 1) : 0;

  return (
    <Card>
      <b className="text-sm">{t("Price estimate")}</b>
      <div className="text-[13px] text-[var(--mute)] mt-1.5 grid gap-1">
        <div className="flex justify-between">
          <span>
            {inr(pricePerDay)} × {days} {days === 1 ? t("day") : t("days")}
          </span>
          <span>{days ? inr(pricePerDay * days) : "—"}</span>
        </div>
        <div className="flex justify-between font-extrabold text-[var(--ink)] border-t border-[var(--line)] pt-1.5 mt-1">
          <span>{t("Estimated total")}</span>
          <span>{days ? inr(pricePerDay * days) : "—"}</span>
        </div>
      </div>
      <p className="text-xs text-[var(--mute)] mt-2">
        {te
          ? "ఇది అంచనా మాత్రమే — ఖరీదు యజమానితో మాట్లాడి ఖరారు చేసుకోండి."
          : "This is only an estimate — the final price is agreed directly with the owner."}
      </p>
    </Card>
  );
}