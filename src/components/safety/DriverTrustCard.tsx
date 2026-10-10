"use client";
import Link from "next/link";
import { Star, Route, AlertTriangle, Car } from "lucide-react";
import { Card } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { VerificationBadge } from "./VerificationBadge";

export type TrustDriver = {
  id: string;
  name: string;
  photo: string;
  about: string;
  serviceAreas: string[];
  verified: boolean;
  rating: number;
  ratingsCount: number;
  tripsCount: number;
  cancellations: number;
  joined: string;
  vehicle: { make: string; model: string; year: string; seats: number; ac: boolean } | null;
};

export function DriverTrustCard({ driver, link = false }: { driver: TrustDriver; link?: boolean }) {
  const t = useT();
  const name = link ? (
    <Link href={`/drivers/${driver.id}`} className="hover:underline">
      {driver.name}
    </Link>
  ) : (
    driver.name
  );
  return (
    <Card>
      <div className="flex items-center gap-3">
        {driver.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={driver.photo} alt="" className="w-12 h-12 rounded-full object-cover border border-[var(--line)]" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--tealbg)] grid place-items-center text-lg font-extrabold">
            {driver.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-extrabold flex items-center gap-1.5 flex-wrap">{name}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--mute)] font-semibold mt-0.5">
            {driver.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[var(--amber)]" fill="var(--amber)" /> {driver.rating.toFixed(1)}
                <span>({driver.ratingsCount})</span>
              </span>
            )}
            <span>{driver.tripsCount} {t("Completed").toLowerCase()}</span>
            {driver.serviceAreas.length > 0 && (
              <span className="flex items-center gap-1"><Route size={12} /> {driver.serviceAreas.slice(0, 2).join(", ")}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <VerificationBadge verified={driver.verified} />
        {driver.cancellations > 0 && (
          <span className="text-[11px] font-bold text-amber-600 inline-flex items-center gap-1"><AlertTriangle size={12} /> {driver.cancellations} {t("cancelled").toLowerCase()}</span>
        )}
      </div>

      {driver.about && <p className="text-sm mt-2.5 text-[var(--mute)]">{driver.about}</p>}

      {driver.vehicle && (
        <div className="text-[13px] mt-2.5 text-[var(--mute)] font-semibold inline-flex items-center gap-1.5">
          <Car size={14} /> {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.year} · {driver.vehicle.seats} {t("Seat").toLowerCase()}s{driver.vehicle.ac ? " · AC" : ""}
        </div>
      )}
    </Card>
  );
}