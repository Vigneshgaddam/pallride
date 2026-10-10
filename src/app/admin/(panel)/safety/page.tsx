"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { useAdminAction } from "@/components/admin/useAdminAction";

type Incident = {
  id: string; summary: string; status: string; createdAt: string;
  report: { id: string; category: string; targetType: string; targetId: string; status: string } | null;
};

const OPS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

function IncidentActions({ incident, onChanged }: { incident: Incident; onChanged: () => void }) {
  const { busy, error, run } = useAdminAction();
  async function act(action: "resolve" | "reopen") {
    const note = action === "resolve" ? window.prompt("Closing note (optional):") ?? "" : "";
    if (!(await run("PATCH", `/api/admin/safety/${incident.id}`, { action, note }))) return;
    onChanged();
  }
  return (
    <div className="flex flex-col items-start gap-1">
      {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
      {incident.status === "open" ? (
        <button onClick={() => act("resolve")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">Resolve</button>
      ) : (
        <button onClick={() => act("reopen")} disabled={busy} className="text-[12px] font-bold text-red-500 cursor-pointer disabled:opacity-40">Reopen</button>
      )}
    </div>
  );
}

export default function AdminSafety() {
  const t = useAdminTable<Incident>({ url: "/api/admin/safety" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Safety</h2>
        <p className="text-[13px] text-[var(--muted)]">Escalated incidents with the linked report for context.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "summary", label: "Incident",
            render: (i) => (
              <div className="max-w-[420px]">
                <p className="font-bold">{i.summary}</p>
                {i.report && (
                  <p className="text-[12px] text-[var(--muted)]">
                    linked {i.report.category} on {i.report.targetType}:{i.report.targetId} ({i.report.status})
                  </p>
                )}
              </div>
            ),
          },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Opened", hideSm: true, render: (i) => <>{new Date(i.createdAt).toLocaleString()}</> },
          { key: "actions", label: "", render: (i) => <IncidentActions incident={i} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No incidents — all clear."
      />
    </div>
  );
}