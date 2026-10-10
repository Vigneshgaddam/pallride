"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Play, CheckCircle2, Eye, Trash2, RefreshCw } from "lucide-react";
import type { Trip } from "@/lib/types";
import { Button, Card, Badge } from "@/components/ui";
import { SeatMap } from "@/components/trips/SeatMap";
import { ShareTrip } from "@/components/trips/ShareTrip";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";
import { fmtTime, whenLabel } from "@/lib/utils";

type MyTrip = { id: string; pendingRequests: number };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[var(--mute)]",
  published: "bg-[var(--primary)]",
  started: "bg-[var(--blue)]",
  completed: "bg-[var(--brand,var(--primary-hover))]",
  cancelled: "bg-red-600",
  expired: "bg-red-400",
};

export default function ManageTripPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const { te } = useLang();
  const r = useRouter();
  const { token, ready } = useRequireDriver();
  const { logout } = useDriver();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [taken, setTaken] = useState<number[]>([]);
  const [held, setHeld] = useState<number[]>([]);
  const [pending, setPending] = useState(0);
  const [isMine, setIsMine] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    fetch("/api/trips/" + id)
      .then((res) => res.json())
      .then((d) => {
        if (!d.trip) return setError(true);
        setError(false);
        setTrip(d.trip);
        setTaken(d.trip.seatsTaken || []);
        setHeld(d.trip.seatsHeld || []);
      })
      .catch(() => setError(true));
    if (token) {
      fetch("/api/driver/trips", { headers: { Authorization: "Bearer " + token } })
        .then((res) => res.json())
        .then((d) => {
          const mine: MyTrip | undefined = (d.trips || []).find((x: MyTrip) => x.id === id);
          setIsMine(!!mine);
          setPending(mine?.pendingRequests || 0);
        })
        .catch(() => {});
    }
  }, [id, token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;
  if (error)
    return (
      <div className="py-10 text-center">
        <p className="text-[var(--mute)] mb-3">{t("Could not load. Check connection and retry.")}</p>
        <Button variant="alt" onClick={load}>{t("Retry")}</Button>
      </div>
    );
  if (!trip) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const handle = async (body: Record<string, unknown>, msg?: string) => {
    const res = await fetch("/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    if (res.status === 401) { logout(); r.replace("/auth/login"); return false; }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      flash(d.error || t("Error"));
      return false;
    }
    load();
    if (msg) flash(msg);
    return true;
  };

  const act = (action: string, confirmMsg: string, msg: string) => {
    if (!confirm(confirmMsg + "?")) return;
    handle({ action }, msg);
  };

  const saveSeats = async () => {
    if (!confirm(t("Save seats") + "?")) return;
    await handle({ action: "seats", seats: taken }, t("Seats updated"));
  };

  if (!isMine)
    return (
      <div className="py-10 text-center">
        <p className="text-[var(--mute)] mb-3">{t("This trip does not belong to your account.")}</p>
        <Link href="/dashboard/trips"><Button variant="alt">{t("Back")}</Button></Link>
      </div>
    );

  const booked = taken.length;
  const statusLabel = (s: string) =>
    s === "draft" ? t("Draft") : s === "published" ? t("Open") : s === "started" ? t("Started")
    : s === "completed" ? t("Completed") : s === "cancelled" ? t("Cancelled") : t("Expired");

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-[var(--mute)] uppercase tracking-wide">{t("Trip")}</span>
        <Badge className={STATUS_STYLE[trip.status] || ""}>{statusLabel(trip.status)}</Badge>
      </div>
      <h1 className="text-xl font-extrabold mb-1">
        {[trip.from, ...trip.stops, trip.to].join(" → ")}
      </h1>
      <p className="text-sm text-[var(--mute)] mb-1">{whenLabel(trip.date)} · {fmtTime(trip.time)} · ₹{trip.priceLo}/seat</p>
      <p className="text-sm font-bold mb-4">
        <span className="text-[var(--primary)]">{booked} / {trip.seatsTotal}</span> {t("seats booked")}
        {held.length > 0 && <span className="text-[var(--mute)] font-semibold"> · +{held.length} {t("pending")}</span>}
        {pending > 0 && (
          <Link href="/dashboard/requests" className="ml-2 text-[var(--amber)] underline font-bold">{pending} {t("Requests")}</Link>
        )}
      </p>

      <SeatMap
        total={trip.seatsTotal}
        taken={taken}
        held={held}
        selected={[]}
        editable
        onToggle={(n) => {
          const next = taken.includes(n) ? taken.filter((x) => x !== n) : [...taken, n].sort((a, b) => a - b);
          setTaken(next);
        }}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="alt" onClick={() => {
          if (!confirm(t("Mark full") + "?")) return;
          setTaken(Array.from({ length: trip.seatsTotal }, (_, i) => i + 1));
        }}>
          {t("Mark full")}
        </Button>
        <Button variant="alt" onClick={() => {
          if (!confirm(t("Reopen all") + "?")) return;
          setTaken([]);
        }}>{t("Reopen all")}</Button>
      </div>
      <div className="h-2.5" />
      <Button onClick={saveSeats}>{t("Save seats")}</Button>

      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <Link href={`/dashboard/trips/${trip.id}/edit`}>
          <Button variant="alt" className="flex items-center justify-center gap-2">
            <Pencil size={15} /> {t("Edit trip")}
          </Button>
        </Link>
        <ShareTrip trip={trip} className="justify-center !rounded-xl" />
        <Link href={`/trips/${trip.shareCode || trip.id}`}>
          <Button variant="alt" className="flex items-center justify-center gap-2">
            <Eye size={15} /> {t("View Trip")}
          </Button>
        </Link>
        {trip.status === "published" && (
          <Button variant="alt" className="flex items-center justify-center gap-2" onClick={() => act("start", t("Start trip"), t("Started"))}>
            <Play size={15} /> {t("Start trip")}
          </Button>
        )}
        {trip.status === "started" && (
          <Button variant="alt" className="flex items-center justify-center gap-2" onClick={() => act("complete", t("Mark completed"), t("Completed"))}>
            <CheckCircle2 size={15} /> {t("Mark completed")}
          </Button>
        )}
        {(trip.status === "completed" || trip.status === "expired") && (
          <Button variant="alt" className="flex items-center justify-center gap-2" onClick={() => act("reopen", te ? "తిరిగి తెరవాలా" : "Reopen", t("Open"))}>
            <RefreshCw size={15} /> {te ? "తిరిగి తెరవండి" : "Reopen"}
          </Button>
        )}
      </div>

      {["published", "started", "draft"].includes(trip.status) && (
        <>
          <div className="h-2.5" />
          <Button variant="danger" className="flex items-center justify-center gap-2"
            onClick={() => act("cancel", t("Cancel trip"), t("Cancelled"))}>
            <Trash2 size={15} /> {t("Cancel trip")}
          </Button>
        </>
      )}

      <Card className="mt-4 !mb-0">
        <div className="text-xs font-bold text-[var(--mute)] uppercase tracking-wide mb-1">{t("Safety")}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/safety" className="text-[var(--primary)] font-bold">{t("Report passenger")}</Link>
          <Link href="/safety" className="text-[var(--primary)] font-bold">{t("Emergency information")}</Link>
        </div>
      </Card>

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
