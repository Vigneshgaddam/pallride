"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Phone } from "lucide-react";
import { Button, Card, Badge, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { useDriver } from "@/lib/driver-store";
import { useRequireDriver } from "@/components/trip-form";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { BlockUserButton } from "@/components/safety/BlockUserButton";
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

export default function RequestsPage() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const { hydrate, phone } = useDriver();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [toast, setToast] = useState("");
  const [reportReq, setReportReq] = useState<Req | null>(null);

  const load = () => {
    if (!token) return;
    fetch("/api/driver/requests", { headers: { Authorization: "Bearer " + token } })
      .then((res) => res.json())
      .then((d) => setReqs(d.requests || []))
      .catch(() => setReqs([]));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { hydrate(); load(); }, [token]);

  if (!ready || !token) return <p className="text-center text-[var(--mute)] py-10">…</p>;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const decide = async (id: string, action: "confirm" | "reject") => {
    const msg = action === "confirm" ? t("Confirm") : t("Reject");
    if (!confirm(msg + "?")) return;
    const res = await fetch("/api/driver/requests/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (!res.ok) return flash(d.error || "Error");
    flash(action === "confirm" ? t("confirmed") : t("rejected"));
    load();
  };

  const pending = reqs.filter((x) => x.status === "pending");
  const past = reqs.filter((x) => x.status !== "pending");

  return (
    <div className="pb-6">
      <h1 className="text-xl font-extrabold mb-4">{t("Requests")} · {pending.length} {t("pending")}</h1>

      {pending.length ? (
        pending.map((x) => (
          <Card key={x.id}>
            <div className="flex justify-between gap-2 items-start">
              <div className="font-bold">{[x.trip.from, ...x.trip.stops, x.trip.to].join(" → ")}</div>
              <Badge className="bg-[var(--amber)] text-[var(--amber-ink)]">{x.seats.length} {t("Seat").toLowerCase()}</Badge>
            </div>
            <div className="text-[13px] text-[var(--mute)] mt-1.5">
              {whenLabel(x.trip.date)} · {fmtTime(x.trip.time)} · {x.seats.map((n) => "#" + n).join(", ")}
            </div>
            <div className="text-sm mt-2"><b>{x.name}</b> · {x.phone}</div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button className="!py-2 !text-xs flex items-center justify-center gap-1" onClick={() => decide(x.id, "confirm")}>
                <Check size={14} /> {t("Confirm")}
              </Button>
              <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1" onClick={() => decide(x.id, "reject")}>
                <X size={14} /> {t("Reject")}
              </Button>
              <a href={`tel:+91${x.phone}`}>
                <Button variant="alt" className="!py-2 !text-xs flex items-center justify-center gap-1">
                  <Phone size={13} /> {te ? "కాల్" : "Call"}
                </Button>
              </a>
            </div>
            <div className="flex justify-between items-center gap-2 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                <Link href={`/trips/${x.tripId}`} className="text-[var(--primary)] underline">{t("View Trip")}</Link>
                <button onClick={() => setReportReq(x)} className="text-red-600 underline cursor-pointer">{t("Report passenger")}</button>
                <BlockUserButton myPhone={phone} targetPhone={x.phone} />
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Empty>{te ? "ఇంకా బుకింగ్ అభ్యర్థనలు లేవు." : "No booking requests yet."}</Empty>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-[var(--mute)] uppercase tracking-wide mt-5 mb-2">{te ? "మునుపటి" : "Handled"}</h2>
          {past.map((x) => (
            <Card key={x.id} className="opacity-70">
              <div className="flex justify-between gap-2 items-center">
                <div className="text-sm">
                  <b>{[x.trip.from, ...x.trip.stops, x.trip.to].join(" → ")}</b>
                  <div className="text-[13px] text-[var(--mute)]">{x.name} · {x.seats.map((n) => "#" + n).join(", ")}</div>
                </div>
                <Badge className={x.status === "confirmed" ? "bg-[var(--primary)]" : "bg-red-500"}>
                  {x.status === "confirmed" ? t("confirmed") : t("rejected")}
                </Badge>
              </div>
            </Card>
          ))}
        </>
      )}

      {reportReq && (
        <ReportDialog
          open
          onClose={() => setReportReq(null)}
          targetType="passenger"
          targetId={reportReq.phone}
          targetPhone={reportReq.phone}
          fromPhone={phone}
        />
      )}

      {toast && <div className="fixed left-1/2 -translate-x-1/2 top-4 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] text-sm z-50">{toast}</div>}
    </div>
  );
}
