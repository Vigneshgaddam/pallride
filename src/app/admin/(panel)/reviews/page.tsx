"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { useAdminAction } from "@/components/admin/useAdminAction";

type Review = {
  id: string; driverId: string; driverName: string; riderName: string; stars: number;
  comment: string; status: string; createdAt: string;
};

const OPS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
];

function ReviewActions({ review, onChanged }: { review: Review; onChanged: () => void }) {
  const { busy, error, run } = useAdminAction();
  async function act(action: "approve" | "hide") {
    if (!(await run("PATCH", `/api/admin/reviews/${review.id}`, { action }))) return;
    onChanged();
  }
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
      {review.status === "pending" && (
        <>
          <button onClick={() => act("approve")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">Approve</button>
          <button onClick={() => act("hide")} disabled={busy} className="text-[12px] font-bold text-red-500 cursor-pointer disabled:opacity-40">Hide</button>
        </>
      )}
      {review.status === "hidden" && (
        <button onClick={() => act("approve")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">Reinstate</button>
      )}
    </div>
  );
}

export default function AdminReviews() {
  const t = useAdminTable<Review>({ url: "/api/admin/reviews" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Reviews</h2>
        <p className="text-[13px] text-[var(--muted)]">Written feedback must be approved before it shows on a driver profile.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "review", label: "Review",
            render: (r) => (
              <div className="max-w-[420px]">
                <p className="font-bold">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)} <span className="text-[12px] text-[var(--muted)]">· by {r.riderName} for {r.driverName}</span></p>
                {r.comment && <p className="text-[12px] text-[var(--muted)]">{r.comment}</p>}
              </div>
            ),
          },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "When", hideSm: true, render: (r) => <>{new Date(r.createdAt).toLocaleString()}</> },
          { key: "actions", label: "", render: (r) => <ReviewActions review={r} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No reviews in this bucket."
      />
    </div>
  );
}