# PalleRide — Data Model

Schema for Phase 1 (prototype) ships as JSON collections in `data/db.json`.
Each type maps 1:1 to a future PostgreSQL table (ids are text primary keys), so
the model below is written table-style.

## Core entities

### Driver
Identity + profile + trust state for a driver.

| Field            | Notes                                                        |
| ---------------- | ------------------------------------------------------------ |
| id               | PK                                                           |
| phone            | registrar identity (10-digit); also OTP/WhatsApp contact      |
| email / googleSub| Google Sign-In linkage (optional)                            |
| name, photo      | display name, avatar URL                                     |
| about            | short bio                                                    |
| serviceAreas     | strings like `Korutla`, `Hyderabad`                          |
| verified         | **derived mirror** of `verification === "approved"` — a badge must never show otherwise |
| verification     | `none\|pending\|under_review\|approved\|changes_required`    |
| status           | `active\|suspended\|pending_verification\|rejected`          |
| rating           | stored weighted average (see Ratings)                        |
| ratingsCount     | stored weighted count (seed history retained, e.g. 126)      |
| tripsCount       | completed trips counter                                      |
| cancellations    | driver-cancelled trips                                       |
| vehicle          | display string (Ertiga · AC)                                 |
| createdAt        | joined date                                                  |

`phone`, `email`, `googleSub` are **private** — stripped from every public payload.

### Vehicle
A driver's (single, in MVP) vehicle. `regNumber` is **private** and never appears
in public payloads (trip detail, driver profile, search feed).

### Trip
Published/started/completed rides. Public via `shareCode` slash route.
`driverPhone` is exposed only on the trip detail page (needed for WhatsApp/Call);
the search feed and driver profile strip it.

### BookingRequest
Seat holds: `seats[]` held while `pending`, then `confirmed`/`rejected`.

## Trust, Safety & Ratings entities

### Verification
Driver identity/vehicle checks and outcomes. Enumerated as the `verification`
field on Driver in the prototype (`none → pending → under_review → approved`,
or `changes_required`). Status can only be changed by the admin endpoint
(`/api/admin/driver`). **Never render a verification badge until
`verified === true`.**

### Rating
Scores for a completed interaction.

| Field        | Notes                                            |
| ------------ | ------------------------------------------------ |
| id, tripId   | PK; links to a completed trip                    |
| driverId     | target driver                                    |
| stars        | 1–5 overall                                     |
| driving/behaviour/punctuality/vehicle | 1–5 category scores            |
| comment      | written feedback (also mirrored into `Review`)  |
| fromPhone    | reviewer phone (private)                         |
| createdAt    |                                                  |

Rules enforced server-side:
- only a **completed** trip can be rated;
- **one rating per reviewer phone per trip**;
- a driver **cannot rate their own trip** (phone ≠ trip.driverPhone);
- averages are **computed on the backend**, never in the browser.

### Review
Moderated written feedback paired with a Rating.

| Field          | Notes                                             |
| -------------- | ------------------------------------------------- |
| id             | PK                                                |
| ratingId       | FK → Rating (one review per rating)              |
| tripId, driverId | context                                        |
| reviewerPhone  | private                                           |
| stars, comment | snapshot for display                              |
| status         | `pending → approved \| hidden` (admin moderation) |

Public driver profiles show **approved reviews only**. Hidden reviews are
excluded from the profile and from aggregate counts. Pending reviews appear only
to the driver and to admins. Admin moderation lives at `/api/admin/reviews`.

### Report
Complaints from any user (no login required; phone-scoped identity).

| Field        | Notes                                                    |
| ------------ | -------------------------------------------------------- |
| id, clientRef| clientRef = idempotency key; a retry never duplicates    |
| category     | `unsafe-driving \| harassment \| fake-profile \| scam \| vehicle-details \| spam \| other` |
| targetType/targetId | `trip \| driver \| passenger \| vehicle \| other` |
| details, phone | free text; submitter contact (private)             |
| status       | `open \| info_requested \| resolved \| dismissed`        |
| createdAt    |                                                          |

Workflow: user submits → admin reviews → `request_info` / action (`resolve`,
`dismiss`, or `escalate`) → `resolved`.

### Block
Blocking relationships keyed by phone.

| Field         | Notes                                        |
| ------------- | -------------------------------------------- |
| fromPhone     | the blocker                                  |
| targetPhone   | the blocked contact                          |

Effect: a driver who blocked a contact **cannot receive a booking request** from
that number (`/api/trips/[id]/requests` returns 403).

### SafetyIncident
Serious incidents escalated from Reports (admin `escalate`).

| Field       | Notes                                 |
| ----------- | ------------------------------------- |
| reportId    | FK → Report                           |
| summary     | resolution/incident summary           |
| status      | `open \| resolved`                    |

### AuditLog
Append-only record of admin actions (`driver.approve`, `review.hide`,
`report.resolve`, …) for accountability.

| Field  | Notes                          |
| ------ | ------------------------------ |
| actor  | `admin`                        |
| action | `driver.* \| review.* \| report.*` |
| target | entity reference (`driver:d1`) |
| note   | free-text                    |
| at     | timestamp                    |

## Privacy, retention and deletion

- **Private fields:** `driver.phone/email/googleSub`, `vehicle.regNumber`,
  `rating.fromPhone`, `review.reviewerPhone`, `report.phone`. Public APIs
  (`/api/drivers/[id]`, trip feed, driver profile) strip all of them.
- **Sensitive docs (identity docs, vehicle photos)** are owned by the authorised
  reviewer (driver + admin) only; the prototype stores photo URLs, never raw
  documents, and `regNumber` is never returned publicly.
- **Retention:**
  - AuditLog: retained indefinitely (accountability).
  - Reports/Incidents: retained 24 months; `resolved`/`dismissed` reports are
    kept for reference during that window.
  - Ratings/Reviews: retained while the driver account exists.
  - Blocks: retained until removed by the blocker.
- **Deletion:** a verified data-subject request deletes `Ratings`, `Reviews`,
  `Reports` content, `Blocks` and profile data; AuditLog entries are retained in
  anonymised form (target stripped).
- **Moderation:** written Reviews are `pending` until an admin approves/hides
  them; hidden reviews and ratings are excluded from public aggregates.

## Phase 2 — Rentals

Adds `rentals` and `enquiries` collections. A rental is a vehicle an Owner
(the same Driver identity) lists for hire by the day.

### RentalListing
- `id`, `shareCode` (short public code → `/rentals/AB82KD`)
- `ownerId` (Driver id) — the owner's contact `phone`/`name` is **never** in
  search results; it is only surfaced on the details page so enquirers can
  reach them on WhatsApp.
- `make`, `model`, `year` — vehicle identity
- `photos[]` — photo URLs. Search renders thumbnails only (single small image);
  details renders the full set. Empty list → local placeholder icon.
- `location`, `seats`, `ac`, `pricePerDay`, `unit: "day"`
- `description`, `conditions` — free text, capped at 500 chars
- `availableFrom`, `availableTo` (YYYY-MM-DD) — the availability window
- `status`: `draft | available | unavailable | reserved | completed | removed`
  - `draft` hidden; publishing requires a valid full listing
  - `available` appears in search; `unavailable` (paused) is hidden
  - `reserved` = an owner confirmed an enquiry (no longer bookable)
  - `completed` / `removed` terminal
  - **expired is derived** (window fully in the past) — stored value untouched,
    suppressed in search, badge shown on details
  - lifecycle: `draft → available ⇄ unavailable → reserved → completed`;
    anything except `completed`/`removed` may be `removed`
- `createdAt`, `updatedAt`
- Ownership is enforced on **every** PATCH (edit, publish, pause, resume,
  reserve, complete, remove) — non-owners get 403. Suspended/rejected owners
  cannot create or publish.

### RentalEnquiry
- `id`, `listingId`, `name`, `phone`, `startDate`, `endDate`, `durationDays`
  (computed inclusive), `message` (≤500)
- `status: pending | confirmed | declined`
- An enquiry is a **record of a WhatsApp conversation, not a confirmed
  reservation**: the owner must reply and agree terms. Confirming an enquiry
  sets the listing to `reserved`.
- Only accepted while the listing is `available` and within its window.

### Privacy
- Owner phone is exposed only in the listing detail response (needed for the
  WhatsApp enquiry), the same policy Live Trips uses for drivers.
- Rentals carry no payments locally. Enquirers and owners agree the price,
  deposit and pick-up directly.

## Phase 3 - Buy & Sell Marketplace (cars)
### CarListing
- `id`, `shareCode` (short public code → `/cars/AB82KD`), `sellerId` (Driver id)
  — the seller's contact `phone`/`name` is **never** in search results; it is
  only surfaced on the details page so buyers can reach them on WhatsApp.
- `make`, `model`, `year`, `price` (whole ₹), `location` — car identity
- `fuel`: petrol | diesel | cng | electric | hybrid
- `transmission`: manual | automatic
- `odometer` (km), `photos[]` (≤8) — search renders a single thumbnail; details
  render the full set (empty list → local placeholder icon)
- `description` (≤500), `ownership` (≤300) — generic free text such as "first
  owner, insured since 2020". **Never** contains registration numbers or photos
  of documents — they are too personal to store.
- `status`: `draft | published | reserved | sold | paused | removed`
  - `draft` hidden; publishing requires a valid full listing (`validateCar`)
  - `published` appears in search; `paused` is hidden
  - `reserved` = a seller confirmed an enquiry (no longer publicly available)
  - `sold` / `removed` terminal; sold listings keep their history
  - **expired is derived** (published/paused stale for 45 days) — stored value
    untouched, suppressed in search, badge shown on details
  - lifecycle: `draft → published → reserved → sold`; `published ⇄ paused`;
    anything except `sold` may be `removed`
- `createdAt`, `updatedAt`
- Ownership is enforced on **every** PATCH (edit, publish, pause, resume,
  reserve, sold, remove) — non-sellers get 403. Suspended/rejected sellers
  cannot create, publish or manage listings.
- Public search (`/api/cars` GET + `/cars`) only ever returns `published`,
  non-expired listings from active sellers; status/buyer-facing fields are
  stripped by `publicCar`.

### CarEnquiry
- `id`, `listingId`, `name`, `phone`, `message` (≤500), `status: pending |
  confirmed | declined`, `createdAt`
- An enquiry is a **record of a WhatsApp conversation, not a purchase**: the
  seller must reply and agree an inspection. Confirming an enquiry sets the
  listing to `reserved`.
- Only accepted while the listing is `published` and not expired.

### Seller dashboard
- `/api/driver/cars` returns the seller's own listings (with pending enquiry
  counts) plus all their enquiries; `/api/driver/car-enquiries/[id]` PATCH
  confirms/declines. Sessions are owner-scoped like every other driver route.

### Privacy
- Seller phone is exposed only in the listing detail response (needed for the
  WhatsApp enquiry) — the same policy Live Trips uses for drivers.
- No payments, no vehicle/transaction guarantees. Buyers must inspect the car
  and documents before paying; PalleRide is a listing + contact platform only.

---

# Phase 4 — Admin Panel & Moderation (data model additions)

## Session & settings

### AdminSession
- `token` (`adm_<hex>`, 24 random bytes), `createdAt`. Stored in
  `db.adminSessions`, expires after 12 hours.
- Two ways to present authority to an admin endpoint (see `src/lib/admin.ts`):
  - `x-admin-key` header equals `ADMIN_KEY` env, or `dev123` when `OTP_DEV=1`;
  - `Authorization: Bearer <token>` for the same value above.
- The web panel logs in through `POST /api/admin/login` which hands back an
  HttpOnly/SameSite=Lax cookie `pr_admin` (12h). `app/admin/(panel)/layout.tsx`
  validates the cookie against `db.adminSessions` on every server render and
  redirects to `/admin/login` otherwise. Login is rate-limited (5/min/IP,
  in-memory). `adminSessions` older than 12h are pruned on load.

### Settings
- `{ operator: string, maintenance: boolean, adminConfigured: boolean }` in
  `db.settings`. Operator label shows in the panel header; maintained via
  `GET/PATCH /api/admin/settings`.

## Verification ledger (drivers)
- `Driver.checks`: `{ phone: boolean; profile: boolean; vehicle: boolean;
  background: boolean }` — the four evidence boxes a reviewer works through
  independently (`VerifCheck`, `CHECKS` in `src/lib/admin.ts`). One-off toggles
  write to the audit log; `approve` sets all four true and `verified=true`.
- `Driver.reviewNote`: last reviewer comment, echoed in the audit trail.
- Actions: `check` (toggle one), `approve` (all true + verified + active),
  `changes` (`changes_required`), `reject` (all false + verified=false +
  status `rejected`).
- `driver.verified` always mirrors `verification === "approved"`.

## Report lifecycle
`ReportStatus` extended: `open | under_review | info_requested | action_taken |
resolved | dismissed`.

- `start_review` -> `under_review`
- `request_info` -> `info_requested` (reason required)
- `action` -> `action_taken`
- `resolve` -> `resolved` (reason required)
- `dismiss` -> `dismissed` (reason required)
- `escalate` -> keeps the report's status; creates an Incident
  `{ id: "si"+ts, reportId, summary, status: "open", createdAt }` (reason
  required)

## Moderation flags
- `Trip.hidden`: admin-hid a live trip. `searchTrips` and the public trip
  detail API exclude hidden trips; the driver's own management API still sees
  them. `hide` / `restore` / `cancel` live at `/api/admin/trips/[id]`.
- `RentalListing.prevStatus` / `CarListing.prevStatus`: stored when an admin
  removes a listing (`removed`); `restore` puts the previous status back.
  Removal requires a reason; every action is audited.

## Admin endpoints (all require admin authority, all audit)
`/api/admin/*`: `login`, `logout`, `stats`, `users` (+`[id]` suspend/activate),
`verifications` (+`[id]`), `trips` (+`[id]`), `bookings`, `rentals` (+`[id]`),
`listings` (+`[id]`), `reviews` (+`[id]`), `reports` (+`[id]`), `safety`
(+`[id]`), `audit`, `settings`, plus the legacy `driver` moderation hook.
Table APIs are paginated (20/page; audit 25) and status-filtered; queues are
sorted newest-first. Reg numbers appear only in the verifications queue (the
reviewer's own screen). Audit entries are append-only, capped at 2000 with
newest kept.