"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { UserActions } from "@/components/admin/UserActions";

type User = {
  id: string; name: string; phone: string; email: string;
  verified: boolean; verification: string; status: string;
  rating: number; tripsCount: number; vehicle: string;
};

const STATUS_OPTS = [
  { value: "active", label: "Active" },
  { value: "pending_verification", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const bg: Record<string, string> = {
  active: "text-[var(--primary)] bg-[var(--primary)]/10",
  pending_verification: "text-amber-600 bg-amber-100",
  rejected: "text-red-600 bg-red-100",
  suspended: "text-red-600 bg-red-100",
  approved: "text-[var(--primary)] bg-[var(--primary)]/10",
};

export default function AdminUsers() {
  const t = useAdminTable<User>({ url: "/api/admin/users" });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Users</h2>
        <p className="text-[13px] text-[var(--muted)]">Driver accounts across <b>live trips, rentals and buy-and-sell</b>.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={STATUS_OPTS} />
      <DataTable
        columns={[
          {
            key: "user", label: "User",
            render: (u) => (
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-[12px] text-[var(--muted)]">+91 {u.phone}</p>
              </div>
            ),
          },
          { key: "status", label: "Status", render: (u) => <Badge cls={bg[u.status]}>{u.status}</Badge> },
          {
            key: "verification", label: "Verification",
            render: (u) => <Badge cls={bg[u.verification] || ""}>{u.verification}</Badge>,
          },
          { key: "vehicle", label: "Vehicle", hideSm: true },
          { key: "rating", label: "Rating", hideSm: true, render: (u) => <>{u.rating.toFixed(1)} ✦</> },
          { key: "actions", label: "", render: (u) => <UserActions userId={u.id} status={u.status} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No users match this filter."
      />
    </div>
  );
}

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}