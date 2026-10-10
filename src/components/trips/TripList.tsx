"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicTrip } from "@/lib/seats";
import { Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { waLink } from "@/lib/utils";
import type { TripQuery } from "@/lib/trip-search";
import { tripQueryToParams } from "@/lib/trip-search";
import { TripCard } from "./TripCard";
import { TripSkeleton } from "./TripSkeleton";

export function TripList({
  trips, total, page, pageCount, query, loading,
}: {
  trips: PublicTrip[];
  total: number;
  page: number;
  pageCount: number;
  query: TripQuery;
  loading?: boolean;
}) {
  const t = useT();
  const { te } = useLang();

  const pageHref = (p: number) => "/trips?" + tripQueryToParams({ ...query, page: p });

  return (
    <div>
      <h2 className="text-lg font-bold my-4">
        {t("Live trips")} · {total}
      </h2>

      {loading ? (
        <TripSkeleton />
      ) : trips.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
          </div>
          {pageCount > 1 && (
            <nav className="flex items-center justify-between my-4" aria-label="Pagination">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
                  <ChevronLeft size={16} /> {t("Prev")}
                </Link>
              ) : <span />}
              <span className="text-xs text-[var(--mute)]">
                {t("Page")} {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <Link href={pageHref(page + 1)} className="flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
                  {t("Next")} <ChevronRight size={16} />
                </Link>
              ) : <span />}
            </nav>
          )}
        </>
      ) : (
        <Empty>
          {t("No trips found. Try fewer words, or request a ride.")}
          <div className="h-2" />
          <a href={waLink(`Hi PalleRide, I need a ride from ${query.from || "___"} to ${query.to || "___"}.`)}>
            <Button variant="alt">{t("Request a ride")}</Button>
          </a>
          <div className="h-1" />
          <small>{te ? "డ్రైవర్‌లు ట్రిప్ పోస్ట్ చేస్తే ఇక్కడ కనిపిస్తుంది." : "Trips appear here as soon as drivers post them."}</small>
        </Empty>
      )}
    </div>
  );
}
