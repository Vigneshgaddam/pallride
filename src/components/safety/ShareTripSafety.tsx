"use client";
import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";
import { useT, useLang } from "@/lib/i18n";
import { fmtTime, whenLabel, copyText } from "@/lib/utils";

export type SafetyTrip = {
  id: string;
  shareCode?: string;
  from: string;
  to: string;
  stops?: string[];
  date: string;
  time: string;
  priceLo?: number;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  driverVerified?: boolean;
};

// Share a trip's key details (route, time, driver) with a trusted contact.
// No maps, no tracking — just a lightweight text/WhatsApp/SMS message.
export function ShareTripSafety({ trip }: { trip?: SafetyTrip | null }) {
  const t = useT();
  const { te } = useLang();
  const [copied, setCopied] = useState(false);

  if (!trip) {
    return (
      <p className="text-xs text-[var(--mute)] font-semibold">
        {te ? "ట్రిప్ ప్రారంభించే ముందు మీ ప్రయాణం వివరాలు కుటుంబంతో పంచుకోండి." : "Share your trip details with family before you leave."}
      </p>
    );
  }

  const head = `🛡️ PalleRide trip\n${[trip.from, ...(trip.stops || []), trip.to].join(" → ")}\n${whenLabel(trip.date)} · ${fmtTime(trip.time)}`;
  const driver = trip.driverName
    ? `\nDriver: ${trip.driverName}${trip.driverRating ? ` (⭐ ${trip.driverRating})` : ""}${trip.driverVerified ? " ✓ Verified" : ""}${trip.driverPhone ? ` · ${trip.driverPhone}` : ""}`
    : "";
  const url = `${typeof location !== "undefined" ? location.origin : ""}/trips/${trip.shareCode || trip.id}`;
  const text = head + driver + `\nSeats: ${trip.priceLo ? `₹${trip.priceLo}` : "…"}\nDetails: ${url}`;

  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const smsLink = `sms:${trip.driverPhone || ""}?body=${encodeURIComponent(text)}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div>
      <div className="flex gap-2 mt-2.5">
        <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-[var(--primary)] text-white text-xs font-bold py-2.5">
          <MessageCircle size={13} /> {te ? "వాట్సాప్" : "WhatsApp"}
        </a>
        <a href={smsLink} className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-[var(--card)] border border-[var(--line)] text-xs font-bold py-2.5">
          SMS
        </a>
        <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-[var(--card)] border border-[var(--line)] text-xs font-bold py-2.5 cursor-pointer">
          {copied ? <Check size={13} className="text-[var(--primary)]" /> : <Copy size={13} />} {copied ? t("Copied") : t("Copy")}
        </button>
      </div>
    </div>
  );
}