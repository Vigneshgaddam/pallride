"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, FileText } from "lucide-react";
import { Button, Card, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";
import { EmergencyActions } from "@/components/safety/EmergencyActions";

type MyReport = { id: string; category: string; targetType: string; targetId: string; status: string; createdAt: string };
type MyBlock = { id: string; targetPhone: string; createdAt: string };

const STATUS: Record<string, string> = {
  open: "Open", under_review: "Under review", info_requested: "More info needed",
  action_taken: "Action taken", resolved: "Resolved", dismissed: "Closed",
};

const TE_STATUS: Record<string, string> = {
  open: "తెరిచింది", under_review: "సమీక్షలో", info_requested: "మరింత సమాచారం",
  action_taken: "చర్య తీసుకున్నారు", resolved: "పరిష్కరించారు", dismissed: "మూసివేశారు",
};

const CATS: Record<string, string> = {
  "unsafe-driving": "Unsafe driving", harassment: "Harassment / abuse", "fake-profile": "Fake profile",
  scam: "Scam / fraud", "vehicle-details": "Wrong vehicle details", spam: "Spam", other: "Other",
};

export default function DashboardSafety() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const { phone } = useDriver();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [blocks, setBlocks] = useState<MyBlock[]>([]);

  const load = () => {
    if (!phone) return;
    fetch(`/api/reports?phone=${encodeURIComponent(phone)}`).then((r) => r.json()).then((d) => setReports(d.reports || [])).catch(() => {});
    fetch(`/api/block?phone=${encodeURIComponent(phone)}`).then((r) => r.json()).then((d) => setBlocks(d.blocks || [])).catch(() => {});
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [phone]);

  const unblock = async (targetPhone: string) => {
    await fetch("/api/block", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, targetPhone }),
    });
    load();
  };

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-3">{t("Safety")}</h1>

      <EmergencyActions />

      <div className="flex gap-2 mb-2.5">
        <Link href="/safety" className="flex-1"><Button variant="alt" className="flex items-center justify-center gap-1.5"><FileText size={15} /> {te ? "సమాచారం" : "Safety info"}</Button></Link>
        <Link href="/reports/new" className="flex-1"><Button className="flex items-center justify-center gap-1.5"><FileText size={15} /> {t("Report")}</Button></Link>
      </div>

      <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2 flex items-center gap-1.5">
        <FileText size={14} /> {t("My reports")}
      </h2>
      {reports.length ? (
        reports.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between gap-2 items-center">
              <div className="text-sm font-bold">{CATS[r.category] || r.category}</div>
              <span className="text-[11px] font-bold rounded-[10px] px-2 py-0.5 bg-[var(--bg)] text-[var(--mute)]">
                {te ? TE_STATUS[r.status] || r.status : STATUS[r.status] || r.status}
              </span>
            </div>
            {r.targetType !== "other" && <div className="text-xs text-[var(--mute)] mt-1">#{r.targetId}</div>}
            <div className="text-[11px] text-[var(--mute)] font-semibold mt-1">{new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
          </Card>
        ))
      ) : (
        <Empty>{te ? "ఇంకా రిపోర్ట్‌లు లేవు." : "No reports yet."}</Empty>
      )}

      <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-4 mb-2 flex items-center gap-1.5">
        <Ban size={14} /> {te ? "బ్లాక్ చేసిన నంబర్లు" : "Blocked contacts"}
      </h2>
      {blocks.length ? (
        blocks.map((b) => (
          <Card key={b.id}>
            <div className="flex justify-between items-center gap-2">
              <div className="text-sm font-bold">+91 {b.targetPhone}</div>
              <Button variant="alt" className="!py-1.5 !px-3 !text-xs" onClick={() => unblock(b.targetPhone)}>
                {te ? "బ్లాక్ తీసివేయి" : "Unblock"}
              </Button>
            </div>
            <div className="text-[11px] text-[var(--mute)] font-semibold mt-1">{te ? "నంబర్ మీ ట్రిప్పుల్లో బుక్ చేయలేదు" : "This number cannot book your trips"}</div>
          </Card>
        ))
      ) : (
        <Empty>{te ? "ఎలాంటి బ్లాక్స్ లేవు." : "No blocked contacts."}</Empty>
      )}
    </div>
  );
}