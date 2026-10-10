import type { CarListing, CarTransmission, CarFuel, DB } from "./types";

// Phase 3: server-side, URL-based used-car search.
// One source of truth shared by /cars and /api/cars.

export const PAGE_SIZE = 9;

export type CarQuery = {
  q: string;           // location / make / model words
  minPrice: number;    // 0 = no limit
  maxPrice: number;
  make: string;
  model: string;
  minYear: number;     // manufacturing year >= (0 = any)
  fuel: "" | CarFuel;
  transmission: "" | CarTransmission;
  maxKm: number;       // 0 = no limit
  verified: boolean;   // verified sellers only
  sort: "newest" | "price" | "priceDesc";
  page: number;
  sellerId: string;    // internal
  all: boolean;        // internal — include non-published
};

export function parseCarQuery(sp: Record<string, string | string[] | undefined>): CarQuery {
  const s = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || "";
  };
  const n = (k: string) => Math.max(0, Number(s(k)) || 0);
  const fuel = ["petrol", "diesel", "cng", "electric", "hybrid"].includes(s("fuel")) ? s("fuel") : "";
  const transmission = ["manual", "automatic"].includes(s("transmission")) ? s("transmission") : "";
  const sort = ["price", "priceDesc"].includes(s("sort")) ? (s("sort") as CarQuery["sort"]) : "newest";
  return {
    q: s("q"),
    minPrice: n("minPrice"),
    maxPrice: n("maxPrice"),
    make: s("make"),
    model: s("model"),
    minYear: n("minYear"),
    fuel: fuel as CarQuery["fuel"],
    transmission: transmission as CarQuery["transmission"],
    maxKm: n("maxKm"),
    verified: s("verified") === "1",
    sort,
    page: Math.max(1, n("page")),
    sellerId: s("sellerId"),
    all: s("all") === "1",
  };
}

export function carQueryToParams(q: CarQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.minPrice) p.set("minPrice", String(q.minPrice));
  if (q.maxPrice) p.set("maxPrice", String(q.maxPrice));
  if (q.make) p.set("make", q.make);
  if (q.model) p.set("model", q.model);
  if (q.minYear) p.set("minYear", String(q.minYear));
  if (q.fuel) p.set("fuel", q.fuel);
  if (q.transmission) p.set("transmission", q.transmission);
  if (q.maxKm) p.set("maxKm", String(q.maxKm));
  if (q.verified) p.set("verified", "1");
  if (q.sort !== "newest") p.set("sort", q.sort);
  if (q.page > 1) p.set("page", String(q.page));
  return p.toString();
}

// Derived expiry: published/paused listings that have gone stale (>45 days
// without an update). Stored status is untouched; search hides them.
const STALE_DAYS = 45;
export function carExpired(c: CarListing, now = Date.now()) {
  if (c.status !== "published" && c.status !== "paused") return false;
  const last = new Date(c.updatedAt || c.createdAt || 0).getTime();
  return now - last > STALE_DAYS * 86400000;
}

export type PublicCar = {
  id: string;
  shareCode: string;
  make: string;
  model: string;
  year: string;
  price: number;
  thumb: string;       // thumbnail source (search loads only the first photo)
  location: string;
  fuel: CarFuel;
  transmission: CarTransmission;
  odometer: number;
  status: CarListing["status"];
  expired: boolean;
  createdAt: string;
  seller: { name: string; rating: number; verified: boolean };
};

const FUEL_LABEL: Record<CarFuel, string> = { petrol: "Petrol", diesel: "Diesel", cng: "CNG", electric: "Electric", hybrid: "Hybrid" };

export function publicCar(c: CarListing, d: DB): PublicCar {
  const seller = d.drivers.find((dr) => dr.id === c.sellerId);
  return {
    id: c.id,
    shareCode: c.shareCode,
    make: c.make,
    model: c.model,
    year: c.year,
    price: c.price,
    thumb: c.photos[0] || "",
    location: c.location,
    fuel: c.fuel,
    transmission: c.transmission,
    odometer: c.odometer,
    status: c.status,
    expired: carExpired(c),
    createdAt: c.createdAt,
    seller: {
      name: seller?.name || "Seller",
      rating: seller?.rating || 0,
      verified: !!seller?.verified,
    },
  };
}

export const fuelLabel = (f: CarFuel) => FUEL_LABEL[f];

export type CarSearchResult = {
  cars: PublicCar[];
  total: number;
  page: number;
  pageCount: number;
};

export async function searchCars(q: CarQuery, d: DB): Promise<CarSearchResult> {
  const words = q.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const now = Date.now();

  const matched = d.cars.filter((c: CarListing) => {
    if (q.all) return true;
    if (c.status !== "published" || carExpired(c, now)) return false;
    if (q.sellerId && c.sellerId !== q.sellerId) return false;
    const seller = d.drivers.find((x) => x.id === c.sellerId);
    if (!seller || seller.status === "suspended" || seller.status === "rejected") return false;
    if (words.length) {
      const hay = `${c.make} ${c.model} ${c.year} ${c.location}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (q.make && c.make.toLowerCase() !== q.make.toLowerCase()) return false;
    if (q.model && c.model.toLowerCase() !== q.model.toLowerCase()) return false;
    if (q.minPrice && c.price < q.minPrice) return false;
    if (q.maxPrice && c.price > q.maxPrice) return false;
    if (q.minYear && Number(c.year) < q.minYear) return false;
    if (q.fuel && c.fuel !== q.fuel) return false;
    if (q.transmission && c.transmission !== q.transmission) return false;
    if (q.maxKm && c.odometer > q.maxKm) return false;
    if (q.verified && !seller.verified) return false;
    return true;
  });

  if (q.sort === "price") matched.sort((a, b) => a.price - b.price);
  else if (q.sort === "priceDesc") matched.sort((a, b) => b.price - a.price);
  else matched.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pageCount);
  const slice = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { cars: slice.map((c) => publicCar(c, d)), total, page, pageCount };
}

export function km(n: number) {
  return n.toLocaleString("en-IN") + " km";
}

export function lakh(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}