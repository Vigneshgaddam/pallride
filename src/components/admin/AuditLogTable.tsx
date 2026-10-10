"use client";

export type AuditLog = { id: string; at: string; actor: string; action: string; target: string; note: string };

// Append-only audit trail. Filtered + paginated server-side; note is kept short.
export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0)
    return <div className="rounded-xl border-dashed border-2 border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">No log entries.</div>;
  return (
    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.id} className="flex items-start gap-3 rounded-xl border bg-[var(--card)] px-3 py-2.5 text-[13px]">
          <div className="min-w-0">
            <p className="font-bold">
              {l.action} <span className="font-mono text-[12px] text-[var(--muted)]">{l.target}</span>
            </p>
            {l.note && <p className="text-[12px] text-[var(--muted)]">{l.note}</p>}
          </div>
          <span className="ml-auto shrink-0 text-[11px] text-[var(--muted)]">{new Date(l.at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}