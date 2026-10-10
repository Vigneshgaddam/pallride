import { db } from "@/lib/db";
import { parseCarQuery, searchCars, carQueryToParams } from "@/lib/car-search";
import { CarSearch } from "@/components/marketplace/CarSearch";
import { CarFilters } from "@/components/marketplace/CarFilters";
import { CarList } from "@/components/marketplace/CarList";

// Phase 3: server-side used-car search — /cars?q=…&minPrice=…&sort=…
export const metadata = {
  title: "Buy a Car · PalleRide",
  description: "Buy a used car across Telangana. Compare asking prices, check the seller, inspect before you pay.",
};

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parseCarQuery(await searchParams);
  const result = await searchCars(q, await db.load());
  const key = carQueryToParams(q);

  return (
    <div>
      <CarSearch key={"s:" + key} initial={q} />
      <CarFilters key={"f:" + key} initial={q} />
      <CarList
        cars={result.cars}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        query={q}
      />
    </div>
  );
}