"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Check, Phone, X } from "lucide-react";
import { Sheet, Button } from "@/components/ui";
import { useDriver } from "@/lib/driver-store";
import { useT, useLang } from "@/lib/i18n";
import { fmtTime, whenLabel } from "@/lib/utils";

type Req = {
  id: string;
  tripId: string;
  seats: number[];
  name: string;
  phone: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  trip: { from: string; to: string; stops: string[]; date: string; time: string };
};

const POLL_MS = 15000;
const SEEN_KEY = "pr_seen_bookings";

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(set: Set<string>) {
  window.localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
}

export function DriverBookingAlert() {
  const t = useT();
  const { te } = useLang();
  const { token, hydrate } = useDriver();
  const path = usePathname();
  const [pending, setPending] = useState<Req[]>([]);
  const [open, setOpen] = useState(false);
  const alerted = useRef<Set<string> | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    alerted.current = alerted.current || loadSeen();
    let alive = true;
    let last = 0;

    const load = async () => {
      const now = Date.now();
      if (now - last < 3000) return;
      last = now;
      try {
        const res = await fetch("/api/driver/requests", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!res.ok || !alive) return;
        const d = await res.json();
        const ps: Req[] = ((d.requests || []) as Req[]).filter(
          (x) => x.status === "pending"
        );
        if (!alive) return;
        setPending(ps);
        const seen = alerted.current || new Set();
        const fresh = ps.filter((x) => !seen.has(x.id));
        if (fresh.length > 0) {
          fresh.forEach((x) => seen.add(x.id));
          saveSeen(seen);
          if (!path.startsWith("/dashboard/requests")) setOpen(true);
        }
      } catch {
        /* network error ignored */
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [token, path]);

  if (!token) return null;

  const decide = async (id: string, action: "confirm" | "reject") => {
    const res = await fetch("/api/driver/requests/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return;
    setPending((p) => p.filter((x) => x.id !== id));
  };

  return (
    <>
      {!open && pending.length > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 pr-no-print flex items-center gap-2 rounded-full bg-[var(--forest)] text-white pl-3.5 pr-4 py-2.5 text-sm font-bold shadow-[var(--shadow-lg)] hover:bg-[var(--forest-hover)] cursor-pointer"
          style={{ left: "max(18px, calc(50% - 247px))", bottom: "calc(78px + env(safe-area-inset-bottom))" }}
        >
          <BellRing size={16} className="animate-pulse" />
          {pending.length} {t("Bookings")}
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="drv-booking-title">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="drv-booking-title" className="text-lg font-extrabold">
            {t("New booking")} · {pending.length}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label={t("close")}
            className="p-1.5 -mr-1.5 rounded-full text-[var(--mute)] hover:bg-[var(--primary-soft)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="text-center text-sm text-[var(--mute)] py-8">
            {te ? "కొత్త బుకింగ్ లేదు." : "No pending bookings."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {pending.map((x) => (
              <div key={x.id} className="border border-[var(--line)] rounded-2xl p-3">
                <div className="font-bold text-sm">
                  {x.trip.from} → {x.trip.to}
                </div>
                <div className="text-xs text-[var(--mute)] mt-0.5">
                  {whenLabel(x.trip.date)} · {fmtTime(x.trip.time)} ·{" "}
                  {x.seats.map((n) => "#" + n).join(", ")}
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 text-sm">
                  <span className="min-w-0">
                    <b>{x.name}</b> · {x.phone}
                  </span>
                  <a
                    href={`tel:+91${x.phone}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--chip-green)]"
                  >
                    <Phone size={12} /> {te ? "కాల్" : "Call"}
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  <Button
                    className="!py-2 !text-xs flex items-center justify-center gap-1"
                    onClick={() => decide(x.id, "confirm")}
                  >
                    <Check size={14} /> {t("Confirm")}
                  </Button>
                  <Button
                    variant="alt"
                    className="!py-2 !text-xs flex items-center justify-center gap-1"
                    onClick={() => decide(x.id, "reject")}
                  >
                    <X size={14} /> {t("Reject")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/dashboard/requests"
          onClick={() => setOpen(false)}
          className="mt-3 block text-center text-sm font-bold text-[var(--primary)]"
        >
          {t("View all")} →
        </Link>
      </Sheet>
    </>
  );
}