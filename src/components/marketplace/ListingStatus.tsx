"use client";
import { useLang } from "@/lib/i18n";
import type { CarStatus } from "@/lib/types";

const STATUS: Record<CarStatus | "expired", { en: string; te: string; cls: string }> = {
  draft: { en: "Draft", te: "డ్రాఫ్ట్", cls: "bg-gray-200 text-gray-700" },
  published: { en: "Active", te: "యాక్టివ్", cls: "bg-[var(--primary)] text-white" },
  reserved: { en: "Reserved", te: "రిజర్వ్", cls: "bg-[var(--blue)] text-white" },
  sold: { en: "Sold", te: "అమ్ముడైంది", cls: "bg-gray-200 text-gray-700" },
  paused: { en: "Paused", te: "పాజ్ చేయబడింది", cls: "bg-gray-200 text-gray-700" },
  removed: { en: "Removed", te: "తీసివేయబడింది", cls: "bg-red-100 text-red-700" },
  expired: { en: "Expired", te: "ముగిసినది", cls: "bg-red-100 text-red-700" },
};

export function ListingStatus({ status, expired }: { status: CarStatus; expired?: boolean }) {
  const { te } = useLang();
  const chip = STATUS[expired ? "expired" : status];
  return <span className={`rounded-[10px] px-2.5 py-1 text-xs font-bold ${chip.cls}`}>{te ? chip.te : chip.en}</span>;
}