import type { DB, RentalListing } from "./types";

// Phase 2: server-side, URL-based rental search (Phase 2).
// One source of truth shared by /rentals and /api/rentals.

export const PAGE_SIZE = 10;

export type RentalQuery = {
  q: string;          // location / vehicle words
  startDate: string;  // requested start (YYYY-MM-DD)
  endDate: string;    // requested end
  ac: boolean;
  seats: number;      // minimum seats
  maxPrice: number;   // 0 = no limit
  page: number;
  ownerId: string;    // internal use (driver dashboard uses /api/driver/rentals)
  all: boolean;       // internal: include non-available
};

export type PublicRental = {
  id: string;
  shareCode: string;
  make: string;
  model: string;
  year: string;
  photo: string;      // thumbnail source (search loads only the first photo)
  location: string;
  seats: number;
  ac: boolean;
  pricePerDay: number;
  unit: "day";
  availableFrom: string;
  availableTo: string;
  status: RentalListing["status"];
  expired: boolean;   // derived: window fully in the past
  owner: { name: string; rating: number; verified: boolean };
};

export function parseRentalQuery(sp: Record<string, string | string[] | undefined>): RentalQuery {
  const s = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || "";
  };
  const n = (k: string) => Math.max(0, Number(s(k)) || 0);
  return {
    q: s("q"),
    startDate: s("start"),
    endDate: s("end"),
    ac: s("ac") === "1",
    seats: Math.min(12, n("seats")),
    maxPrice: n("maxPrice"),
    page: Math.max(1, n("page")),
    ownerId: s("ownerId"),
    all: s("all") === "1",
  };
}

export function rentalQueryToParams(q: RentalQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.startDate) p.set("start", q.startDate);
  if (q.endDate) p.set("end", q.endDate);
  if (q.ac) p.set("ac", "1");
  if (q.seats) p.set("seats", String(q.seats));
  if (q.maxPrice) p.set("maxPrice", String(q.maxPrice));
  if (q.page > 1) p.set("page", String(q.page));
  return p.toString();
}

// Derived expiry: stored status stays as-is (dashboard needs "available", history),
// search hides windows that have fully ended.
export function rentalExpired(l: RentalListing, today = new Date().toISOString().slice(0, 10)) {
  return !!l.availableTo && l.availableTo < today;
}

export function publicRental(l: RentalListing, d: DB): PublicRental {
  const owner = d.drivers.find((dr) => dr.id === l.ownerId);
  return {
    id: l.id,
    shareCode: l.shareCode,
    make: l.make,
    model: l.model,
    year: l.year,
    photo: l.photos[0] || "",
    location: l.location,
    seats: l.seats,
    ac: l.ac,
    pricePerDay: l.pricePerDay,
    unit: l.unit,
    availableFrom: l.availableFrom,
    availableTo: l.availableTo,
    status: l.status,
    expired: rentalExpired(l),
    owner: {
      name: owner?.name || "Owner",
      rating: owner?.rating || 0,
      verified: !!owner?.verified,
    },
  };
}

export type RentalSearchResult = {
  listings: PublicRental[];
  total: number;
  page: number;
  pageCount: number;
};

export async function searchRentals(q: RentalQuery, d: DB): Promise<RentalSearchResult> {
  const words = q.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);

  const matched = d.rentals.filter((l: RentalListing) => {
    if (q.all) return true;
    if (l.status !== "available" || rentalExpired(l, today)) return false;
    if (q.ownerId && l.ownerId !== q.ownerId) return false;
    // Owner must be able to fulfil bookings
    const dr = d.drivers.find((x) => x.id === l.ownerId);
    if (!dr || dr.status === "suspended" || dr.status === "rejected") return false;
    if (words.length) {
      const hay = `${l.make} ${l.model} ${l.year} ${l.location}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (q.startDate && compareDate(l.availableFrom, q.startDate) > 0) return false; // window starts after request
    if (q.startDate && q.endDate && compareDate(l.availableTo, q.endDate) < 0) return false;
    if (q.ac && !l.ac) return false;
    if (q.seats && l.seats < q.seats) return false;
    if (q.maxPrice && l.pricePerDay > q.maxPrice) return false;
    return true;
  });

  matched.sort((a, b) => a.pricePerDay - b.pricePerDay || (b.createdAt || "").localeCompare(a.createdAt || ""));
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pageCount);
  const slice = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { listings: slice.map((l) => publicRental(l, d)), total, page, pageCount };
}

function compareDate(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Rough date-window day count used for indicative price (inclusive of both days).
export function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.ceil(ms / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? days : 0;
}