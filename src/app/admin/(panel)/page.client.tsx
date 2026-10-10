"use client";
import { useEffect, useState } from "react";
import { AdminStats, type Stat } from "@/components/admin/AdminStats";
import { ShieldCheck } from "lucide-react";

type StatsRes = { stats: Stat[]; settings: { operator: string; maintenance: boolean; adminConfigured: boolean }; instance: { dev: boolean; adminConfigured: boolean } };

export default function AdminDashboard() {
  const [data, setData] = useState<StatsRes | null>(null);
  const [error, setError] = useState("");

  function reload() {
    setError("");
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then(setData)
      .catch(() => setError("Cannot reach the control room"));
  }

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then((j) => alive && setData(j))
      .catch(() => alive && setError("Cannot reach the control room"));
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-[var(--tealbg)] animate-pulse" />)}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} <button onClick={reload} className="ml-2 font-bold underline cursor-pointer">Retry</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black">Dashboard</h2>
        <p className="text-[13px] text-[var(--muted)]">
          Instant overview for {data.settings.operator}. Tap a card to open its queue.
        </p>
      </div>
      <AdminStats stats={data.stats} />
      <div className="flex items-center gap-2 rounded-2xl border bg-[var(--card)] p-4 text-[13px]">
        <ShieldCheck size={18} className="text-[var(--primary)]" />
        <span>
          Panel access has been provisioned. Audit-protected {data.instance.dev ? "dev (OTP_DEV=1) " : ""}instance — every
          moderation decision is recorded and visible under Audit logs.
        </span>
      </div>
    </div>
  );
}