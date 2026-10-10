"use client";
import { useState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { Card, Field, Input, Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { daysBetween } from "@/lib/rental-search";
import type { PublicRental } from "@/lib/rental-search";

export type RentalDetail = PublicRental & {
  photos: string[];
  description: string;
  conditions: string;
  expired: boolean;
};

type EnquiryState = { ok: true; days: number; contact: string } | { ok: false; error: string } | null;

export function RentalEnquiry({
  listing, ownerPhone, ownerName, start, end, onStart, onEnd,
}: {
  listing: RentalDetail;
  ownerPhone: string;
  ownerName: string;
  start: string;
  end: string;
  onStart: (d: string) => void;
  onEnd: (d: string) => void;
}) {
  const t = useT();
  const { te } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<EnquiryState>(null);

  const windowMs = (d: number) => Math.min(
    listing.availableTo.length ? new Date(listing.availableTo).getTime() : 0,
    new Date(listing.availableFrom).getTime() + d
  );
  const quick = [
    { key: "1d", label: te ? "1 రోజు" : "1 day", ms: 0 },
    { key: "2d", label: te ? "2 రోజు" : "2 days", ms: 86400000 },
    { key: "3d", label: te ? "3 రోజు" : "3 days", ms: 172800000 },
    { key: "1w", label: te ? "వారం" : "1 week", ms: 604800000 },
  ].map((q) => ({
    ...q,
    end: new Date(windowMs(q.ms)).toISOString().slice(0, 10),
  }));

  const bookable = listing.status === "available" && !listing.expired;

  const submit = async () => {
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/rentals/" + (listing.shareCode || listing.id) + "/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, startDate: start, endDate: end, message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to save enquiry");
      setRes({ ok: true, days: Math.max(1, daysBetween(start, end) || 1), contact: (data.enquiry as { contact?: string })?.contact || "" });
    } catch (e) {
      setRes({ ok: false, error: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (!bookable) {
    return (
      <Card id="enquire">
        <b className="text-sm">{t("Enquire on WhatsApp")}</b>
        <div className="mt-2">
          <Empty>
            {listing.expired
              ? te ? "ఈ లిస్టింగ్ కాలం ముగిసింది." : "This listing's availability window has ended."
              : te ? "ఈ లిస్టింగ్ ప్రస్తుతం అందుబాటులో లేదు." : "This listing is not available right now."}
          </Empty>
        </div>
      </Card>
    );
  }

  const waMsg = `Hi ${ownerName}, I'm interested in renting your ${listing.make} ${listing.model} (${listing.location}) on PalleRide.\n₹${listing.pricePerDay}/day · ${fmtRange(start, end)} (~${Math.max(1, daysBetween(start, end) || 1)} day(s))${message ? "\n" + message : ""}\n\nIs it available for these dates?`;
  const waHref =
    "https://wa.me/" +
    (ownerPhone.replace(/\D/g, "").length === 10 ? "91" + ownerPhone.replace(/\D/g, "") : ownerPhone.replace(/\D/g, "")) +
    "?text=" +
    encodeURIComponent(waMsg);

  function fmtRange(a: string, b: string) {
    if (!a) return "dates TBD";
    if (!b) return a;
    return `${a} to ${b}`;
  }

  return (
    <Card id="enquire">
      <b className="text-sm">{t("Enquire on WhatsApp")}</b>

      {res && res.ok ? (
        <div className="mt-3 grid gap-2.5">
          <div className="flex items-start gap-2 text-sm bg-[var(--tealbg)] rounded-[14px] px-3 py-2.5 text-[var(--primary-hover)]">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>
              {te
                ? `మీ విచారణ నమోదైంది. ${ownerName} ని వాట్సాప్‌లో సంప్రదించి ధృవీకరించండి.`
                : `Your enquiry was recorded. Message ${ownerName} on WhatsApp and confirm your dates.`}
            </span>
          </div>
          <a href={waHref} target="_blank" rel="noreferrer">
            <Button variant="default" className="flex items-center justify-center gap-2">
              <MessageCircle size={17} /> {t("Continue on WhatsApp")}
            </Button>
          </a>
          <p className="text-xs text-[var(--mute)]">
            {te
              ? "1. వాట్సాప్‌లో మాట్లాడండి · 2. యజమాని నిర్ధారిస్తే బుక్. ఎలాంటి చెల్లింపు లేదు — నేరుగా అంగీకరించండి."
              : "1. Chat on WhatsApp → 2. Booking is confirmed only when the owner confirms. No payments here — agree terms directly."}
          </p>
          <Button variant="alt" onClick={() => setRes(null)}>{t("Edit enquiry")}</Button>
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t("Name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={te ? "మీ పేరు" : "Your name"} />
            </Field>
            <Field label={t("Phone")}>
              <Input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="90000 00000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t("Start")}>
              <Input type="date" min={listing.availableFrom} max={listing.availableTo} value={start} onChange={(e) => onStart(e.target.value)} />
            </Field>
            <Field label={t("End")}>
              <Input type="date" min={start || listing.availableFrom} max={listing.availableTo} value={end} onChange={(e) => onEnd(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quick.map((q) => (
              <button
                key={q.key}
                className="border border-[var(--line)] bg-[var(--bg)] rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-40"
                disabled={!start}
                onClick={() => onEnd(q.end)}
              >
                {q.label}
              </button>
            ))}
          </div>
          <Field label={t("Message")}>
            <input
              className="border-0 bg-transparent outline-none flex-1 py-3 min-w-0 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={te ? "అదనపు వివరాలు" : "Anything else? e.g. wedding drop"}
            />
          </Field>

          {start && end && start > end && (
            <p className="text-xs text-red-600 font-semibold">{te ? "అంతం తేదీ మొదలు కంటే ముందే." : "End date is before the start date."}</p>
          )}

          {res && !res.ok && <p className="text-xs text-red-600 font-semibold">{res.error}</p>}

          <Button disabled={busy || !name || !phone || !start || !end || (!!start && !!end && start > end)} onClick={submit}>
            {busy ? te ? "సేవ్ అవుతోంది..." : "Saving..." : t("Save & Continue on WhatsApp")}
          </Button>
          <p className="text-xs text-[var(--mute)]">
            {te
              ? "This enquiry is not a confirmed booking."
              : "This enquiry is a message to the owner — not a confirmed booking."}
          </p>
        </div>
      )}
    </Card>
  );
}