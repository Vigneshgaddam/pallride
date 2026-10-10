"use client";
import Link from "next/link";
import { Star, BadgeCheck, Gauge, Car } from "lucide-react";
import type { PublicCar } from "@/lib/car-search";
import { fuelLabel, km } from "@/lib/car-search";
import { Card } from "@/components/ui";
import { inr } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Thumbnail-only on search (2G): one small photo per card.
function thumb(url: string) {
  if (!url) return "";
  return url + (url.includes("?") ? "&" : "?") + "w=420&q=60";
}

export function CarCard({ car }: { car: PublicCar }) {
  const t = useT();
  const href = "/cars/" + (car.shareCode || car.id);

  return (
    <Card className="overflow-hidden !p-0 !mb-0 h-full flex flex-col">
      <Link href={href} className="block">
        <div className="h-36 w-full overflow-hidden bg-[var(--tealbg)] flex items-center justify-center">
          {car.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb(car.thumb)} alt={`${car.make} ${car.model}`} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Car size={44} className="text-[var(--primary)]" />
          )}
        </div>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col">
        <Link href={href}>
          <h3 className="font-extrabold text-[15px] leading-snug">
            {car.make} {car.model}
          </h3>
        </Link>
        <div className="text-[13px] text-[var(--mute)] mt-0.5">
          {car.year} · {fuelLabel(car.fuel)} · {car.transmission === "automatic" ? t("Automatic") : "Manual"}
        </div>
        <div className="text-[13px] text-[var(--mute)] flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1"><Gauge size={13} /> {km(car.odometer)}</span>
          <span>· {car.location}</span>
        </div>

        <div className="mt-2">
          <div className="text-[var(--primary)] font-extrabold text-lg leading-none">{inr(car.price)}</div>
          <div className="text-[11px] text-[var(--mute)] uppercase tracking-wide font-bold">{t("Asking price")}</div>
        </div>

        <div className="flex items-center gap-2.5 mt-2 text-[13px] flex-wrap">
          <span className="text-[var(--mute)]">{car.seller.name}</span>
          {car.seller.rating > 0 && (
            <span className="flex items-center gap-1 text-[var(--mute)]">
              <Star size={13} className="text-[var(--amber)]" fill="var(--amber)" /> {car.seller.rating.toFixed(1)}
            </span>
          )}
          {car.seller.verified && (
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