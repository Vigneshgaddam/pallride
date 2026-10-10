"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarQuery, PublicCar } from "@/lib/car-search";
import { carQueryToParams } from "@/lib/car-search";
import { Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { waLink } from "@/lib/utils";
import { CarCard } from "./CarCard";
import { ListingSkeleton } from "./ListingSkeleton";

export function CarList({
  cars, total, page, pageCount, query, loading,
}: {
  cars: PublicCar[];
  total: number;
  page: number;
  pageCount: number;
  query: CarQuery;
  loading?: boolean;
}) {
  const t = useT();
  const { te } = useLang();
  const pageHref = (p: number) => "/cars?" + carQueryToParams({ ...query, page: p });

  return (
    <div>
      <h2 className="text-lg font-bold my-4">
        {t("Cars for sale")} · {total}
      </h2>

      {loading ? (
        <ListingSkeleton />
      ) : cars.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cars.map((c) => <CarCard key={c.id} car={c} />)}
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
          {te ? "కారు దొరకలేదు. వేరే ప్రాంతం లేదా ఫిల్టర్‌లు ప్రయత్నించండి." : "No cars found. Try a different place or filters."}
          <div className="h-2" />
          <Link href={"/sell"}>
            <Button variant="alt">{te ? "మీ కారు అమ్మండి" : "Sell your car"}</Button>
          </Link>
          <div className="h-1" />
          <small>
            <a href={waLink(te ? "హాయ్ పల్లెరైడ్, నేను ఒక కార్ కొనాలనుకుంటున్నాను." : "Hi PalleRide, I am looking to buy a car.")} className="text-[var(--primary)] font-bold">
              {te ? "వాట్సాప్‌లో అడగండి" : "Ask on WhatsApp"}
            </a>
            &nbsp;· {te ? "కార్లు ఇక్కడ కనిపిస్తాయి" : "Cars appear here once sellers publish them"}.
          </small>
        </Empty>
      )}
    </div>
  );
}