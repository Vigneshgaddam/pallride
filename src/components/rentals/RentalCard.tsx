"use client";
import Link from "next/link";
import { MapPin, Star, BadgeCheck, Users, Snowflake, Car } from "lucide-react";
import type { PublicRental } from "@/lib/rental-search";
import { Card } from "@/components/ui";
import { inr, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Thumbnail-only on search (2G): one small photo, nothing else. Details page loads full images.
function thumb(url: string) {
  if (!url) return "";
  return url + (url.includes("?") ? "&" : "?") + "w=420&q=60";
}

export function RentalCard({ rental }: { rental: PublicRental }) {
  const t = useT();
  const href = "/rentals/" + (rental.shareCode || rental.id);

  return (
    <Card className="overflow-hidden !p-0 !mb-0 h-full flex flex-col">
      <Link href={href} className="block">
        <div className="h-36 w-full overflow-hidden bg-[var(--tealbg)] flex items-center justify-center">
          {rental.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb(rental.photo)} alt={`${rental.make} ${rental.model}`} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Car size={44} className="text-[var(--primary)]" />
          )}
        </div>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex justify-between gap-2 items-start">
          <Link href={href}>
            <h3 className="font-extrabold text-[15px] leading-snug">
              {rental.make} {rental.model}
              {rental.year ? <span className="text-[var(--mute)] font-semibold"> · {rental.year}</span> : null}
            </h3>
          </Link>
          <div className="text-[var(--primary)] font-extrabold whitespace-nowrap text-sm">
            {inr(rental.pricePerDay)}
            <span className="text-[var(--mute)] font-semibold"> / {rental.unit}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-1.5 text-[13px] text-[var(--mute)] flex-wrap">
          <span className="flex items-center gap-1"><MapPin size={13} /> {rental.location}</span>
          <span className="flex items-center gap-1"><Users size={13} /> {rental.seats}</span>
          {rental.ac && <span className="flex items-center gap-1"><Snowflake size={13} /> AC</span>}
          <span className="text-xs">
            {fmtDate(rental.availableFrom)} – {fmtDate(rental.availableTo)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 mt-1.5 text-[13px] flex-wrap">
          <span className="text-[var(--mute)]">{rental.owner.name}</span>
          {rental.owner.rating > 0 && (
            <span className="flex items-center gap-1 text-[var(--mute)]">
              <Star size={13} className="text-[var(--amber)]" fill="var(--amber)" /> {rental.owner.rating.toFixed(1)}
            </span>
          )}
          {rental.owner.verified && (
            <span className="flex items-center gap-1 text-[var(--mute)]">
              <BadgeCheck size={13} className="text-[var(--primary)]" /> {t("Verified")}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-auto pt-3">
          <Link href={href} className="flex-1 text-center rounded-xl bg-[var(--primary)] text-white font-bold py-2 text-sm">
            {t("View details")}
          </Link>
          <Link href={href + "#enquire"} className="flex-1 text-center rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold py-2 text-sm">
            {t("Enquire")}
          </Link>
        </div>
      </div>
    </Card>
  );
}