"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert, MessageSquare, UserX } from "lucide-react";
import { Button, Card, Empty } from "@/components/ui";
import { DriverTrustCard, type TrustDriver } from "@/components/safety/DriverTrustCard";
import { RatingSummary } from "@/components/safety/RatingSummary";
import { VerificationBadge } from "@/components/safety/VerificationBadge";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { useT, useLang } from "@/lib/i18n";
import { fmtTime, priceLabel, whenLabel } from "@/lib/utils";

type ProfileData = {
  driver: TrustDriver & { verification: string };
  summary: { distribution: { stars: number; count: number }[]; count: number; avg: number; category: { driving: number; behaviour: number; punctuality: number; vehicle: number } };
  reviews: { id: string; stars: number; comment: string; createdAt: string }[];
  recentTrips: { id: string; shareCode: string; from: string; to: string; stops: string[]; date: string; time: string; priceLo: number; priceHi: number; availableSeats: number }[];
};

export default function DriverProfilePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const t = useT();
  const { te } = useLang();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reviewReportId, setReviewReportId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState(driverId);

  // Render-phase adjust when navigating to a different driver
  if (driverId !== prevId) {
    setPrevId(driverId);
    setData(null);
    setError(false);
  }

  useEffect(() => {
    fetch(`/api/drivers/${driverId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError(true));
  }, [driverId]);

  if (error)
    return (
      <div className="py-12 text-center">
        <UserX size={40} className="mx-auto mb-3 text-[var(--mute)]" />
        <p className="text-[var(--mute)]">{t("Driver not found")}</p>
        <div className="h-2" />
        <Link href="/"><Button variant="alt">{t("Back")}</Button></Link>
      </div>
    );

  if (!data)
    return (
      <div className="pb-6 animate-pulse">
        <div className="h-28 bg-[var(--card)] border border-[var(--line)] rounded-[18px] mb-2.5" />
        <div className="h-40 bg-[var(--card)] border border-[var(--line)] rounded-[18px]" />
      </div>
    );

  const { driver, summary, reviews, recentTrips } = data;

  return (
    <div className="pb-6 max-w-2xl mx-auto">
      <DriverTrustCard driver={driver} />

      <div className="px-1 -mt-1 mb-2">
        <VerificationBadge verified={driver.verified} />
        {!driver.verified && (
          <button onClick={() => setReporting(true)} className="text-xs font-bold text-red-600 underline ml-4">
            <ShieldAlert size={12} className="inline -mt-0.5 mr-1" />{t("Report")}
          </button>
        )}
      </div>

      {driver.rating > 0 && <RatingSummary avg={summary.avg} count={summary.count} distribution={summary.distribution} category={summary.category} />}

      <div className="flex items-center justify-between mt-3 mb-2">
        <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide flex items-center gap-1.5">
          <MessageSquare size={14} /> {t("Reviews")}
        </h2>
        <button onClick={() => setReporting(true)} className="text-xs font-bold text-red-600 underline">
          {t("Report")}
        </button>
      </div>

      {reviews.length ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {reviews.map((v) => (
            <Card key={v.id} className="!mb-0">
              <div className="flex justify-between items-center">
                <span className="text-[var(--amber)]">{v.stars} {[1, 2, 3, 4, 5].map((i) => (i <= v.stars ? "★" : "☆")).join("")}</span>
                <button onClick={() => { setReviewReportId(v.id); setReporting(true); }} className="text-[11px] text-[var(--mute)] underline font-semibold">
                  {t("Report")}
                </button>
              </div>
              <p className="text-sm mt-1.5">“{v.comment}”</p>
              <div className="text-[11px] text-[var(--mute)] font-semibold mt-1.5 flex justify-between">
                <span>{te ? "ధృవీకరించబడిన ప్రయాణికుడు" : "Verified passenger"}</span>
                <span>{new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>{te ? "ఇంకా రివ్యూలు లేవు." : "No reviews yet."}</Empty>
      )}

      {recentTrips.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2">{t("Recent trips")}</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {recentTrips.map((tp) => (
              <Link key={tp.id} href={`/trips/${tp.shareCode}`}>
                <Card className="!mb-0 h-full hover:border-[var(--primary)]">
                  <div className="font-bold text-sm">{[tp.from, ...tp.stops, tp.to].join(" → ")}</div>
                  <div className="text-[13px] text-[var(--mute)] mt-1">
                    {whenLabel(tp.date)} · {fmtTime(tp.time)} · {priceLabel(tp.priceLo, tp.priceHi)}/seat
                  </div>
                  <div className="text-[13px] font-bold mt-0.5 text-[var(--primary)] inline-flex items-center gap-1.5"><span aria-hidden className="w-2 h-2 rounded-full bg-[var(--primary)]" /> {tp.availableSeats} {t("seats available")}</div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <ReportDialog
        open={reporting}
        onClose={() => { setReporting(false); setReviewReportId(null); }}
        targetType="driver"
        targetId={reviewReportId ? "review:" + reviewReportId : driverId}
      />
    </div>
  );
}