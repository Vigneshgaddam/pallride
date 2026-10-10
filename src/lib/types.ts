// ── PalleRide Phase 1C data contract ─────────────────────────────
// Schema is portable to PostgreSQL: each type = one table, ids = text PKs.

export type TripStatus =
  | "draft"       // driver saved, not visible
  | "published"   // visible; open/partial/full is derived from seats
  | "started"     // driver marked departure
  | "completed"   // driver marked arrival
  | "cancelled"   // driver cancelled (kept for passenger links)
  | "expired";    // derived when published date+time has passed

export type Availability = "open" | "partial" | "full";

export type DriverStatus = "active" | "suspended" | "pending_verification" | "rejected";
export type VerificationStatus = "none" | "pending" | "under_review" | "approved" | "changes_required";

// Phase 4 — each verification check is independent: passing phone ownership
// never implies the profile, vehicle documents or background checks passed.
export type VerifCheck = "phone" | "profile" | "vehicle" | "background";

export type Vehicle = {
  id: string;
  driverId: string;
  type: string;         // hatchback | sedan | suv | tempo | bike
  make: string;         // Maruti, Toyota…
  model: string;        // Ertiga
  year: string;         // "2021"
  regNumber: string;    // private — never in public payloads
  seats: number;
  ac: boolean;
  fuel: string;         // petrol | diesel | cng | electric
  photos: string[];     // URLs
  createdAt: string;
};

export type Trip = {
  id: string;
  shareCode: string; // short public code, e.g. /trips/AB82KD
  from: string;
  to: string;
  stops: string[];     // ordered via points
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM 24h
  priceLo: number;
  priceHi: number;
  seatsTotal: number;
  seatsTaken: number[]; // confirmed seat numbers
  car: string;
  ac: boolean;
  luggage: boolean;
  notes: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverVerified: boolean;
  driverRating: number;
  status: TripStatus;  // published lifecycle; open/partial/full derived
  hidden?: boolean;    // Phase 4 admin moderation — hidden trips leave public search
  createdAt: string;
};

export type BookingRequest = {
  id: string;
  tripId: string;
  seats: number[];     // held seat numbers while pending
  name: string;
  phone: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
};

export type Driver = {
  id: string;
  phone: string;
  email?: string;
  googleSub?: string;
  name: string;
  photo: string;       // URL
  about: string;
  serviceAreas: string[];
  verified: boolean;   // mirror of verification === "approved"
  verification: VerificationStatus;
  checks?: Partial<Record<VerifCheck, boolean>>; // Phase 4 per-check ledger
  reviewNote?: string;                           // Phase 4 last decision note
  status: DriverStatus;
  rating: number;
  ratingsCount: number;
  tripsCount: number;
  cancellations: number;
  vehicle: string;
  createdAt: string;
};

export type Rating = {
  id: string;
  tripId: string;
  driverId: string;
  stars: number;       // 1..5 overall
  driving: number;
  behaviour: number;
  punctuality: number;
  vehicle: number;
  comment: string;
  fromPhone: string;
  createdAt: string;
};

export type ReportStatus = "open" | "under_review" | "info_requested" | "action_taken" | "resolved" | "dismissed";
export type ReportCategory =
  | "unsafe-driving"
  | "harassment"
  | "fake-profile"
  | "scam"
  | "vehicle-details"
  | "spam"
  | "other";

export type Report = {
  id: string;
  clientRef?: string; // idempotency key (slow-network retry safety)
  category: ReportCategory;
  targetType: string; // trip | driver | passenger | vehicle | other
  targetId: string;
  details: string;
  phone: string;
  status: ReportStatus;
  createdAt: string;
};

// Written feedback paired with a Rating; public only when approved.
export type Review = {
  id: string;
  ratingId: string;
  tripId: string;
  driverId: string;
  reviewerPhone: string;
  stars: number;
  comment: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
};

export type Block = {
  id: string;
  fromPhone: string;
  targetPhone: string;
  createdAt: string;
};

export type SafetyIncident = {
  id: string;
  reportId: string;
  summary: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string; // "admin"
  action: string;
  target: string;
  note: string;
  at: string;
};

export type RentalStatus = "draft" | "available" | "unavailable" | "reserved" | "completed" | "removed";

export type RentalListing = {
  id: string;
  shareCode: string; // short public code, e.g. /rentals/AB82KD
  ownerId: string;   // Driver id — owner contact is derived from the Driver record
  make: string;      // Maruti
  model: string;     // Ertiga
  year: string;      // "2021"
  photos: string[];  // URLs — search shows thumbnails, detail loads full images
  location: string;  // Armoor
  seats: number;
  ac: boolean;
  pricePerDay: number;
  unit: "day";
  description: string;
  conditions: string;
  availableFrom: string; // YYYY-MM-DD
  availableTo: string;   // YYYY-MM-DD
  status: RentalStatus;  // expired is derived (search hides past windows)
  prevStatus?: string;   // Phase 4 admin remove → restore
  createdAt: string;
  updatedAt: string;
};

export type RentalEnquiry = {
  id: string;
  listingId: string;
  name: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  message: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
};

// Phase 3 — Buy & Sell marketplace.
export type CarFuel = "petrol" | "diesel" | "cng" | "electric" | "hybrid";
export type CarTransmission = "manual" | "automatic";
export type CarStatus = "draft" | "published" | "reserved" | "sold" | "paused" | "removed";

export type CarListing = {
  id: string;
  shareCode: string;
  sellerId: string;  // Driver id — seller contact comes from the Driver record
  make: string;      // Hyundai
  model: string;     // Grand i10 Magna
  year: string;      // manufacturing year, e.g. "2019"
  price: number;     // asking price in ₹ (whole)
  location: string;  // Kammarpally
  fuel: CarFuel;
  transmission: CarTransmission;
  odometer: number;  // km reading
  photos: string[];  // URLs — thumbnails in search, full on detail only
  description: string; // optional
  ownership: string; // generic ownership/doc statement (never reg numbers or personal docs)
  status: CarStatus; // expired is derived (stale published/paused listings)
  prevStatus?: string; // Phase 4 admin remove → restore
  createdAt: string;
  updatedAt: string;
};

export type CarEnquiry = {
  id: string;
  listingId: string;
  name: string;
  phone: string;
  message: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
};

export type Notification = {
  id: string;
  driverId: string;
  text: string;
  read: boolean;
  createdAt: string;
};

export type Session = { token: string; driverId: string; createdAt: string };

// Phase 4 — short-lived, revocable admin panel sessions. Never derived from a
// driver session; only /api/admin/login (guarded by ADMIN_KEY) creates them.
export type AdminSession = { token: string; createdAt: string };

export type Settings = {
  operator: string;     // responsible operator label shown on audit logs
  maintenance: boolean; // gate for future go-live controls
  adminConfigured: boolean;
};

export type DB = {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  requests: BookingRequest[];
  ratings: Rating[];
  notifications: Notification[];
  sessions: Session[];
  adminSessions: AdminSession[];
  settings: Settings;
  reports: Report[];
  reviews: Review[];
  blocks: Block[];
  incidents: SafetyIncident[];
  audit: AuditLog[];
  rentals: RentalListing[];
  enquiries: RentalEnquiry[];
  cars: CarListing[];
  carEnquiries: CarEnquiry[];
  otps: { phone: string; otp: string; exp: number }[];
};
