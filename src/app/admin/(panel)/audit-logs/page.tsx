"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { AuditLogTable, type AuditLog } from "@/components/admin/AuditLogTable";

const OPS = [
  { value: "verification", label: "Verification" },
  { value: "user.", label: "Accounts" },
  { value: "report", label: "Reports" },
  { value: "incident", label: "Incidents" },
  { value: "trip.", label: "Trips" },
  { value: "rental.", label: "Rentals" },
  { value: "listing.", label: "Listings" },
  { value: "review", label: "Reviews" },
  { value: "settings", label: "Settings" },
];

export default function AdminAuditLogs() {
  const t = useAdminTable<AuditLog>({ url: "/api/admin/audit" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Audit logs</h2>
        <p className="text-[13px] text-[var(--muted)]">Every moderation decision, append-only. Filter by action family.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />

      <div className="flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span>{t.total} entries</span>
        <div className="flex gap-1.5">
          <button disabled={t.page <= 1} onClick={() => t.setPage(t.page - 1)} className="rounded-lg border px-2.5 py-1 font-bold disabled:opacity-40 cursor-pointer">Prev</button>
          <span className="self-center">{t.page} / {t.pageCount}</span>
          <button disabled={t.page >= t.pageCount} onClick={() => t.setPage(t.page + 1)} className="rounded-lg border px-2.5 py-1 font-bold disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      </div>

      {t.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t.error} <button onClick={t.reload} className="ml-2 font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {t.loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-[var(--tealbg)] animate-pulse" />)}
        </div>
      ) : (
        <AuditLogTable logs={t.rows} />
      )}
    </div>
  );
}