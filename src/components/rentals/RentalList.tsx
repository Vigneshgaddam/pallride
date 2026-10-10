"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicRental, RentalQuery } from "@/lib/rental-search";
import { rentalQueryToParams } from "@/lib/rental-search";
import { Button, Empty } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { waLink } from "@/lib/utils";
import { RentalCard } from "./RentalCard";
import { RentalSkeleton } from "./RentalSkeleton";

export function RentalList({
  listings, total, page, pageCount, query, loading,
}: {
  listings: PublicRental[];
  total: number;
  page: number;
  pageCount: number;
  query: RentalQuery;
  loading?: boolean;
}) {
  const t = useT();
  const { te } = useLang();
  const pageHref = (p: number) => "/rentals?" + rentalQueryToParams({ ...query, page: p });

  return (
    <div>
      <h2 className="text-lg font-bold my-4">
        {t("Rentals")} · {total}
      </h2>

      {loading ? (
        <RentalSkeleton />
      ) : listings.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((l) => <RentalCard key={l.id} rental={l} />)}
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
          {t("No rentals found. Try a different place or dates.")}
          <div className="h-2" />
          <a href={waLink(te ? "హాయ్ పల్లెరైడ్, నాకు ఒక కారు అద్దెకి కావాలి." : "Hi PalleRide, I need a rental car.")}>
            <Button variant="alt">{te ? "వాట్సాప్‌లో అడగండి" : "Ask on WhatsApp"}</Button>
          </a>
          <div className="h-1" />
          <small>{te ? "యజమానులు లిస్టింగ్ ప్రచురిస్తే ఇక్కడ కనిపిస్తుంది." : "Listings appear here as soon as owners publish them."}</small>
        </Empty>
      )}
    </div>
  );
}