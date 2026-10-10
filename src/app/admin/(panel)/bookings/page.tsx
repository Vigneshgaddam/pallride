"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";

type Booking = {
  id: string; tripId: string; name: string; phone: string; seats: number;
  status: string; createdAt: string; trip: string; driverName: string;
};

const OPS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminBookings() {
  const t = useAdminTable<Booking>({ url: "/api/admin/bookings" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Bookings</h2>
        <p className="text-[13px] text-[var(--muted)]">Read-only reservation ledger for investigations.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "trip", label: "Trip",
            render: (b) => (
              <div>
                <p className="font-bold">{b.trip}</p>
                <p className="text-[12px] text-[var(--muted)]">{b.driverName} · trip {b.tripId.slice(0, 4)}</p>
              </div>
            ),
          },
          {
            key: "rider", label: "Rider",
            render: (b) => (
              <div>
                <p className="font-bold">{b.name}</p>
                <p className="text-[12px] text-[var(--muted)]">+91 {b.phone}</p>
              </div>
            ),
          },
          { key: "seats", label: "Seats" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Requested", hideSm: true, render: (b) => <>{new Date(b.createdAt).toLocaleString()}</> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No bookings found."
      />
    </div>
  );
}