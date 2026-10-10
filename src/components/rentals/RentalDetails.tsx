"use client";
import { useState } from "react";
import Link from "next/link";
import { MapPin, Users, Snowflake, Car, ShieldAlert, Share2, BadgeCheck, Star } from "lucide-react";
import { Card } from "@/components/ui";
import { inr, copyText } from "@/lib/utils";
import { useT, useLang } from "@/lib/i18n";
import { RentalAvailability } from "./RentalAvailability";
import { RentalPriceBreakdown } from "./RentalPriceBreakdown";
import { RentalEnquiry, type RentalDetail } from "./RentalEnquiry";
import { ReportDialog } from "@/components/safety/ReportDialog";

export function RentalDetails({
  listing, owner,
}: {
  listing: RentalDetail;
  owner: { id: string; name: string; photo: string; rating: number; verified: boolean; joined: string; phone: string };
}) {
  const t = useT();
  const { te } = useLang();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [report, setReport] = useState(false);
  const [shared, setShared] = useState("");

  const share = async () => {
    const url = location.origin + "/rentals/" + (listing.shareCode || listing.id);
    const text = [
      "🚗 PalleRide Rental",
      `${listing.make} ${listing.model}${listing.year ? " · " + listing.year : ""}`,
      `${listing.location} · ${listing.seats} seats${listing.ac ? " · AC" : ""}`,
      `${inr(listing.pricePerDay)}/day`,
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
      {/* Gallery — full images only here (2G: search shows thumbnails) */}
      <div className="bg-[var(--tealbg)] rounded-[20px] overflow-hidden border border-[var(--line)]">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={`${listing.make} ${listing.model}`} className="w-full h-52 object-cover" />
        ) : (
          <div className="h-52 flex items-center justify-center">
            <Car size={56} className="text-[var(--primary)]" />
          </div>
        )}
        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto [scrollbar-width:none]">
            {listing.photos.slice(1, 6).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt="" className="h-16 w-24 object-cover rounded-[12px] border border-[var(--line)]" />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-start gap-2 mt-3 mb-1">
        <h1 className="text-xl font-extrabold leading-snug">
          {listing.make} {listing.model}
          {listing.year ? <span className="text-[var(--mute)] font-bold"> · {listing.year}</span> : null}
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

      <div className="flex items-center gap-2.5 text-[13px] text-[var(--mute)] flex-wrap">
        <span className="flex items-center gap-1"><MapPin size={14} /> {listing.location}</span>
        <span className="flex items-center gap-1"><Users size={14} /> {listing.seats}</span>
        {listing.ac && <span className="flex items-center gap-1"><Snowflake size={14} /> AC</span>}
      </div>
      <div className="text-[var(--primary)] font-extrabold text-lg mt-1.5">
        {inr(listing.pricePerDay)} <span className="text-sm text-[var(--mute)] font-semibold">/ {listing.unit}</span>
      </div>

      <RentalAvailability
        status={listing.status}
        availableFrom={listing.availableFrom}
        availableTo={listing.availableTo}
        expired={listing.expired}
      />

      {listing.description && (
        <Card>
          <b className="text-sm">{t("About this vehicle")}</b>
          <p className="text-[13px] text-[var(--mute)] mt-1.5 whitespace-pre-line">{listing.description}</p>
        </Card>
      )}
      {listing.conditions && (
        <Card>
          <b className="text-sm">{t("Owner terms")}</b>
          <p className="text-[13px] text-[var(--mute)] mt-1.5 whitespace-pre-line">{listing.conditions}</p>
        </Card>
      )}

      <Card>
        <b className="text-sm">{t("Owner")}</b>
        <Link href={owner.id ? "/drivers/" + owner.id : "#"} className="flex items-center gap-3 mt-2.5">
          {owner.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.photo} alt={owner.name} className="h-12 w-12 rounded-full object-cover border border-[var(--line)]" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[var(--primary)] text-white font-extrabold flex items-center justify-center">
              {owner.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {owner.name}
              {owner.verified && <BadgeCheck size={15} className="text-[var(--primary)]" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--mute)] mt-0.5">
              {owner.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-[var(--amber)]" fill="var(--amber)" /> {owner.rating.toFixed(1)}
                </span>
              )}
              {owner.joined && (
                <span>{te ? "నుండి" : "Joined"} {new Date(owner.joined).getFullYear()}</span>
              )}
            </div>
          </div>
          <span className="text-xs font-bold text-[var(--primary)]">{t("View profile")} →</span>
        </Link>
      </Card>

      <RentalPriceBreakdown pricePerDay={listing.pricePerDay} start={start} end={end} />
      <RentalEnquiry
        listing={listing}
        ownerPhone={owner.phone}
        ownerName={owner.name}
        start={start}
        end={end}
        onStart={setStart}
        onEnd={setEnd}
      />

      <ReportDialog open={report} onClose={() => setReport(false)} targetType="vehicle" targetId={listing.shareCode || listing.id} />
    </div>
  );
}