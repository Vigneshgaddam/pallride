"use client";
import { useAdminAction } from "@/components/admin/useAdminAction";

const CATS: Record<string, string> = {
  "unsafe-driving": "Unsafe driving", harassment: "Harassment / abuse", "fake-profile": "Fake profile",
  scam: "Scam / fraud", "vehicle-details": "Wrong vehicle details", spam: "Spam", other: "Other",
};

export type ReportRow = {
  id: string; category: string; targetType: string; targetId: string;
  details: string; status: string; createdAt: string;
};

async function askReason(required: boolean, label: string) {
  const v = window.prompt(`${label}${required ? " (required)" : ""}:`);
  if (v === null) return null;
  const t = v.trim();
  if (required && t === "") return askReason(true, label);
  return t;
}

export function ReportReview({ report, onChanged }: { report: ReportRow; onChanged: () => void }) {
  const { busy, error, run } = useAdminAction();
  const { status } = report;

  async function act(action: string, reasonRequired: boolean) {
    const reason = await askReason(reasonRequired, `Note for "${action}"`);
    if (reason === null) return;
    if (!(await run("PATCH", `/api/admin/reports/${report.id}`, { action, note: reason }))) return;
    onChanged();
  }

  return (
    <div className="rounded-2xl border bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black">#{report.id.slice(0, 4)}</p>
          <p className="text-[12px] text-[var(--muted)]">{CATS[report.category] || report.category} · {report.targetType}:{report.targetId}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status === "open" ? "bg-red-100 text-red-700" : status === "resolved" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-amber-100 text-amber-700"}`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-[var(--ink)] whitespace-pre-line">{report.details}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{new Date(report.createdAt).toLocaleString()}</p>

      {error && <p className="mt-2 text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button onClick={() => act("start_review", false)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold bg-sky-100 text-sky-700 cursor-pointer disabled:opacity-40">Start review</button>
        <button onClick={() => act("request_info", true)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold bg-amber-100 text-amber-700 cursor-pointer disabled:opacity-40">Ask for info</button>
        <button onClick={() => act("action", false)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold bg-red-100 text-red-700 cursor-pointer disabled:opacity-40">Take action</button>
        <button onClick={() => act("escalate", true)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold bg-red-50 text-red-600 cursor-pointer disabled:opacity-40">Escalate to incident</button>
        <button onClick={() => act("resolve", true)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] cursor-pointer disabled:opacity-40">Resolve</button>
        <button onClick={() => act("dismiss", true)} disabled={busy} className="rounded-lg px-2.5 py-1 text-[12px] font-bold text-[var(--muted)] border cursor-pointer disabled:opacity-40">Dismiss</button>
      </div>
    </div>
  );
}