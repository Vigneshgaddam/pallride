"use client";
import { useState } from "react";
import { MessageCircle, ShieldCheck, ChevronLeft, Check } from "lucide-react";
import { Button, Field, Input, Sheet } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { fmtTime, waLink, whenLabel, priceLabel } from "@/lib/utils";
import { TripRoute } from "./TripRoute";

export type BookingTrip = {
  id: string;
  shareCode: string;
  from: string;
  to: string;
  stops: string[];
  date: string;
  time: string;
  priceLo: number;
  priceHi: number;
  seats: number[]; // requested seats
  name: string;
  phone: string;
};

const SAFETY_POINTS = [
  ["I will share this trip details with family or a friend.", "ఈ ట్రిప్ వివరాలు కుటుంబం లేదా స్నేహితుడితో పంచుకుంటాను."],
  ["I will verify the driver, vehicle and OTP before boarding.", "ఎక్కే ముందు డ్రైవర్, వాహనం, OTP ధృవీకరిస్తాను."],
  ["I will pay the driver directly — no advance transfer.", "డ్రైవర్‌కు నేరుగా చెల్లిస్తాను — ముందస్తు చెల్లింపు లేదు."],
];

// Phase 1 booking flow: details → safety confirmation → WhatsApp → driver confirms.
export function WhatsAppBooking({
  trip, selected, open, onClose, onBooked, onRefresh,
}: {
  trip: BookingTrip;
  selected: number[];
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  onRefresh?: () => void;
}) {
  const t = useT();
  const { te } = useLang();
  const [step, setStep] = useState<"details" | "safety">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => { setStep("details"); setError(""); onClose(); };

  const reserve = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/trips/${trip.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: selected, name: name.trim(), phone: phone.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Error");
        onRefresh?.();
        return;
      }
      window.open(
        waLink(
          `Hi, I reserved seat(s) ${selected.join(", ")} on PalleRide\n` +
          `${[trip.from, ...trip.stops, trip.to].join(" → ")}\n` +
          `${whenLabel(trip.date)}, ${fmtTime(trip.time)}\n` +
          `Name: ${name.trim()}\nPhone: ${phone.trim()}\nRequest #${d.request.id}\n\n` +
          `Please confirm — booking status: REQUESTED`
        ),
        "_blank"
      );
      setStep("details");
      setAgreed(false);
      onBooked();
      close();
    } catch {
      setError(t("Could not load. Check connection and retry."));
    } finally {
      setBusy(false);
    }
  };

  const detailsNext = () => {
    if (!name.trim() || phone.trim().length < 10) {
      setError(t("Add your name and 10-digit phone"));
      return;
    }
    setError("");
    setStep("safety");
  };

  return (
    <Sheet open={open} onClose={close}>
      <div className="flex items-center justify-between mb-1">
        {step === "safety" ? (
          <button onClick={() => setStep("details")} className="flex items-center gap-1 text-sm font-bold text-[var(--mute)] cursor-pointer">
            <ChevronLeft size={16} /> {t("Back")}
          </button>
        ) : <span />}
        <span className="text-xs font-bold text-[var(--mute)]">{step === "details" ? "1 / 2" : "2 / 2"}</span>
      </div>

      <h3 className="text-lg font-bold mb-1">
        <TripRoute from={trip.from} stops={trip.stops} to={trip.to} />
      </h3>
      <p className="text-sm text-[var(--mute)] mb-3.5">
        {selected.map((n) => `#${n}`).join(", ")} · {priceLabel(trip.priceLo, trip.priceHi, selected.length)}
      </p>

      {step === "details" ? (
        <>
          <div className="grid gap-2 mb-3.5">
            <Field label={t("Name")}>
              <Input placeholder={te ? "మీ పేరు" : "Your name"} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t("Phone")}>
              <Input type="tel" placeholder={te ? "10 అంకెల నంబర్" : "10-digit number"} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <Button onClick={detailsNext}>{t("Next")}</Button>
        </>
      ) : (
        <>
          <div className="bg-[var(--tealbg)] rounded-[18px] p-3.5 mb-3">
            <div className="flex items-center gap-2 font-bold text-sm mb-2">
              <ShieldCheck size={17} className="text-[var(--primary-hover)]" /> {t("Safety check")}
            </div>
            <ul className="grid gap-2.5">
              {SAFETY_POINTS.map(([en, te2]) => (
                <li key={en} className="flex gap-2 text-[13px] leading-snug">
                  <Check size={14} className="text-[var(--primary)] mt-0.5 shrink-0" /> <span>{te ? te2 : en}</span>
                </li>
              ))}
            </ul>
          </div>
          <label className="flex items-start gap-2.5 text-sm font-semibold mb-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[var(--primary)]" />
            {t("I confirm the safety points above")}
          </label>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <Button onClick={reserve} disabled={!agreed || busy} className="flex items-center justify-center gap-2">
            <MessageCircle size={16} /> {t("Confirm & open WhatsApp")}
          </Button>
          <p className="text-xs text-[var(--mute)] mt-2.5">{t("Seats held — driver will confirm shortly")}</p>
        </>
      )}
      <div className="h-2" />
      <Button variant="alt" onClick={close}>{t("Close")}</Button>
    </Sheet>
  );
}
