"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, CheckCircle2, Eye } from "lucide-react";
import type { PublicTrip } from "@/lib/seats";
import { Button, Card, Badge, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";
import { fmtTime, shareTrip, whenLabel } from "@/lib/utils";

type MyTrip = PublicTrip & { heldSeats: number[]; pendingRequests: number };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[var(--mute)]",
  published: "bg-[var(--primary)]",
  started: "bg-[var(--blue)]",
  completed: "bg-[var(--brand,var(--primary-hover))]",
  cancelled: "bg-red-600",
  expired: "bg-red-400",
};

export default function MyTripsPage() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const { hydrate } = useDriver();
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [toast, setToast] = useState("");

  const load = () => {
    if (!token) return;
    fetch("/api/driver/trips", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => setTrips(d.trips || []))
      .catch(() => setTrips([]));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { hydrate(); load(); }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const act = async (id: string, action: string, msg: string) => {
    const res = await fetch("/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    if (res.ok) { flash(msg); load(); }
  };

  const statusLabel = (s: string) =>
    s === "draft" ? t("Draft") : s === "published" ? t("Open") : s === "started" ? t("Started")
    : s === "completed" ? t("Completed") : s === "cancelled" ? t("Cancelled") : t("Expired");

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">{t("My trips")} · {trips.length}</h1>
        <Link href="/dashboard/trips/new">
          <Button className="!w-auto !py-2 flex items-center gap-1.5"><Plus size={16} /> {t("Post a trip")}</Button>
        </Link>
      </div>

      {trips.length ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {trips.map((trip) => (
          <Card key={trip.id} className="!mb-0 flex flex-col">
            <div className="flex justify-between gap-2 items-start">
              <div className="font-bold">{[trip.from, ...trip.stops, trip.to].join(" → ")}</div>
              <Badge className={STATUS_STYLE[trip.status]}>{statusLabel(trip.status)}</Badge>
            </div>
            <div className="text-[13px] text-[var(--mute)] mt-1.5">
              {whenLabel(trip.date)} · {fmtTime(trip.time)} ·{" "}
              <b className="text-[var(--ink)]">{trip.availableSeats} / {trip.seatsTotal}</b> {t("free")}
              {trip.pendingRequests > 0 && <span className="text-[var(--amber)] font-bold"> · {trip.pendingRequests} {t("pending")}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-[var(--line)]">
              <Link href={`/dashboard/trips/${trip.id}`}>
                <Button variant="alt" className="!py-2 !text-xs">{t("Manage")}</Button>
              </Link>
              <Link href={`/dashboard/trips/${trip.id}`}>
                <Button variant="alt" className="!py-2 !text-xs">{t("Update seats")}</Button>
              </Link>
              {trip.status === "published" && (
                <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1"
                  onClick={() => { if (confirm(t("Start trip") + "?")) act(trip.id, "start", t("Started")); }}>
                  <Play size={13} /> {t("Start trip")}
                </Button>
              )}
              {trip.status === "started" && (
                <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1"
                  onClick={() => { if (confirm(t("Mark completed") + "?")) act(trip.id, "complete", t("Completed")); }}>
                  <CheckCircle2 size={13} /> {t("Mark completed")}
                </Button>
              )}
              {(trip.status === "completed" || trip.status === "cancelled" || trip.status === "expired") && (
                <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1"
                  onClick={() => { if (confirm((te ? "తిరిగి తెరవాలా" : "Reopen") + "?")) act(trip.id, "reopen", t("Open")); }}>
                  <Play size={13} /> {te ? "తిరిగి తెరవండి" : "Reopen"}
                </Button>
              )}
              <Link href={`/trips/${trip.shareCode || trip.id}`}>
                <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1">
                  <Eye size={13} /> {te ? "చూడండి" : "View"}
                </Button>
              </Link>
              <Button
                variant="alt"
                className="!py-2 !text-xs"
                onClick={async () => { if ((await shareTrip(trip)) === "copied") flash("Copied!"); }}
              >
                {t("Share")}
              </Button>
            </div>
          </Card>
          ))}
        </div>
      ) : (
        <Empty>
          {te ? "ఇంకా ట్రిప్పులు లేవు." : "No trips yet. Post your first trip!"}
          <div className="h-2" />
          <Link href="/dashboard/trips/new"><Button>{t("Post a trip")}</Button></Link>
        </Empty>
      )}

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
