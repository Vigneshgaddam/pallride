"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { ListingModeration } from "@/components/admin/ListingModeration";

type Listing = {
  id: string; shareCode: string; make: string; model: string; year: number;
  location: string; price: number; fuel: string; transmission: string; odometer: number;
  status: string; prevStatus: string | null; seller: string; enquiries: number;
};

const OPS = [
  { value: "published", label: "Published" },
  { value: "removed", label: "Removed" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

export default function AdminListings() {
  const t = useAdminTable<Listing>({ url: "/api/admin/listings" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Buy &amp; Sell</h2>
        <p className="text-[13px] text-[var(--muted)]">Used-car listing queue with restore support.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "car", label: "Car",
            render: (l) => (
              <div>
                <p className="font-bold">{l.make} {l.model} · {l.year}</p>
                <p className="text-[12px] text-[var(--muted)]">{l.location} · {l.seller}</p>
              </div>
            ),
          },
          { key: "price", label: "Price", hideSm: true, render: (l) => <>₹{l.price.toLocaleString("en-IN")}</> },
          { key: "specs", label: "Specs", hideSm: true, render: (l) => <>{l.fuel} · {l.transmission} · {l.odometer} km</> },
          { key: "status", label: "Status", render: (l) => <span className="font-bold">{l.status}</span> },
          { key: "enquiries", label: "Inquiries", hideSm: true },
          { key: "actions", label: "", render: (l) => <ListingModeration kind="car" itemId={l.id} status={l.status} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No car listings found."
      />
    </div>
  );
}