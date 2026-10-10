"use client";
import { useState } from "react";
import {
  Share2, MessageCircle, Send, MessageSquare, Mail, Link2, Check, X,
} from "lucide-react";
import { Sheet } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { tripShareText, copyText } from "@/lib/utils";

export type ShareableTrip = {
  id: string;
  shareCode?: string;
  from: string;
  to: string;
  stops?: string[];
  date: string;
  time: string;
  priceLo?: number;
  availableSeats?: number;
  driverRating?: number;
  driverVerified?: boolean;
};

// Opens a share sheet listing every app that can send /trips/<shareCode>.
export function ShareTrip({
  trip, variant = "button", className,
}: {
  trip: ShareableTrip;
  variant?: "button" | "icon";
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer ${className || ""}`}
          aria-label={t("Share")}
        >
          <Share2 size={14} /> {t("Share")}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-sm font-bold cursor-pointer ${className || ""}`}
        >
          <Share2 size={16} /> {t("Share trip")}
        </button>
      )}
      {open && <ShareSheet trip={trip} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareSheet({ trip, onClose }: { trip: ShareableTrip; onClose: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const origin = typeof location !== "undefined" ? location.origin : "";
  const url = origin + "/trips/" + (trip.shareCode || trip.id);
  const text = tripShareText(trip);
  const enc = encodeURIComponent;

  const targets = [
    { key: "whatsapp", label: t("WhatsApp"), icon: MessageCircle, href: `https://wa.me/?text=${enc(text)}`, tone: "bg-[#25D366] text-white" },
    { key: "telegram", label: t("Telegram"), icon: Send, href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, tone: "bg-[#229ED9] text-white" },
    { key: "sms", label: t("SMS"), icon: MessageSquare, href: `sms:?&body=${enc(text)}`, tone: "bg-[var(--primary-soft)] text-[var(--primary-hover)]" },
    { key: "email", label: t("Email"), icon: Mail, href: `mailto:?subject=${enc("PalleRide Trip")}&body=${enc(text)}`, tone: "bg-[var(--chip-peach)] text-[var(--forest)]" },
  ];

  const canNative = typeof navigator !== "undefined" && !!navigator.share;

  const copyLink = async () => {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 900);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "PalleRide", text, url });
      onClose();
    } catch {
      /* cancelled */
    }
  };

  return (
    <Sheet open onClose={onClose} labelledBy="share-title">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 id="share-title" className="text-lg font-extrabold">{t("Share trip")}</h2>
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="p-1.5 -mr-1.5 rounded-full text-[var(--mute)] hover:bg-[var(--primary-soft)] cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
      <p className="text-xs text-[var(--mute)] mb-3">{t("Send to")}</p>

      <div className="grid grid-cols-3 gap-3">
        {targets.map(({ key, label, icon: Icon, href, tone }) => (
          <a key={key} href={href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5">
            <span className={`w-14 h-14 rounded-2xl grid place-items-center ${tone}`}>
              <Icon size={24} />
            </span>
            <span className="text-[11px] font-semibold text-center">{label}</span>
          </a>
        ))}
        <button onClick={copyLink} className="flex flex-col items-center gap-1.5 cursor-pointer">
          <span className="w-14 h-14 rounded-2xl grid place-items-center bg-[var(--primary-soft)] text-[var(--primary-hover)]">
            {copied ? <Check size={24} /> : <Link2 size={24} />}
          </span>
          <span className="text-[11px] font-semibold text-center">{copied ? t("Copied") : t("Copy link")}</span>
        </button>
        {canNative && (
          <button onClick={nativeShare} className="flex flex-col items-center gap-1.5 cursor-pointer">
            <span className="w-14 h-14 rounded-2xl grid place-items-center bg-[var(--chip-green)] text-[var(--forest)]">
              <Share2 size={24} />
            </span>
            <span className="text-[11px] font-semibold text-center">{t("More apps")}</span>
          </button>
        )}
      </div>
    </Sheet>
  );
}