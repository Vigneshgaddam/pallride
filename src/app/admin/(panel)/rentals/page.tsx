"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { ListingModeration } from "@/components/admin/ListingModeration";

type Rental = {
  id: string; shareCode: string; make: string; model: string; year: number;
  location: string; pricePerDay: number; seats: number; ac: boolean;
  status: string; prevStatus: string | null;
  owner: string; enquiries: number;
};

const OPS = [
  { value: "available", label: "Available" },
  { value: "removed", label: "Removed" },
  { value: "booked", label: "Booked" },
];

export default function AdminRentals() {
  const t = useAdminTable<Rental>({ url: "/api/admin/rentals" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Rentals</h2>
        <p className="text-[13px] text-[var(--muted)]">Commercial ownership moderation. Removed listings keep their previous status for a clean restore.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "car", label: "Vehicle",
            render: (r) => (
              <div>
                <p className="font-bold">{r.make} {r.model} · {r.year}</p>
                <p className="text-[12px] text-[var(--muted)]">{r.location} · {r.owner}</p>
              </div>
            ),
          },
          { key: "daily", label: "Price / day", hideSm: true, render: (r) => <>₹{r.pricePerDay}</> },
          { key: "seats", label: "Seats", hideSm: true, render: (r) => <>{r.seats}{r.ac ? " · AC" : ""}</> },
          { key: "status", label: "Status", render: (r) => <span className="font-bold">{r.status}</span> },
          { key: "enquiries", label: "Inquiries", hideSm: true },
          { key: "actions", label: "", render: (r) => <ListingModeration kind="rental" itemId={r.id} status={r.status} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No rental listings found."
      />
    </div>
  );
}