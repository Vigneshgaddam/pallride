# PalleRide — UI/UX Audit

_Stage A artifact for the premium redesign. Based on direct source inspection of
`palleride-app/` (Next.js 16.4.0, React 19.3.0, Tailwind v4, Zustand)._

## 1. Stack and tooling

- **Framework:** Next.js `16.4.0` (custom/vendored — see `AGENTS.md`; read
  `node_modules/next/dist/docs/` before writing routing/rendering code). `dev`/`build`
  run with `--webpack`.
- **UI:** React 19 App Router, Tailwind CSS v4 via `@import "tailwindcss"` +
  `@theme inline`. No component library (no shadcn/radix); a small in-house
  primitive set lives in `src/components/ui.tsx`.
- **State:** Zustand `src/lib/driver-store.ts` (driver auth token + persist).
- **Icons:** `lucide-react` (available and already used broadly).
- **Persistence:** JSON file `data/db.json` via `src/lib/db.ts`. No SQL.
- **i18n:** `src/lib/i18n.tsx` — `DICT` (key → `[en, te]`), `useT()`, `useLang()`,
  persisted in `localStorage` (`pr_lang`). English-only admin.
- **Checks:** `npm run lint` (eslint), `npx tsc --noEmit`, `npm run build`.
  No test runner is configured.

## 2. Route inventory

Public / passenger:

- `/` homepage
- `/trips`, `/trips/[tripId]` (live trips + detail)
- `/rentals`, `/rentals/[listingId]`
- `/cars`, `/cars/[listingId]`
- `/drivers/[driverId]` (public driver profile)
- `/safety`, `/reports/new`
- `/auth/login`
- Aliases (redirects): `/buy → /cars`, `/rent → /rentals`, `/sell → /sell` (form)
- `/account`
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`

Driver dashboard (auth-guarded client routes):

- `/dashboard` (hub), `/dashboard/trips` (+`/[id]`, `/[id]/edit`, `/new`),
  `/dashboard/requests`, `/dashboard/vehicles`, `/dashboard/profile`,
  `/dashboard/ratings`, `/dashboard/safety`, `/dashboard/rentals`
  (+`/[id]/edit`, `/new`), `/dashboard/sales` (+`/[id]/edit`, `/new`)
- Legacy `/driver/*` — mostly `redirect()` shims into `/dashboard/*`; real pages:
  `/driver/onboarding`, `/driver/verification`.

Admin (cookie-guarded, English-only):

- `/admin/login`, `/admin` (+ 13 panel pages: users, drivers, verifications,
  trips, bookings, rentals, listings, reviews, reports, safety, audit-logs,
  settings).

API: `/api/*` — trips, rentals, cars, driver/*, drivers/[id], reports,
admin/*. **Contracts must not change.**

## 3. Component inventory

- **Chrome:** `header.tsx`, `bottom-nav.tsx`, `root-chrome.tsx`.
- **Primitives:** `ui.tsx` — `Button`, `Input`, `Field`, `Card`, `Badge`,
  `Sheet`, `Empty`, `SectionTitle`.
- **Trips:** `TripSearch`, `TripList`, `TripCard`, `TripFilters`, `TripDetails`,
  `SeatMap`, `SeatCounter`, `DriverSummary`, `TripStops`, `TripRoute`,
  `TripStatus`, `ShareTrip`, `WhatsAppBooking`, `RateTrip`, `TripSkeleton`.
- **Rentals:** `RentalSearch/List/Card/Filters/Details/Enquiry/Dashboard/…`.
- **Marketplace:** `CarSearch/List/Card/Filters/Details/Enquiry/SellerDashboard/…`.
- **Safety:** `EmergencyActions`, `ShareTripSafety`, `ReportDialog`,
  `DriverTrustCard`, `RatingSummary`, `VerificationBadge`, `BlockUserButton`,
  `ReviewForm`.
- **Admin:** `AdminSidebar`, `AdminHeader`, `AdminStats`, `DataTable`,
  `StatusFilter`, `VerificationReview`, `ReportReview`, `ListingModeration`,
  `UserActions`, `AuditLogTable`.

## 4. Current design system

- Tokens in `globals.css`: `--bg #f8faf6`, `--card #fff`, `--ink #0e2a22`,
  `--mute #6b7a74`, `--line #e3e9e3`, `--brand #0a3d30`, `--teal #3fae92`,
  `--tealbg #e6f5f0`, `--sun #f2b544`, `--blue #0a7ad6`, `--danger`; legacy
  aliases `--muted`/`--border` for the admin panel.
- Dark mode via `prefers-color-scheme` and `[data-theme]`.
- **Leakage problem:** many components bypass tokens with hardcoded hex
  (`#3FAE92`, `#0A3D30`, `#F2B544`, `#0A7AD6`) inside Tailwind arbitrary values.
- Radius is large (16–24px); heavy shadows; some emoji used as iconography.

## 5. Design gaps vs the brief

1. Palette does not match the specified tokens (primary `#15803D`, surface
   `#F0FDF4`, bg `#F8FAFC`, text `#0F172A`, secondary `#475569`, border
   `#E2E8F0`).
2. Hardcoded colors, not semantic tokens.
3. Emoji used as UI icons; no decorative-only imagery policy.
4. Homepage headline is generic; needs "Your next ride starts here." and
   grounded popular routes / previews / partner section.
5. No footer with policy routes.
6. Some lists are single-column on desktop; several dashboard/admin call sites
   still assume the 520px column.
7. Partial integration of focus rings / reduced motion (present but not fully
   applied to interactive components).

## 6. Functional dependencies that must not change

- API request/response schemas and all `/api/*` routes.
- Auth: driver bearer token (`driver-store`), Google Sign-In, phone OTP (dev
  OTP is explicitly a demo — keep it labelled), admin `pr_admin` cookie +
  server-side gates + audit logging.
- Domain rules: WhatsApp enquiries are **not** confirmed bookings; seats are
  server-authoritative; `verified` mirrors `verification === "approved"`;
  private fields (`phone`, `regNumber`, `email`, `googleSub`, reporter phone)
  never rendered publicly.
- Ownership/authorization checks on every driver mutation.
- JSON persistence (`data/db.json`) and idempotency (`clientRef`).

## 7. Risks

- Broad find/replace of color literals can break arbitrary-value Tailwind
  classes; do it as a bounded, reviewed set (`#hex → var(--token)`).
- Toggling dark-mode token values could reduce contrast on admin light cards.
- Telugu strings are longer; widened buttons/nav can overflow.
- The vendored Next.js may differ from public docs — verify before structural
  routing changes (no routing changes planned).

## 8. Planned changes (stages)

- **B. Tokens/UI/shell:** remap `globals.css` tokens to the specified palette,
  add semantic tokens + type scale; rewrite `ui.tsx` primitives (8–12px radii,
  restrained shadows, real focus states); update header/bottom-nav/root-chrome +
  add a footer with genuine routes.
- **C. Home + trips:** hero ("Your next ride starts here."), From/To/Date search,
  grounded popular routes + live-trip preview, marketplace previews, partner
  section, trust section; responsive list grids.
- **D. Trip detail:** 2-col desktop, clear states, safe invalid IDs, WhatsApp
  honesty.
- **E. Rentals + Buy/Sell:** shared marketplace language, responsive forms.
- **F. Auth/onboarding/driver dashboard:** responsive cards, status badges.
- **G. Safety/ratings/admin:** themed admin, dialogs, tables.
- **H. i18n/a11y/perf:** extend dictionary, replace functional emoji with icons,
  keyboard/contrast, final checks.

## 9. Verification approach

After each stage: `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus
manual review of route behaviour and EN/TE switching. No test runner exists, so
build + type + lint are the automated gates.
