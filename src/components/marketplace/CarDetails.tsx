"use client";
import { useState } from "react";
import { Gauge, MapPin, FileText, ShieldAlert, ShieldCheck, Share2 } from "lucide-react";
import { Card } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { fuelLabel, km } from "@/lib/car-search";
import { copyText } from "@/lib/utils";
import { VehicleGallery } from "./VehicleGallery";
import { PriceDisplay } from "./PriceDisplay";
import { ListingStatus } from "./ListingStatus";
import { SellerProfile } from "./SellerProfile";
import { WhatsAppEnquiry, type CarDetail } from "./WhatsAppEnquiry";
import { ReportDialog } from "@/components/safety/ReportDialog";

const SAFETY_TIPS: [string, string][] = [
  [
    "Inspect the car in person before paying.",
    "కారును చూసి, నడిపి, సంతృప్తి చెందాకే చెల్లించండి.",
  ],
  [
    "Verify ownership, registration, insurance and documents.",
    "యజమాన్యం, రిజిస్ట్రేషన్, బీమా మరియు పత్రాలను ధృవీకరించండి.",
  ],
  [
    "We never ask for your documents or registration numbers.",
    "మీ పత్రాలు లేదా రిజిస్ట్రేషన్ నంబర్లు మేము ఎప్పుడూ అడగము.",
  ],
  [
    "PalleRide does not guarantee the vehicle, seller or transaction.",
    "కారు, విక్రేత లేదా లావాదేవీకి PalleRide హామీ ఇవ్వదు.",
  ],
];

export function CarDetails({
  car, seller,
}: {
  car: CarDetail;
  seller: { id: string; name: string; photo: string; rating: number; verified: boolean; joined: string; phone: string };
}) {
  const t = useT();
  const { te } = useLang();
  const [report, setReport] = useState(false);
  const [shared, setShared] = useState("");

  const share = async () => {
    const url = location.origin + "/cars/" + (car.shareCode || car.id);
    const text = [
      "🚗 PalleRide Used Car",
      `${car.make} ${car.model}`,
      `${car.year} · ${fuelLabel(car.fuel)} · ${car.transmission === "automatic" ? t("Automatic") : "Manual"}`,
      `${km(car.odometer)} · ${car.location}`,
      `${"₹" + car.price.toLocaleString("en-IN")}`,
      "",
      url,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "PalleRide", text, url });
      } else if (await copyText(text)) {
        setShared("copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <VehicleGallery photos={car.photos} title={`${car.make} ${car.model}`} />

      <div className="flex justify-between items-start gap-2 mt-3 mb-1">
        <h1 className="text-xl font-extrabold leading-snug">
          {car.make} {car.model}
        </h1>
        <div className="flex gap-2">
          <button onClick={share} className="border border-[var(--line)] bg-[var(--card)] rounded-full p-2.5 cursor-pointer" aria-label={t("Share")}>
            <Share2 size={16} className="text-[var(--mute)]" />
          </button>
          <button onClick={() => setReport(true)} className="border border-red-200 bg-red-50 rounded-full p-2.5 cursor-pointer" aria-label={t("Report")}>
            <ShieldAlert size={16} className="text-red-600" />
          </button>
        </div>
      </div>
      {shared === "copied" && <p className="text-xs text-[var(--primary-hover)] font-semibold mb-1">{t("Copied")}</p>}

      <div className="flex items-center gap-2.5 text-[13px] text-[var(--mute)] flex-wrap mb-1.5">
        <span>{car.year}</span>·<span>{fuelLabel(car.fuel)}</span>·
        <span>{car.transmission === "automatic" ? t("Automatic") : "Manual"}</span>
      </div>
      <div className="flex items-center gap-2.5 text-[13px] text-[var(--mute)] flex-wrap">
        <span className="flex items-center gap-1"><Gauge size={14} /> {km(car.odometer)}</span>
        <span className="flex items-center gap-1"><MapPin size={14} /> {car.location}</span>
      </div>
      <div className="my-2.5">
        <PriceDisplay price={car.price} />
      </div>
      <div className="mb-2.5">
        <ListingStatus status={car.status} expired={car.expired} />
      </div>

      {car.description && (
        <Card>
          <b className="text-sm">{t("About this car")}</b>
          <p className="text-[13px] text-[var(--mute)] mt-1.5 whitespace-pre-line">{car.description}</p>
        </Card>
      )}

      {car.ownership && (
        <Card>
          <b className="text-sm flex items-center gap-1.5"><FileText size={15} /> {t("Ownership & documents")}</b>
          <p className="text-[13px] text-[var(--mute)] mt-1.5">{car.ownership}</p>
        </Card>
      )}

      <Card>
        <b className="text-sm flex items-center gap-1.5"><ShieldCheck size={15} className="text-[var(--primary)]" /> {t("Buyer safety tips")}</b>
        <ul className="mt-1.5 grid gap-1.5">
          {SAFETY_TIPS.map(([en, cn]) => (
            <li key={en} className="text-[13px] text-[var(--mute)] flex items-start gap-2">
              <span className="text-[var(--primary)] font-bold">•</span>
              {te ? cn : en}
            </li>
          ))}
        </ul>
      </Card>

      <SellerProfile seller={seller} />
      <WhatsAppEnquiry car={car} sellerPhone={seller.phone} sellerName={seller.name} />

      <ReportDialog open={report} onClose={() => setReport(false)} targetType="vehicle" targetId={car.shareCode || car.id} />
    </div>
  );
}