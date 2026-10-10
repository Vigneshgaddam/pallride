"use client";
import { Badge } from "@/components/ui";
import { useT } from "@/lib/i18n";

// Spec: N seats available (green dot) / FULL (red) + lifecycle status badge
export function TripStatus({
  status, availableSeats, className,
}: {
  status: string;
  availableSeats?: number;
  className?: string;
}) {
  const t = useT();

  if (status !== "published") {
    const map: Record<string, string> = {
      cancelled: "bg-red-600",
      expired: "bg-[var(--mute)]",
      draft: "bg-[var(--mute)]",
      started: "bg-[var(--blue)]",
      completed: "bg-[var(--brand,var(--primary-hover))]",
    };
    const label =
      status === "cancelled" ? t("Cancelled")
      : status === "expired" ? t("Expired")
      : status === "draft" ? t("Draft")
      : status === "started" ? t("Started")
      : status === "completed" ? t("Completed")
      : t("Open");
    return <Badge className={`${map[status] || "bg-[var(--mute)]"} ${className || ""}`}>{label}</Badge>;
  }

  if (availableSeats == null) return null;
  return availableSeats > 0 ? (
    <span className={`font-semibold inline-flex items-center gap-1.5 ${className || ""}`}>
      <span aria-hidden className="w-2 h-2 rounded-full bg-[var(--primary)]" /> {availableSeats} {t("seats available")}
    </span>
  ) : (
    <span className={`font-semibold text-red-600 inline-flex items-center gap-1.5 ${className || ""}`}>
      <span aria-hidden className="w-2 h-2 rounded-full bg-red-600" /> {t("FULL")}
    </span>
  );
}
