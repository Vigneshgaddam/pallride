"use client";
import { CalendarRange } from "lucide-react";
import { Card } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { useT, useLang } from "@/lib/i18n";
import type { RentalListing } from "@/lib/types";

const STATUS: Record<RentalListing["status"] | "expired", { en: string; te: string; cls: string }> = {
  draft: { en: "Draft", te: "డ్రాఫ్ట్", cls: "bg-gray-200 text-gray-700" },
  available: { en: "Available", te: "అందుబాటులో", cls: "bg-[var(--primary)] text-white" },
  unavailable: { en: "Unavailable", te: "అందుబాటులో లేదు", cls: "bg-gray-200 text-gray-700" },
  reserved: { en: "Reserved", te: "రిజర్వ్ చేయబడింది", cls: "bg-[var(--blue)] text-white" },
  completed: { en: "Completed", te: "పూర్తయింది", cls: "bg-gray-200 text-gray-700" },
  removed: { en: "Removed", te: "తీసివేయబడింది", cls: "bg-red-100 text-red-700" },
  expired: { en: "Expired", te: "ముగిసినది", cls: "bg-red-100 text-red-700" },
};

export function RentalAvailability({
  status, availableFrom, availableTo, expired,
}: {
  status: RentalListing["status"];
  availableFrom: string;
  availableTo: string;
  expired?: boolean;
}) {
  const t = useT();
  const { te } = useLang();
  const chip = STATUS[expired ? "expired" : status];

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-[var(--primary)]" />
          <b className="text-sm">{t("Availability")}</b>
        </div>
        <span className={`rounded-[10px] px-2.5 py-1 text-xs font-bold ${chip.cls}`}>
          {te ? chip.te : chip.en}
        </span>
      </div>
      <div className="text-[13px] text-[var(--mute)] mt-1.5">
        {te
          ? `${fmtDate(availableFrom)} నుండి ${fmtDate(availableTo)} వరకు`
          : `From ${fmtDate(availableFrom)} to ${fmtDate(availableTo)}`}
      </div>
      {status === "available" && !expired && (
        <p className="text-xs text-[var(--mute)] mt-2 bg-[var(--tealbg)] rounded-[12px] px-3 py-2">
          {te
            ? "హామీ లేని లభ్యత: యజమాని నిర్ధారించే వరకు సీటు ఖరారు కాదు."
            : "No guaranteed availability — dates are only confirmed when the owner confirms your enquiry."}
        </p>
      )}
    </Card>
  );
}