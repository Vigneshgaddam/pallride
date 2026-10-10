# PalleRide — Phase 4: Admin Panel & Moderation

The admin control room is a separate, full-width workspace (`/admin`) inside the
same Next.js app. It is **English-only** (no Telugu syncs), reuses the shared
JSON DB, and enforces **server-side roles on every API** — no client
checkbox/path check is ever trusted on its own.

## 1. Access & control center

- `Post /api/admin/login { key }` -> sets HttpOnly cookie `pr_admin`.
  Key = `ADMIN_KEY` env (`dev123` when `OTP_DEV=1`). Rate-limited 5/min/IP.
- `app/admin/(panel)/layout.tsx` (server) validates the cookie against
  `db.adminSessions` each render and `redirect("/admin/login")` on failure.
  Login page sits outside the guard via a route group.
- `Get /api/admin/stats` feeds the dashboard: users, pending verifications,
  live trips, safety queue, reviews to moderate, open incidents, active
  rentals, cars for sale. Each card deep-links to its queue.

## 2. Structure

```
app/admin/
  login/page.tsx            # not guarded
  (panel)/                  # guarded layout + 13 pages
    layout.tsx page.tsx users/ drivers/ verifications/ trips/ bookings/
    rentals/ listings/ reviews/ reports/ safety/ audit-logs/ settings/
api/admin/                  # login logout stats users[+id] verifications[+id]
                            # trips[+id] bookings rentals[+id] listings[+id]
                            # reviews[+id] reports[+id] safety[+id] audit settings
components/admin/           # AdminSidebar AdminHeader AdminStats DataTable
                            # StatusFilter VerificationReview ReportReview
                            # ListingModeration UserActions AuditLogTable
```

## 3. Verification workflow

Drivers undergo a **four-check ledger** (`checks.phone/profile/vehicle/
background`). Each box is toggled independently and recorded in the audit log;
`approve` implies every check is true, marks `verified=true` and the account
`active`. `changes` -> `changes_required`, `reject` -> `rejected`. Reg numbers
are shown only on this reviewer screen.

## 4. Report lifecycle & safety

- `ReportStatus`: `open | under_review | info_requested | action_taken |
  resolved | dismissed`. Transitions via `POST /api/admin/reports/[id]`
  (`start_review | request_info | action | resolve | dismiss | escalate`);
  every decision except `start_review`/`action` requires a written reason.
- `escalate` creates a Safety **incident**; the Safety module resolves/reopens
  incidents and links back to the originating report. Summary view only —
  restricted data never leaves the panel.

## 5. Moderation tables (all paginated + status-filtered)

- **Live Trips**: hide (leaves the public feed, driver still sees it),
  restore, cancel (reason required).
- **Rentals / Buy & Sell**: remove (stores `prevStatus`), restore verbatim.
- **Reviews**: approve before they become public; hide to moderate away.
- **Users**: suspend (reason required) / activate — enforced server-side
  everywhere (no more publishing trips/rentals/cars while suspended).

## 6. Audit trail & settings

- Every action writes an append-only audit entry (actor `admin`, action family,
  target id, note), capped at 2000 newest-first; a filterable `AuditLogTable`.
- `Settings`: operator label + maintenance flag. No secrets ever returned.

## 7. Security requirements

- Roles enforced in **route handlers** (`adminAuthorized(req, db)`) and the
  **panel layout** (cookie) — never client-only.
- Admin provisioning only via `ADMIN_KEY`/`OTP_DEV`; no public registration.
- Destructive actions (suspend, cancel, remove) require a reason and confirm.
- Login rate-limited; 12h sessions; audit-protected decisions.
- Least privilege: public APIs never return reg numbers, docs or session
  tokens; admin payloads are scoped per screen.

## 8. Free-first / low-network design

Admin queues fetch in small pages (20/25), render skeleton placeholders, and
offer explicit Retry + Prev/Next rather than infinite scroll. Slow-2G states
are plain non-animated text.