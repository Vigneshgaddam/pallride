"use client";
import { useAdminTable } from "@/components/admin/useAdminTable";
import { DataTable } from "@/components/admin/DataTable";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { useAdminAction } from "@/components/admin/useAdminAction";

type Trip = {
  id: string; shareCode: string; from: string; to: string; stops: string[]; date: string; time: string;
  priceLo: number; priceHi: number; seatsTotal: number; seatsTaken: number;
  driverName: string; status: string; hidden: boolean; bookings: number;
};

const OPS = [
  { value: "published", label: "Published" },
  { value: "started", label: "Started" },
  { value: "cancelled", label: "Cancelled" },
  { value: "hidden", label: "Hidden" },
];

function TripActions({ trip, onChanged }: { trip: Trip; onChanged: () => void }) {
  const { busy, error, run } = useAdminAction();
  async function act(action: "hide" | "restore" | "cancel") {
    let note = "";
    if (action === "cancel") {
      note = window.prompt("Reason for cancelling (required):") ?? "";
      if (note.trim() === "") return;
    }
    if (!(await run("PATCH", `/api/admin/trips/${trip.id}`, { action, note }))) return;
    onChanged();
  }
  return (
    <div className="flex flex-col items-start gap-1">
      {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
      {trip.status !== "cancelled" && (
        <>
          {trip.hidden ? (
            <button onClick={() => act("restore")} disabled={busy} className="text-[12px] font-bold text-[var(--primary)] cursor-pointer disabled:opacity-40">Restore</button>
          ) : (
            <button onClick={() => act("hide")} disabled={busy} className="text-[12px] font-bold text-red-500 cursor-pointer disabled:opacity-40">Hide</button>
          )}
          {trippable(trip.status) && (
            <button onClick={() => act("cancel")} disabled={busy} className="text-[12px] font-bold text-red-600 cursor-pointer disabled:opacity-40">Cancel trip</button>
          )}
        </>
      )}
    </div>
  );
}

function trippable(s: string) {
  return s === "published" || s === "started" || s === "hidden";
}

export default function AdminTrips() {
  const t = useAdminTable<Trip>({ url: "/api/admin/trips" });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Live Trips</h2>
        <p className="text-[13px] text-[var(--muted)]">Moderation queue for rides. Hidden trips leave the public feed but stay visible to the driver.</p>
      </div>
      <StatusFilter value={t.status} onChange={t.changeStatus} options={OPS} />
      <DataTable
        columns={[
          {
            key: "route", label: "Route",
            render: (t0) => (
              <div>
                <p className="font-bold">{t0.from} → {t0.to}</p>
                <p className="text-[12px] text-[var(--muted)]">{t0.date} {t0.time} · {t0.driverName}</p>
              </div>
            ),
          },
          { key: "status", label: "Status", render: (t0) => <span className="font-bold">{t0.status}</span> },
          { key: "seats", label: "Seats", hideSm: true, render: (t0) => <>{t0.seatsTaken}/{t0.seatsTotal}</> },
          { key: "price", label: "Fare", hideSm: true, render: (t0) => <>₹{t0.priceLo}{t0.priceHi > t0.priceLo ? `–${t0.priceHi}` : ""}</> },
          { key: "bookings", label: "Pending", hideSm: true },
          { key: "share", label: "Code", hideSm: true, render: (t0) => <span className="font-mono">{t0.shareCode}</span> },
          { key: "actions", label: "", render: (t0) => <TripActions trip={t0} onChanged={t.reload} /> },
        ]}
        rows={t.rows}
        loading={t.loading}
        error={t.error}
        onRetry={t.reload}
        page={t.page}
        pageCount={t.pageCount}
        total={t.total}
        onPage={t.setPage}
        empty="No trips match this filter."
      />
    </div>
  );
}