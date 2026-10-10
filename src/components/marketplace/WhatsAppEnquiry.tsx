"use client";
import { useState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { Card, Field, Input, Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import type { PublicCar } from "@/lib/car-search";
import { fuelLabel } from "@/lib/car-search";
import { inr } from "@/lib/utils";

export type CarDetail = PublicCar & {
  photos: string[];
  description: string;
  ownership: string;
  expired: boolean;
};

export function WhatsAppEnquiry({
  car, sellerPhone, sellerName,
}: {
  car: CarDetail;
  sellerPhone: string;
  sellerName: string;
}) {
  const t = useT();
  const { te } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const live = car.status === "published" && !car.expired;

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/cars/" + (car.shareCode || car.id) + "/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to save enquiry");
      setSent(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!live) {
    return (
      <Card id="enquire">
        <b className="text-sm">{t("Contact seller on WhatsApp")}</b>
        <div className="mt-2">
          <Empty>
            {car.expired
              ? te ? "ఈ లిస్టింగ్ గడువు ముగిసింది." : "This listing has expired."
              : te ? "ఈ లిస్టింగ్ ప్రస్తుతం అందుబాటులో లేదు." : "This listing is not available right now."}
          </Empty>
        </div>
      </Card>
    );
  }

  const number = sellerPhone.replace(/\D/g, "");
  const waHref =
    "https://wa.me/" + (number.length === 10 ? "91" + number : number) +
    "?text=" + encodeURIComponent(
      `Hi ${sellerName}, I found your ${car.make} ${car.model} (${car.year}, ${fuelLabel(car.fuel)}, ${inr(car.price)}) on PalleRide. Is it still available?\n${message ? message + "\n" : ""}\nWhere can I inspect the car?`
    );

  return (
    <Card id="enquire">
      <b className="text-sm">{t("Contact seller on WhatsApp")}</b>

      {sent ? (
        <div className="mt-3 grid gap-2.5">
          <div className="flex items-start gap-2 text-sm bg-[var(--tealbg)] rounded-[14px] px-3 py-2.5 text-[var(--primary-hover)]">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>
              {te
                ? `మీ సందేశం నమోదైంది. ${sellerName} ని వాట్సాప్‌లో సంప్రదించి, కారును చూసుకోండి.`
                : `Your enquiry was recorded. Message ${sellerName} on WhatsApp and agree an inspection time.`}
            </span>
          </div>
          <a href={waHref} target="_blank" rel="noreferrer">
            <Button className="flex items-center justify-center gap-2">
              <MessageCircle size={17} /> {t("Continue on WhatsApp")}
            </Button>
          </a>
          <p className="text-xs text-[var(--mute)]">
            {te
              ? "1. వాట్సాప్‌లో మాట్లాడండి · 2. కారు + పత్రాలు చూడండి · 3. పేమెంట్ చేయండి. PalleRide హామీ ఇవ్వదు."
              : "1. Chat on WhatsApp → 2. Inspect the car and papers → 3. Pay only after you are satisfied. PalleRide does not guarantee the deal."}
          </p>
          <Button variant="alt" onClick={() => setSent(false)}>{t("Edit enquiry")}</Button>
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
          <Field label={t("Message")}>
            <input
              className="border-0 bg-transparent outline-none flex-1 py-3 min-w-0 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={te ? "కారు గురించి అడగాలనుకుంటున్న ప్రశ్న" : "Anything to ask the seller?"}
            />
          </Field>
          {err && <p className="text-xs text-red-600 font-semibold">{err}</p>}
          <Button disabled={busy || !name || !phone} onClick={submit}>
            {busy ? te ? "సేవ్ అవుతోంది..." : "Saving..." : t("Continue on WhatsApp")}
          </Button>
          <p className="text-xs text-[var(--mute)]">
            {te
              ? "ఇది ఒక సందేశం మాత్రమే — కొనుగోలు కాదు. PalleRide కారును, విక్రేతను లేదా లావాదేవీని హామీ ఇవ్వదు."
              : "This is a message, not a purchase. PalleRide does not guarantee the vehicle, the seller or the transaction."}
          </p>
        </div>
      )}
    </Card>
  );
}