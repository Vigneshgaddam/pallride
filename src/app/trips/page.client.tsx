import { db } from "@/lib/db";
import { parseTripQuery, searchTrips, tripQueryToParams } from "@/lib/trip-search";
import { TripSearch } from "@/components/trips/TripSearch";
import { TripFilters } from "@/components/trips/TripFilters";
import { TripList } from "@/components/trips/TripList";

// Server-side search, paginated, URL-based: /trips?from=Korutla&to=JBS&date=2026-10-09
// Results are rendered on the server → shareable links + SEO-friendly HTML.
export const metadata = {
  title: "Live trips · PalleRide",
  description: "Village-to-city shared rides across Telangana. Search live trips, book a seat on WhatsApp.",
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parseTripQuery(await searchParams);
  const result = await searchTrips(q, await db.load());
  const key = tripQueryToParams(q);

  return (
    <div>
      <TripSearch key={"s:" + key} initial={q} />
      <TripFilters key={"f:" + key} initial={q} />
      <TripList
        trips={result.trips}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        query={q}
      />
    </div>
  );
}
