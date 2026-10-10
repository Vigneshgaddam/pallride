# PalleRide — UI/UX Redesign: Final Report

_Companion to `docs/UI_UX_AUDIT.md`. Describes the redesign actually shipped in
`palleride-app/`, the tokens/components introduced, what was preserved, the
verification that was run, and the remaining follow-ups._

## 1. Audit summary

Baseline (see `UI_UX_AUDIT.md` for detail): Next.js `16.4.0` (vendored), React
`19.3.0`, Tailwind v4, Zustand, lucide icons, JSON persistence, EN/TE i18n, and a
cookie-guarded English-only admin panel. The prior UI leaned on a 520px
mobile-first column, oversized radii/shadows, emoji in place of icons, and — most
importantly — **hardcoded hex colors** (`#3FAE92`, `#0A3D30`, `#F2B544`,
`#0A7AD6`) used inside Tailwind arbitrary values, which bypassed the theme and
made a real dark mode impossible.

## 2. Design tokens

`src/app/globals.css` was rewritten to the specified palette and exposes both raw
semantic variables and Tailwind theme colors via `@theme inline`:

| Token | Value | Role |
|---|---|---|
| `--bg` | `#F8FAFC` | page background |
| `--card` | `#FFFFFF` | surfaces |
| `--ink` | `#0F172A` | primary text |
| `--mute` | `#475569` | secondary text |
| `--line` | `#E2E8F0` | borders/dividers |
| `--primary` | `#15803D` | brand / primary action |
| `--primary-hover` | `#166534` | hover/active, hero |
| `--primary-soft` | `#F0FDF4` | tinted surfaces |
| `--amber` | `#f59e0b` | warnings/holds |
| `--amber-ink` | `#422006` | text on amber |
| `--warning` | `#b45309` | semantic warning |
| `--blue` | `#2563eb` | info |
| `--danger` | `#dc2626` | errors/destructive |
| `--ring` | `#15803D` | focus ring |

Legacy aliases (`--brand`, `--teal`, `--tealbg`, `--sun`, `--muted`, `--border`)
are retained so the admin panel and older call sites keep working. Dark-mode
blocks exist for both `prefers-color-scheme` and `[data-theme="dark"]`. Global
utilities were added: focus-visible ring, `scroll-padding-top`, `.pr-scroll-x`,
`.pr-elevate`, `pr-up`/`pr-fade`, reduced-motion guards, `pr-no-print`.

A bounded, reviewed replacement converted hardcoded hex literals to token
references across **72 files** (`#hex → var(--token)`), eliminating the token
leakage identified in the audit.

## 3. Routes redesigned

- **Home `/`** — rebuilt hero ("Your next ride starts here.") with From/To/Date
  search wired to `/trips?from=&to=&date=`, Find-a-Ride/Post-a-Trip CTAs,
  three mode tiles, **popular routes derived from the live trip feed only**
  (hidden when empty — no invented counts), live-trip preview, rental and
  buy-and-sell previews, a "Drive with PalleRide" partner section, and a
  trust & safety section linking `/safety`.
- **Live trips `/trips`, `/trips/[tripId]`** — responsive list grid; detail page
  is a two-column desktop layout (trip/seat/driver in main column; emergency +
  share-safety rail) with honest WhatsApp booking inline.
- **Rentals `/rentals(/[listingId])`** and **Buy & Sell `/cars(/[listingId])`,
  `/sell`** — shared marketplace visual language, responsive list grids, centered
  content columns, seller/buyer moderation messaging preserved.
- **Auth / onboarding** — `/auth/login` (narrow, centered form), `/driver/
  onboarding`, `/driver/verification` (status timeline).
- **Public profile** `/drivers/[driverId]`, **Safety** `/safety`,
  **Reports** `/reports/new`, **Account** `/account` — responsive two-column
  content and centred max-widths.
- **Driver dashboard** — new `dashboard/layout.tsx` (`max-w-4xl`); hub, trips,
  requests, vehicles, profile, ratings all responsive grids.
- **Admin** — all `bg-white`/`bg-[#f7faf9]` surfaces converted to
  `var(--card)`/`var(--tealbg)` so the panel themes correctly; structure and
  English-only copy unchanged.

## 4. Components & primitives

- **`ui.tsx` rewritten:** `Button` (default/alt/sun/danger/ghost; sm/md;
  ~8–12px radii; real focus ring), `Input`, `Field` (focus-within ring), `Card`
  (12–16px radius, restrained shadow), `Badge`, `Sheet` (Escape + backdrop
  close, reduced-motion aware), plus new `Alert`, `Skeleton`, `Empty`,
  `SectionTitle`.
- **New chrome:** `footer.tsx` with genuine routes (`/trips`, `/rentals`,
  `/cars`, `/safety`, `/account`); `header.tsx` switched to a solid surface
  (no backdrop blur) and a wider `md:max-w-6xl` container; `root-chrome.tsx`
  renders the footer and widened shell.
- **Emoji replaced with lucide icons** in functional UI: trip status (dot +
  text, not color-only), seat map driver seat, driver summary, account/profile,
  vehicle equipment (snowflake/fuel), trip-form preview, filter "Clear" (X),
  safety tips (check), success states (check-circle), verification timeline.
  Rating star glyphs (★/☆) and WhatsApp message bodies are intentionally kept
  (they are content, not interface chrome).

## 5. Features preserved

No API, route, query-parameter, auth, persistence, or business-rule changes were
made. Specifically retained: all `/api/*` routes and schemas; driver bearer
token + Google Sign-In + phone OTP (dev OTP still labelled); admin `pr_admin`
cookie gate + audit logging; server-authoritative seats; `verified ==
verification === "approved"`; private fields (phone, regNumber, email,
googleSub) never rendered publicly; ownership checks; JSON persistence and
`clientRef` idempotency; and the truth that **WhatsApp enquiries are not
confirmed bookings**.

## 6. Verification performed

Run after the token/UI/shell changes, the homepage rebuild, and the icon pass:

- `npx tsc --noEmit` → **0 errors**
- `npm run lint` → **0 errors**, 2 warnings (both `@next/next/no-img-element`
  in `header.tsx` / `footer.tsx`, pre-existing pattern)
- `npm run build` → **success** (all routes compiled)

No test runner is configured in the repo, so lint + type + build are the
automated gates.

## 7. Known remaining issues / defects

- Two `no-img-element` lint **warnings** (not errors): header/footer logos use
  `<img>`. Intentionally left to avoid touching the asset pipeline.
- Driver/onboarding and auth forms remain intentionally narrow columns
  (`max-w-[360–420px]`) on desktop — a deliberate single-column choice, not a
  regression.
- Some legacy `rgba(10,61,48,…)` hover shadows in the dashboard hub still
  reference the old brand hue; visually negligible, not token-based.
- Admin panel stays English-only by design (documented in the audit).
- Homepage "popular routes" depend on the live feed; with an empty database the
  section correctly hides and the empty state is shown instead.

## 8. Recommended next steps (prioritised)

1. Replace header/footer `<img>` with `next/image` to clear the lint warnings.
2. Migrate remaining `rgba(10,61,48,…)` shadows to token-based shadows.
3. Add an automated smoke check (Playwright) for the search → detail → WhatsApp
   enquiry flow, since no test runner exists today.
4. Consider an empty-state pass for rentals/cars previews on the homepage when
   the DB is fresh.
5. Manual EN/TE QA on the longest Telugu strings at 320px to confirm no overflow.
