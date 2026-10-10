import { promises as fs } from "fs";
import path from "path";
import type { DB, Report, ReportCategory } from "./types";
import { newShareCode } from "./utils";

// DATA_DIR overrides the data location (persistent volume on the host). On
// Vercel the deployment filesystem is read-only, so fall back to the writable
// /tmp directory; otherwise use ./data so local dev needs no configuration.
const DATA_ROOT =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? "/tmp/palleride" : path.join(process.cwd(), "data"));
const FILE = path.join(DATA_ROOT, "db.json");

function mappedCategory(subject: string): ReportCategory {
  const s = subject.toLowerCase();
  if (/driv|rash/.test(s)) return "unsafe-driving";
  if (/harass|abuse|threat/.test(s)) return "harassment";
  if (/fake|identity|impersonat/.test(s)) return "fake-profile";
  if (/scam|fraud|cheat/.test(s)) return "scam";
  if (/vehicle|car|condition/.test(s)) return "vehicle-details";
  if (/spam/.test(s)) return "spam";
  return "other";
}

function nextDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEED: DB = {
  trips: [
    {
      id: "t1", shareCode: "AB82KD", from: "Korutla", to: "Airport ✈️", stops: ["Metpally", "Armoor", "JBS"],
      date: nextDate(1), time: "04:30", priceLo: 550, priceHi: 600, seatsTotal: 6, seatsTaken: [],
      car: "Ertiga · AC", ac: true, luggage: true, notes: "Boot space for 2 large bags.",
      driverId: "d1", driverName: "Ramesh Kumar", driverPhone: "9000000001",
      driverVerified: true, driverRating: 4.8, status: "published", createdAt: new Date().toISOString(),
    },
    {
      id: "t2", shareCode: "HM3Q7P", from: "Korutla", to: "Hyd (JBS)", stops: ["Armoor"],
      date: nextDate(1), time: "05:00", priceLo: 550, priceHi: 600, seatsTotal: 6, seatsTaken: [3, 6],
      car: "Ertiga · AC", ac: true, luggage: false, notes: "",
      driverId: "d1", driverName: "Ramesh Kumar", driverPhone: "9000000001",
      driverVerified: true, driverRating: 4.8, status: "published", createdAt: new Date().toISOString(),
    },
    {
      id: "t3", shareCode: "K9RT4W", from: "Korutla", to: "Hyd (JBS)", stops: ["Armoor"],
      date: nextDate(1), time: "07:30", priceLo: 550, priceHi: 600, seatsTotal: 6, seatsTaken: [],
      car: "Innova · AC", ac: true, luggage: true, notes: "",
      driverId: "d2", driverName: "Suresh Babu", driverPhone: "9000000002",
      driverVerified: true, driverRating: 4.6, status: "published", createdAt: new Date().toISOString(),
    },
  ],
  drivers: [
    {
      id: "d1", phone: "9000000001", email: "ramesh@example.com", name: "Ramesh Kumar",
      photo: "", about: "Daily Korutla → Hyderabad driver. Safe, punctual, 8+ years.",
      serviceAreas: ["Korutla", "Metpally", "Armoor", "Hyderabad"],
      verified: true, verification: "approved", status: "active",
      rating: 4.8, ratingsCount: 126, tripsCount: 340, cancellations: 2,
      vehicle: "Ertiga · AC", createdAt: new Date(Date.now() - 86400000 * 400).toISOString(),
    },
    {
      id: "d2", phone: "9000000002", email: "suresh@example.com", name: "Suresh Babu",
      photo: "", about: "Weekend trips to Hyderabad & airport drops.",
      serviceAreas: ["Korutla", "Hyderabad"],
      verified: true, verification: "approved", status: "active",
      rating: 4.6, ratingsCount: 41, tripsCount: 95, cancellations: 0,
      vehicle: "Innova · AC", createdAt: new Date(Date.now() - 86400000 * 200).toISOString(),
    },
    {
      id: "d3", phone: "9000000003", email: "anil@example.com", name: "Anil Reddi",
      photo: "", about: "New driver from Nizamabad, applying to join.",
      serviceAreas: ["Nizamabad", "Korutla"],
      verified: false, verification: "pending", status: "pending_verification",
      rating: 0, ratingsCount: 0, tripsCount: 0, cancellations: 0,
      vehicle: "WagonR · Non-AC", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  vehicles: [
    {
      id: "v1", driverId: "d1", type: "suv", make: "Maruti Suzuki", model: "Ertiga", year: "2021",
      regNumber: "TS01AB1234", seats: 7, ac: true, fuel: "petrol", photos: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "v2", driverId: "d2", type: "suv", make: "Toyota", model: "Innova Crysta", year: "2022",
      regNumber: "TS09CD5678", seats: 7, ac: true, fuel: "diesel", photos: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "v3", driverId: "d3", type: "hatchback", make: "Maruti Suzuki", model: "WagonR", year: "2019",
      regNumber: "TS28EF9012", seats: 4, ac: false, fuel: "cng", photos: [],
      createdAt: new Date().toISOString(),
    },
  ],
  requests: [],
  ratings: [
    {
      id: "r1", tripId: "t1", driverId: "d1", stars: 5, driving: 5, behaviour: 5, punctuality: 4,
      vehicle: 5, comment: "Smooth ride, reached airport early.", fromPhone: "9111111111",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "r2", tripId: "t2", driverId: "d1", stars: 4, driving: 4, behaviour: 5, punctuality: 4,
      vehicle: 4, comment: "Good driver, car was clean.", fromPhone: "9222222222",
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: "r3", tripId: "t3", driverId: "d2", stars: 5, driving: 5, behaviour: 5, punctuality: 5,
      vehicle: 4, comment: "Great listener, very patient.", fromPhone: "9111111111",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  notifications: [],
  sessions: [],
  adminSessions: [],
  settings: { operator: "PalleRide Team", maintenance: false, adminConfigured: true },
  reports: [
    {
      id: "rep1", clientRef: "rep-seed-1", category: "scam", targetType: "trip", targetId: "t1",
      details: "Driver asked for extra money after I booked my seat.",
      phone: "9111111111", status: "open",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  reviews: [
    {
      id: "rv1", ratingId: "r1", tripId: "t1", driverId: "d1", reviewerPhone: "9111111111", stars: 5,
      comment: "Smooth ride, reached airport early.", status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "rv2", ratingId: "r2", tripId: "t2", driverId: "d1", reviewerPhone: "9222222222", stars: 4,
      comment: "Good driver, car was clean.", status: "approved",
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: "rv3", ratingId: "r3", tripId: "t3", driverId: "d2", reviewerPhone: "9111111111", stars: 5,
      comment: "Great listener, very patient.", status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  blocks: [],
  incidents: [
    {
      id: "si1", reportId: "rep1",
      summary: "Passenger reports an unagreed extra fare demand after pickup.",
      status: "open", createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  audit: [
    {
      id: "a1", actor: "system", action: "seed", target: "bootstrap",
      note: "Database initialised", at: new Date().toISOString(),
    },
  ],
  rentals: [
    {
      id: "rn1", shareCode: "R7K2MQ", ownerId: "d1", make: "Maruti", model: "Ertiga", year: "2021",
      photos: [], location: "Armoor", seats: 6, ac: true, pricePerDay: 2200, unit: "day",
      description: "Well-maintained Ertiga ideal for village trips and airport runs. Available with insurance.",
      conditions: "Fuel extra. Security deposit ₹5000 refundable.",
      availableFrom: nextDate(1), availableTo: nextDate(45), status: "available",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "rn2", shareCode: "PX9C4T", ownerId: "d2", make: "Toyota", model: "Innova Crysta", year: "2022",
      photos: [], location: "Korutla", seats: 7, ac: true, pricePerDay: 3200, unit: "day",
      description: "Comfortable Innova for family outings and event trips.",
      conditions: "Driver included on request at extra cost.",
      availableFrom: nextDate(1), availableTo: nextDate(30), status: "available",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  enquiries: [
    {
      id: "eq1", listingId: "rn1", name: "Arun", phone: "9333333333",
      startDate: nextDate(5), endDate: nextDate(7), durationDays: 3,
      message: "Need car for a wedding in the village.",
      status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  cars: [
    {
      id: "c1", shareCode: "C9H4LW", sellerId: "d1", make: "Hyundai", model: "Grand i10 Magna", year: "2019",
      price: 490000, location: "Kammarpally", fuel: "petrol", transmission: "manual", odometer: 12446,
      photos: [], description: "Single owner, well maintained, new tyres. Service history available.",
      ownership: "First owner. RC and full insurance available. No loans pending.",
      status: "published", createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "c2", shareCode: "MJ7T3N", sellerId: "d2", make: "Maruti", model: "Swift VXi", year: "2020",
      price: 560000, location: "Korutla", fuel: "petrol", transmission: "manual", odometer: 32000,
      photos: [], description: "Family hatchback, low usage, carefully driven.",
      ownership: "Second owner. RC available, insurance till next year.",
      status: "published", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  carEnquiries: [
    {
      id: "cq1", listingId: "c1", name: "Ravi", phone: "9444444444",
      message: "Is the price negotiable? Where can I inspect the car?",
      status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  otps: [],
};

async function load(): Promise<DB> {
  try {
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as DB;
    // Backfill collections/fields added in later phases
    db.vehicles ||= [];
    db.requests ||= [];
    db.ratings ||= [];
    db.notifications ||= [];
    db.sessions ||= [];
    db.reports ||= [];
    db.reviews ||= [];
    db.blocks ||= [];
    db.incidents ||= [];
    db.audit ||= [];
    db.rentals ||= [];
    db.enquiries ||= [];
    db.cars ||= [];
    db.carEnquiries ||= [];
    db.otps ||= [];
    let changed = false;
    // Share codes (persisted so links stay stable across requests)
    const codes = new Set(db.trips.map((t) => t.shareCode).filter(Boolean));
    for (const t of db.trips) {
      if (!t.shareCode) {
        t.shareCode = newShareCode(codes);
        codes.add(t.shareCode);
        changed = true;
      }
      if (t.ac === undefined) { t.ac = /\bAC\b/i.test(t.car || ""); changed = true; }
      if (t.luggage === undefined) { t.luggage = false; changed = true; }
      if (t.notes === undefined) { t.notes = ""; changed = true; }
    }
    for (const d of db.drivers) {
      d.photo ??= "";
      d.about ??= "";
      d.serviceAreas ??= [];
      d.verification ??= d.verified ? "approved" : "none";
      d.status ??= "active";
      d.ratingsCount ??= 0;
      d.cancellations ??= 0;
      d.email ??= "";
      // verified is the mirror of verification === "approved"
      const v = d.verification === "approved";
      if (d.verified !== v) { d.verified = v; changed = true; }
    }
    for (const v of db.vehicles) {
      v.type ??= "hatchback";
      v.make ??= "";
      v.year ??= "";
      v.regNumber ??= "";
      v.seats ??= 4;
      v.ac ??= true;
      v.fuel ??= "petrol";
      v.photos ??= [];
    }
    for (const r of db.ratings) {
      r.driving ??= r.stars;
      r.behaviour ??= r.stars;
      r.punctuality ??= r.stars;
      r.vehicle ??= r.stars;
      r.comment ??= "";
    }
    for (const rp of db.reports) {
      // Phase 1D: legacy reports carried a free-form subject → map to a category
      const legacy = rp as Report & { subject?: string };
      rp.category ??= legacy.subject ? mappedCategory(legacy.subject) : "other";
      rp.targetType ??= "other";
      rp.targetId ??= "";
      rp.status ??= "open";
      delete legacy.subject;
      changed = true;
    }
    // Reviews: created automatically from this phase on; backfill legacy ratings
    // that don't have one (existing comments become approved so nothing is lost).
    const byRating = new Set(db.reviews.map((v) => v.ratingId));
    for (const r of db.ratings) {
      if (byRating.has(r.id)) continue;
      db.reviews.push({
        id: "rv" + Date.now() + r.id,
        ratingId: r.id,
        tripId: r.tripId,
        driverId: r.driverId,
        reviewerPhone: r.fromPhone,
        stars: r.stars,
        comment: r.comment || "",
        status: "approved",
        createdAt: r.createdAt,
      });
      changed = true;
    }
    // Rentals (Phase 2): backfill fields + stable share codes.
    if (!db.rentals) db.rentals = [];
    const rcodes = new Set(db.rentals.map((rt) => rt.shareCode).filter(Boolean));
    for (const rt of db.rentals) {
      if (!rt.shareCode) { rt.shareCode = newShareCode(rcodes); rcodes.add(rt.shareCode); changed = true; }
      rt.model ??= "";
      rt.year ??= "";
      rt.photos ??= [];
      rt.description ??= "";
      rt.conditions ??= "";
      rt.availableTo ??= rt.availableFrom || new Date().toISOString().slice(0, 10);
      rt.updatedAt ??= rt.createdAt;
    }
    if (!db.enquiries) db.enquiries = [];
    // Cars (Phase 3)
    if (!db.cars) db.cars = [];
    const ccodes = new Set(db.cars.map((c) => c.shareCode).filter(Boolean));
    for (const c of db.cars) {
      if (!c.shareCode) { c.shareCode = newShareCode(ccodes); ccodes.add(c.shareCode); changed = true; }
      c.fuel ??= "petrol";
      c.transmission ??= "manual";
      c.odometer ??= 0;
      c.photos ??= [];
      c.description ??= "";
      c.ownership ??= "";
      c.updatedAt ??= c.createdAt;
    }
    if (!db.carEnquiries) db.carEnquiries = [];
    // Phase 4: admin sessions, settings, moderation flags and verification ledger.
    if (!db.adminSessions) db.adminSessions = [];
    if (!db.settings) {
      db.settings = { operator: "PalleRide Team", maintenance: false, adminConfigured: true };
      changed = true;
    }
    db.adminSessions = db.adminSessions.filter(
      (s) => new Date().getTime() - new Date(s.createdAt).getTime() < 12 * 3600000
    );
    for (const t of db.trips) {
      if (t.hidden === undefined) { t.hidden = false; changed = true; }
    }
    for (const d of db.drivers) {
      // Per-check verification ledger (Phase 4). Approved drivers pass every
      // check; anything else defaults to none unless a decision was recorded.
      d.checks ??= {};
      if (d.verification === "approved") {
        for (const c of ["phone", "profile", "vehicle", "background"] as const) {
          if (d.checks[c] !== true) { d.checks[c] = true; changed = true; }
        }
      } else {
        for (const c of ["phone", "profile", "vehicle", "background"] as const) {
          if (d.checks[c] === undefined) { d.checks[c] = false; changed = true; }
        }
      }
    }
    for (const rp of db.reports) {
      // Phase 4 adds under_review / action_taken states; legacy values stay valid.
      if (!["open", "under_review", "info_requested", "action_taken", "resolved", "dismissed"].includes(rp.status)) {
        rp.status = "open";
        changed = true;
      }
    }
    for (const rt of db.rentals) {
      if (rt.prevStatus === undefined && rt.status !== "removed") { rt.prevStatus = undefined; }
    }
    for (const c of db.cars) {
      if (c.prevStatus === undefined && c.status !== "removed") { c.prevStatus = undefined; }
    }
    if (changed) await save(db);
    return db;
  } catch {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await save(SEED);
    return SEED;
  }
}

// Atomic write: write a temp file, rename over the target. A crash mid-write
// never leaves a truncated/corrupt db.json (the previous file stays intact).
async function save(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp." + process.pid;
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, FILE);
}

export const db = { load, save };
