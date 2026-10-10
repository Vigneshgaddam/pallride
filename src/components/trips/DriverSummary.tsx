"use client";
import Link from "next/link";
import { BadgeCheck, Phone, Star, User } from "lucide-react";
import { Card } from "@/components/ui";
import { useT } from "@/lib/i18n";

export function DriverSummary({
  name, verified, rating, completedTrips, phone, driverId,
}: {
  name: string;
  verified: boolean;
  rating: number;
  completedTrips?: number;
  phone?: string;
  driverId?: string;
}) {
  const t = useT();
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--tealbg)] grid place-items-center text-[var(--primary)]"><User size={20} /></div>
        <div className="flex-1">
          <div className="font-bold flex items-center gap-1.5">
            {driverId ? <Link href={`/drivers/${driverId}`} className="hover:underline">{name}</Link> : name}
            {verified && <BadgeCheck size={16} className="text-[var(--primary)]" />}
          </div>
          <div className="text-xs text-[var(--mute)] flex items-center gap-2 mt-0.5 flex-wrap">
            {rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[var(--amber)]" fill="var(--amber)" /> {rating.toFixed(1)}
              </span>
            )}
            {completedTrips !== undefined && <span>{completedTrips} {t("Completed").toLowerCase()}</span>}
            {verified && <span>· {t("Verified phone number")}</span>}
          </div>
        </div>
      </div>
      {phone && (
        <a href={`tel:+91${phone}`} className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          <Phone size={14} /> {t("Call driver")}
        </a>
      )}
    </Card>
  );
}
