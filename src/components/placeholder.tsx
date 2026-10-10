"use client";
import { useT, useLang } from "@/lib/i18n";
import { Empty } from "@/components/ui";
import Link from "next/link";

export function Placeholder({
  titleEn, titleTe, icon,
}: { titleEn: string; titleTe: string; icon: string }) {
  const t = useT();
  const { te } = useLang();
  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-4">{te ? titleTe : titleEn}</h1>
      <Empty>
        <div className="text-3xl mb-2">{icon}</div>
        {te ? "ఈ మాడ్యూల్ త్వరలో వస్తుంది." : `${titleEn} is coming in Phase 2.`}
        <div className="h-2" />
        <Link href="/trips" className="text-[var(--primary)] font-bold text-sm">{t("Rides")} →</Link>
      </Empty>
    </div>
  );
}
