import { db } from "@/lib/db";
import { parseRentalQuery, searchRentals, rentalQueryToParams } from "@/lib/rental-search";
import { RentalSearch } from "@/components/rentals/RentalSearch";
import { RentalFilters } from "@/components/rentals/RentalFilters";
import { RentalList } from "@/components/rentals/RentalList";

// Phase 2: server-side rental search — /rentals?q=Armoor&start=…&end=…
export const metadata = {
  title: "Rentals · PalleRide",
  description: "Rent a car for a day or a week across Telangana. Compare prices, check the owner, enquire on WhatsApp.",
};

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parseRentalQuery(await searchParams);
  const result = await searchRentals(q, await db.load());
  const key = rentalQueryToParams(q);

  return (
    <div>
      <RentalSearch key={"s:" + key} initial={q} />
      <RentalFilters key={"f:" + key} initial={q} />
      <RentalList
        listings={result.listings}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        query={q}
      />
    </div>
  );
}