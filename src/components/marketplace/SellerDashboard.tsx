"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MessageCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { inr, waLink } from "@/lib/utils";
import { fuelLabel, km, type PublicCar } from "@/lib/car-search";
import { useRequireDriver } from "@/components/trip-form";

type Row = PublicCar & { photos: string[]; description: string; ownership: string; pendingCount: number };
type Enquiry = {
  id: string; listingId: string; name: string; phone: string;
  message: string; status: "pending" | "confirmed" | "declined"; createdAt: string;
  listing?: { title: string } | null;
};

const STATUS_LABEL: Record<PublicCar["status"] | "expired", { en: string; te: string; cls: string }> = {
  draft: { en: "Draft", te: "డ్రాఫ్ట్", cls: "bg-gray-200 text-gray-700" },
  published: { en: "Active", te: "యాక్టివ్", cls: "bg-[var(--primary)] text-white" },
  reserved: { en: "Reserved", te: "రిజర్వ్", cls: "bg-[var(--blue)] text-white" },
  sold: { en: "Sold", te: "అమ్ముడైంది", cls: "bg-gray-200 text-gray-700" },
  paused: { en: "Paused", te: "పాజ్", cls: "bg-gray-200 text-gray-700" },
  removed: { en: "Removed", te: "తీసివేయబడింది", cls: "bg-red-100 text-red-700" },
  expired: { en: "Expired", te: "ముగిసినది", cls: "bg-red-100 text-red-700" },
};

export function SellerDashboard() {
  const t = useT();
  const { te } = useLang();
  const { token, ready } = useRequireDriver();
  const [rows, setRows] = useState<Row[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch("/api/driver/cars", { headers: { Authorization: "Bearer " + token } })
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!r.ok) throw new Error(data.error || "Could not load listings");
        setRows(data.listings);
        setEnquiries(data.enquiries);
        setErr("");
      })
      .catch(() => alive && setErr("Could not load listings"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  const reload = async () => {
    try {
      const r = await fetch("/api/driver/cars", { headers: { Authorization: "Bearer " + token } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setRows(data.listings);
      setEnquiries(data.enquiries);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const act = async (id: string, action: string) => {
    try {
      const r = await fetch("/api/cars/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const decide = async (id: string, action: "confirm" | "decline") => {
    try {
      const r = await fetch("/api/driver/car-enquiries/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (!ready) return null;

  const myEnq = (listingId: string) => enquiries.filter((e) => e.listingId === listingId);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-extrabold">{t("My cars for sale")}</h1>
        <Link href="/dashboard/sales/new" className="bg-[var(--primary)] text-white rounded-xl px-3.5 py-2 text-sm font-bold flex items-center gap-1.5">
          <Plus size={16} /> {t("Sell a car")}
        </Link>
      </div>

      {err && <p className="text-xs text-red-600 font-semibold mb-2.5">{err}</p>}

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[18px] p-6 animate-pulse" />
      ) : rows.length === 0 ? (
        <Empty>
          {te ? "మీకు ఇంకా కార్లు అమ్మడానికి లేవు." : "You have no cars for sale yet."}
          <div className="h-1" />
          <small>{te ? "మీ మొదటి కారు జోడించండి" : "Add your first car"}</small>
        </Empty>
      ) : (
        rows.map((l) => {
          const label = STATUS_LABEL[l.expired ? "expired" : l.status];
          const enq = myEnq(l.id);
          return (
            <Card key={l.id}>
              <div className="flex items-center justify-between gap-2">
                <b className="text-[15px] leading-snug">
                  {l.make} {l.model}{l.year ? ` · ${l.year}` : ""}
                </b>
                <div className="flex items-center gap-1.5">
                  {l.pendingCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">{l.pendingCount}</span>
                  )}
                  <span className={`rounded-[10px] px-2.5 py-1 text-xs font-bold ${label.cls}`}>{te ? label.te : label.en}</span>
                </div>
              </div>
              <div className="text-[13px] text-[var(--mute)] mt-1 flex items-center gap-2 flex-wrap">
                <span>{l.year} · {fuelLabel(l.fuel)} · {l.transmission === "automatic" ? t("Automatic") : "Manual"}</span>
                <span className="text-[var(--primary)] font-bold">{inr(l.price)}</span>
              </div>
              <div className="text-xs text-[var(--mute)] mt-0.5">{km(l.odometer)} · {l.location}</div>

              {enq.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {enq.map((e) => (
                    <div key={e.id} className="border border-[var(--line)] rounded-[14px] p-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        {e.name}
                        <span className="text-[var(--mute)] font-semibold text-xs">{te ? "నుండి" : "on"} {fmt(e.createdAt)}</span>
                      </div>
                      {e.message && <p className="text-[13px] text-[var(--mute)] mt-0.5">{e.message}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a href={waLink(`Hi ${e.name}, regarding your enquiry about my ${l.make} ${l.model} on PalleRide: `)} target="_blank" rel="noreferrer">
                          <span className="flex items-center gap-1 rounded-lg bg-[#25D366] text-white px-2.5 py-1.5 text-xs font-bold">
                            <MessageCircle size={13} /> {t("Reply on WhatsApp")}
                          </span>
                        </a>
                        {e.status === "pending" && (
                          <>
                            <button onClick={() => decide(e.id, "confirm")} className="flex items-center gap-1 rounded-lg bg-[var(--primary)] text-white px-2.5 py-1.5 text-xs font-bold cursor-pointer">
                              <CheckCircle2 size={13} /> {t("Confirm")}
                            </button>
                            <button onClick={() => decide(e.id, "decline")} className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold cursor-pointer">
                              <XCircle size={13} /> {t("Decline")}
                            </button>
                          </>
                        )}
                        {e.status !== "pending" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--mute)]">
                            <Clock size={12} /> {e.status === "confirmed" ? t("Confirmed") : t("Declined")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {l.status === "draft" && <Button className="!py-2 !text-xs flex-1 min-w-[90px]" disabled={l.pendingCount > 0} onClick={() => act(l.id, "publish")}>{t("Publish")}</Button>}
                {l.status === "published" && <Button className="!py-2 !text-xs flex-1 min-w-[90px]" onClick={() => act(l.id, "pause")}>{t("Pause")}</Button>}
                {l.status === "paused" && !l.expired && <Button className="!py-2 !text-xs flex-1 min-w-[90px]" onClick={() => act(l.id, "resume")}>{t("Resume")}</Button>}
                {(l.status === "published" || l.status === "reserved") && (
                  <Button className="!py-2 !text-xs flex-1 min-w-[90px]" onClick={() => act(l.id, "sold")}>{t("Mark sold")}</Button>
                )}
                {(l.status === "draft" || l.status === "published" || l.status === "paused" || l.status === "reserved") && (
                  <Link href={"/dashboard/sales/" + l.id + "/edit"} className="flex-1 text-center rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold py-2 text-xs min-w-[90px]">
                    {t("Edit")}
                  </Link>
                )}
                {l.status !== "sold" && l.status !== "removed" && (
                  <Button variant="alt" className="!py-2 !text-xs flex-1 min-w-[90px]" onClick={() => act(l.id, "remove")}>{t("Remove")}</Button>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}