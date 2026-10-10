"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";

type Settings = { settings: { operator: string; maintenance: boolean; adminConfigured: boolean }; instance: { dev: boolean; adminConfigured: boolean } };

export default function AdminSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const [operator, setOperator] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAdminAction();
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject("Request failed")))
      .then((j) => {
        setData(j);
        setOperator(j.settings.operator);
        setMaintenance(!!j.settings.maintenance);
      })
      .catch(() => setErrorMsg("Cannot load settings"));
  }, []);
  useEffect(load, [load]);

  async function save() {
    if (!(await run("PATCH", "/api/admin/settings", { operator, maintenance }))) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!data) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-28 rounded-2xl bg-[var(--tealbg)] animate-pulse" />
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMsg} <button onClick={load} className="ml-2 font-bold underline cursor-pointer">Retry</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h2 className="text-2xl font-black">Settings</h2>
        <p className="text-[13px] text-[var(--muted)]">Operator label appears in the audit trail and panel greeting.</p>
      </div>

      <div className="rounded-2xl border bg-[var(--card)] p-4 space-y-4">
        <label className="block">
          <span className="text-[13px] font-bold">Operator name</span>
          <input
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-[14px] outline-none focus:border-[var(--primary)]"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold">Maintenance mode</span>
          <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
        </label>

        {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        {saved && <p className="text-[12px] font-semibold text-[var(--primary)]">Saved</p>}

        <button onClick={save} disabled={busy} className="rounded-xl bg-[var(--primary)] text-white font-bold px-4 py-2 text-[14px] cursor-pointer disabled:opacity-40">
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>

      <div className="rounded-2xl border bg-[var(--card)] p-4 text-[12px] text-[var(--muted)]">
        <p className="font-bold text-[var(--ink)]">Admin key configured</p>
        <p className={data.instance.adminConfigured ? "text-[var(--primary)]" : "text-amber-600"}>
          {data.instance.adminConfigured ? "Yes" : "No — login is disabled until ADMIN_KEY is set."}
        </p>
      </div>
    </div>
  );
}