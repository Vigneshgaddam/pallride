import { publicTrip, seatState, effectiveStatus, type PublicTrip } from "./seats";
import type { DB, Trip } from "./types";

// Server-side, URL-based trip search (Phase 1B).
// One source of truth shared by the /trips page and /api/trips.

export const PAGE_SIZE = 10;

export type TripQuery = {
  from: string;
  to: string;
  date: string;
  seats: number;        // minimum available seats required
  maxPrice: number;     // 0 = no limit
  time: "" | "early" | "morning" | "afternoon" | "night";
  ac: boolean;
  verified: boolean;
  type: "" | "suv" | "tempo" | "small";
  page: number;
  driverId: string;     // internal use
  all: boolean;         // include non-published (internal use)
};

export function parseTripQuery(sp: Record<string, string | string[] | undefined>): TripQuery {
  const s = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || "";
  };
  const n = (k: string) => Math.max(0, Number(s(k)) || 0);
  return {
    from: s("from"),
    to: s("to"),
    date: s("date"),
    seats: Math.min(12, n("seats")),
    maxPrice: n("maxPrice"),
    time: (["early", "morning", "afternoon", "night"].includes(s("time")) ? s("time") : "") as TripQuery["time"],
    ac: s("ac") === "1",
    verified: s("verified") === "1",
    type: (["suv", "tempo", "small"].includes(s("type")) ? s("type") : "") as TripQuery["type"],
    page: Math.max(1, n("page")),
    driverId: s("driverId"),
    all: s("all") === "1",
  };
}

export function tripQueryToParams(q: TripQuery): string {
  const p = new URLSearchParams();
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.date) p.set("date", q.date);
  if (q.seats) p.set("seats", String(q.seats));
  if (q.maxPrice) p.set("maxPrice", String(q.maxPrice));
  if (q.time) p.set("time", q.time);
  if (q.ac) p.set("ac", "1");
  if (q.verified) p.set("verified", "1");
  if (q.type) p.set("type", q.type);
  if (q.page > 1) p.set("page", String(q.page));
  return p.toString();
}

function matchesTime(time: string, bucket: TripQuery["time"]) {
  if (!bucket) return true;
  const h = Number(time.slice(0, 2));
  if (bucket === "early") return h < 6;
  if (bucket === "morning") return h >= 6 && h < 12;
  if (bucket === "afternoon") return h >= 12 && h < 18;
  return h >= 18; // night
}

function matchesType(car: string, type: TripQuery["type"]) {
  if (!type) return true;
  const c = car.toLowerCase();
  const suv = /ertiga|innova|suv|bolero|xuv|carens|lander/i.test(c);
  const tempo = /tempo|traveller|van|bus|mini/i.test(c);
  if (type === "suv") return suv;
  if (type === "tempo") return tempo;
  return !suv && !tempo; // small car
}

export type SearchResult = { trips: PublicTrip[]; total: number; page: number; pageCount: number };

export async function searchTrips(q: TripQuery, d: DB): Promise<SearchResult> {
  const from = q.from.toLowerCase().trim();
  const to = q.to.toLowerCase().trim();

  const matched = d.trips.filter((t: Trip) =>
    !t.hidden &&
    (q.all || effectiveStatus(t) === "published") &&
    t.from.toLowerCase().includes(from) &&
    t.to.toLowerCase().includes(to) &&
    (!q.date || t.date === q.date) &&
    (!q.driverId || t.driverId === q.driverId) &&
    (!q.ac || /\bAC\b/i.test(t.car)) &&
    (!q.verified || t.driverVerified) &&
    (!q.maxPrice || t.priceLo <= q.maxPrice) &&
    matchesTime(t.time, q.time) &&
    matchesType(t.car, q.type) &&
    seatState(t, d.requests).availableSeats >= q.seats
  );

  matched.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pageCount);
  const slice = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { trips: slice.map((t) => publicTrip(t, d.requests)), total, page, pageCount };
}
