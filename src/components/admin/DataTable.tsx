"use client";

type Col<T> = { key: string; label: string; hideSm?: boolean; render?: (row: T) => React.ReactNode };

export function DataTable<T extends { id: string }>({
  columns, rows, loading, error, onRetry, page, pageCount, total, onPage,
  empty,
}: {
  columns: Col<T>[];
  rows: T[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
  empty: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--tealbg)] animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load: {error}
        <button onClick={onRetry} className="ml-2 font-bold underline cursor-pointer">Retry</button>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-dashed border-2 border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        {empty}
      </div>
    );
  }
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border bg-[var(--card)]">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="border-b bg-[var(--tealbg)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 font-bold ${c.hideSm ? "hidden md:table-cell" : ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-[var(--tealbg)]">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-top ${c.hideSm ? "hidden md:table-cell" : ""}`}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span>{total} total</span>
        <div className="flex gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-lg border px-2.5 py-1 font-bold disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="px-1 self-center">{page} / {pageCount}</span>
          <button
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            className="rounded-lg border px-2.5 py-1 font-bold disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}