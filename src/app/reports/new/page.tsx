"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { ReportDialog } from "@/components/safety/ReportDialog";

const TARGET_LABEL: Record<string, { en: string; te?: string }> = {
  trip: { en: "a trip", te: "ఒక ట్రిప్" },
  driver: { en: "a driver", te: "ఒక డ్రైవర్" },
  passenger: { en: "a passenger", te: "ఒక ప్రయాణికుడు" },
  vehicle: { en: "a vehicle listing", te: "ఒక వాహన ప్రకటన" },
  other: { en: "something else", te: "ఏదో ఒకటి" },
};

// Deep-linkable report form: /reports/new?type=trip&id=CODE.
// Delegates to the shared ReportDialog (categories, clientRef, retry-safe).
function ReportNewInner() {
  const t = useT();
  const sp = useSearchParams();
  const r = useRouter();
  const targetType = (String(sp.get("type") || "other")) as "trip" | "driver" | "passenger" | "vehicle" | "other";
  const targetId = String(sp.get("id") || "");

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-1">{t("Report problem")}</h1>
      <p className="text-xs text-[var(--mute)] mb-3">
        {t("Reporting")} {TARGET_LABEL[targetType]?.en}: {targetId || "—"} · {t("Reports stay confidential")}
      </p>
      <ReportDialog
        open
        targetType={targetType}
        targetId={targetId}
        onClose={() => r.back()}
      />
    </div>
  );
}

export default function ReportNewPage() {
  return (
    <Suspense>
      <ReportNewInner />
    </Suspense>
  );
}