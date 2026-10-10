"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { ReportReview, type ReportRow } from "@/components/admin/ReportReview";

const OPS = [
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "info_requested", label: "Info requested" },
  { value: "action_taken", label: "Action taken" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export default function AdminReports() {
  const t = useAdminTable<ReportRow>({ url: "/api/admin/reports" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Reports</h2>
        <p className="text-[13px] text-[var(--muted)]">
          Safety reports raised by riders/drivers. Escalate serious cases to a Safety incident.
        </p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />

      <div className="flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span>{t.total} reports</span>
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
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-[var(--tealbg)] animate-pulse" />)}
        </div>
      ) : t.rows.length === 0 ? (
        <div className="rounded-xl border-dashed border-2 border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
          No reports here.
        </div>
      ) : (
        <div className="space-y-3">
          {t.rows.map((r) => <ReportReview key={r.id} report={r} onChanged={t.reload} />)}
        </div>
      )}
    </div>
  );
}