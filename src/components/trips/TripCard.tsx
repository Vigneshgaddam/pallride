"use client";
import { useRouter } from "next/navigation";
import { Star, BadgeCheck } from "lucide-react";
import type { PublicTrip } from "@/lib/seats";
import { Card } from "@/components/ui";
import { fmtTime, priceLabel, whenLabel } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { TripRoute } from "./TripRoute";
import { TripStatus } from "./TripStatus";
import { ShareTrip } from "./ShareTrip";

export function TripCard({ trip }: { trip: PublicTrip }) {
  const t = useT();
  const r = useRouter();

  return (
    <Card className="cursor-pointer !mb-0 h-full flex flex-col" onClick={() => r.push("/trips/" + (trip.shareCode || trip.id))}>
      <div className="flex justify-between gap-2.5 items-start">
        <TripRoute from={trip.from} stops={trip.stops} to={trip.to} className="text-[15px]" />
        <div className="text-[var(--primary)] font-extrabold whitespace-nowrap text-sm">
          {priceLabel(trip.priceLo, trip.priceHi)}
          <span className="text-[var(--mute)] font-semibold"> / {t("Seat").toLowerCase()}</span>
        </div>
      </div>

      <div className="text-[13px] text-[var(--mute)] mt-1.5">
        {whenLabel(trip.date)} · {fmtTime(trip.time)}
      </div>

      <div className="flex items-center gap-2.5 mt-2 text-[13px] flex-wrap">
        <TripStatus status={trip.status} availableSeats={trip.availableSeats} />
        {trip.driverRating > 0 && (
          <span className="flex items-center gap-1 text-[var(--mute)]">
            <Star size={13} className="text-[var(--amber)]" fill="var(--amber)" /> {trip.driverRating.toFixed(1)}
          </span>
        )}
        {trip.driverVerified && (
          <span className="flex items-center gap-1 text-[var(--mute)]">
            <BadgeCheck size={13} className="text-[var(--primary)]" /> {t("Verified")}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-3">
        <button
          onClick={(e) => { e.stopPropagation(); r.push("/trips/" + (trip.shareCode || trip.id)); }}
          className="flex-1 rounded-xl bg-[var(--primary)] text-white font-bold py-2 text-sm cursor-pointer"
        >
          {t("View Trip")}
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <ShareTrip trip={trip} className="!py-2 !text-sm !rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
