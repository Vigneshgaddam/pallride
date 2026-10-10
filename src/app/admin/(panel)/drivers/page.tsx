"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { UserActions } from "@/components/admin/UserActions";
import Link from "next/link";

type Row = {
  id: string; name: string; phone: string; verified: boolean;
  verification: string; status: string; rating: number; tripsCount: number;
};

const OPS = [
  { value: "active", label: "Active" },
  { value: "pending_verification", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

export default function AdminDrivers() {
  const t = useAdminTable<Row>({ url: "/api/admin/users" });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black">Drivers</h2>
          <p className="text-[13px] text-[var(--muted)]">The same directory as Users, focused on the field.</p>
        </div>
        <Link href="/admin/verifications" className="rounded-xl bg-[var(--primary)] px-3 py-1.5 text-[13px] font-bold text-white">
          Open verification queue →
        </Link>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "user", label: "Driver",
            render: (r) => (
              <div>
                <p className="font-bold">{r.name}</p>
                <p className="text-[12px] text-[var(--muted)]">+91 {r.phone}</p>
              </div>
            ),
          },
          { key: "status", label: "Status" },
          { key: "verification", label: "Verification" },
          { key: "rating", label: "Rating", hideSm: true, render: (r) => <>{r.rating.toFixed(1)} ✦</> },
          { key: "trips", label: "Trips", hideSm: true, render: (r) => <>{r.tripsCount}</> },
          { key: "actions", label: "", render: (r) => <UserActions userId={r.id} status={r.status} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No drivers found."
      />
    </div>
  );
}