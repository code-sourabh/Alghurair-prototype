# Fleet Management Prototype — Frontend Design Spec

**Client:** Al Ghurair · **Build team:** Heizen **Source spec:** `mvp.md` (Discovery meeting, 19 Jun) **Date:**
2026-06-30 **Purpose:** A clickable frontend prototype to demo to the client. Frontend only, mock data, no backend.

## 1. Goal

Put a clickable prototype in front of Al Ghurair that closes both money-losing loops from the discovery meeting:

1. **Permits** — expirations are hard to track; a single lapse can cost ~AED 12,000 and take a vehicle off the road. The
   real example: 14 of 40 vehicles had expired documents.
2. **Maintenance** — daily issues are phoned in to one fleet manager and forgotten; nothing is tracked.

Success = the client watches a request flow from a driver's phone into the manager's pool, out to a vendor, and back —
and sees a permit dashboard that surfaces the expirations they currently lose in Excel.

## 2. Demo principles (what this is and isn't)

- **Frontend only.** No real server, DB, or auth. Mock data via the existing template helpers (`fakeLatency`,
  `localStore` in `apps/web/lib/mock.ts`).
- **State sticks during the demo.** Actions persist to `localStorage` so a driver submission actually appears in the
  Fleet Manager's pool live. A **Reset demo** control restores seed data.
- **Reuse the scaffold.** The repo is the Heizen `next-prototype-template` (Next.js App Router + Turborepo + shadcn
  `@repo/ui`). Repurpose the existing generic screens (`dashboard`/`customers`/`orders`/`settings`) into fleet screens
  rather than building from zero. Follow `.claude/skills/prototype/conventions.md` for all silent technical decisions
  (light theme, neutral + teal accent, tokens not hex, responsive, accessible).

## 3. Architecture — single app + persona switcher

One Next.js app. A **demo toolbar** (top-right, persistent) holds:

- **Persona switcher**: Driver · Fleet Manager · Management · Vendor.
- **Reset demo** button.
- **Notifications / Outbox** opener (see §4.4).

Switching persona swaps the active surface:

- **Driver** renders inside a **phone frame** (centered, ~390px wide) to read as the mobile PWA. Within the frame the
  app is a real PWA-styled, touch-target-sized, mobile layout.
- **Fleet Manager / Management / Vendor** render as the full-width web admin (sidebar + topbar from the existing
  app-shell). The sidebar nav changes per role.

Active persona is held in a small client-side context/provider and persisted to `localStorage` so a refresh keeps you in
role. No routing-level auth — persona is a demo construct.

## 4. Shared concepts

### 4.1 Mock data model

Seeded into `apps/web/lib/mock-data/*.ts`, typed.

- **~30 vehicles/assets.** Believable mix: big trucks, small trucks, vans, "tickle" trucks, tankers, in-facility
  equipment. Some are cold-chain (chiller), some not. Spread across a few of the 12 UAE plants/warehouses.
- **Asset master fields:** id, QR code id, type, model, age, purchase price, current value, current mileage, service
  interval (km), plant/location, cold-chain flag, operational status (operational / in-maintenance / down).
- **Documents per vehicle** (the 5 types): road permit ×7 emirates, license, trailer, branding, mulkea; plus chiller
  expiry on cold-chain units. Each: type, (emirate if road permit), expiry date, derived status (valid / near-expiry /
  expired). Status drives color.
- **Hero stat seeded from reality:** ~10 of 30 vehicles carry an expired or near-expiry document so the permit dashboard
  opens on a number that stings.
- **Maintenance requests:** a handful pre-seeded across statuses (new / assigned / in-progress / resolved), plus
  whatever the driver submits live.
- **Vendors:** 3–4, each with assigned vehicles/locations and a response-time history (for the report).

### 4.2 QR "scan" (faked)

No camera. The driver "scans" by tapping a **Scan QR** button (or picking a vehicle tile) which opens that asset's page.
This is the only honest fake of the scan flow.

### 4.3 Auth (faked)

Vendor "login" is a single screen that drops into the vendor view. Drivers have no login (matches spec: QR is per-asset;
on scan the app asks for an identifying number recorded only to attribute the submission).

### 4.4 Notifications / Outbox (faked, but a feature)

No real email/WhatsApp. Every notification the system "sends" (vendor assignment, renewal request, service-due alert) is
written to an **Outbox panel** showing the exact message that would go out (recipient, channel, vehicle, location,
body). Lets the demo show the client "here's the WhatsApp the vendor receives." A toast also fires on send.

## 5. Driver — mobile PWA (phone-framed)

- **Scan → Asset page:** vehicle photo, model, mileage, plant; prompt for identifying number (asset/driver number),
  recorded only.
- **Raise maintenance request:** breakdown type (electrical / mechanical / body / chiller / other) → severity (low /
  medium) → description → attach photo (thumbnail preview) → submit. Lands in the Fleet Manager pool immediately and
  fires an Outbox notification per config (to Fleet Manager or directly to vendor).
- **Update mileage:** entering a new reading that crosses the service interval surfaces a "service due" flag and an
  Outbox alert.
- **Cold-chain temperature** (chiller vehicles only): log daily temp; flags if below the set limit.
- **My requests:** follow-up list of the driver's own submissions with current status.

## 6. Fleet Manager — web (the hub)

### 6.1 Request pool & distribution

- One table of all maintenance requests (filter by status/type/severity).
- Open a request → **assign vendor** (manual select, or auto-route by type per config §9) → fires Outbox notification to
  the vendor (vehicle + location + "propose time") → request moves to assigned.
- Track and update status through the lifecycle.

### 6.2 Permit dashboard

- Summary tiles: vehicles in use · valid count · expiring in 90 days · expiring in 60 days.
- Breakdown by document type (mulkea, branding, road permit, chiller, license, trailer).
- Filter by document type / status. An **expired list** is one click away.
- Open a vehicle → see each document valid vs expired → **Send renewal** to the responsible party (Outbox) → track until
  renewed.

## 7. Management — web (read-only)

- Combined dashboards:
  - **Maintenance metrics:** total fleet · operational · in-maintenance · open requests.
  - **Permit metrics:** the §6.2 tiles + by-document breakdown.
- **Reports (1–2 that matter):** vendor response time / who's delaying (so a vendor can be swapped), and the
  expired-documents report.

## 8. Vendor — web

- Fake login → assigned-fleet view.
- Open an assigned request → enter **expected price, visit time, status** → updates flow back to the Fleet Manager
  tracker.

## 9. Config (admin, light)

Editable-looking screens for the three things the meeting named — functional enough to demo, not a settings engine:

- **Routing rules:** request type → vendor.
- **Service intervals** per asset (e.g. oil change every 5,000 km).
- **Permit alert windows:** 60 / 90 day.

## 10. Branding & theme

"Al Ghurair Fleet" wordmark, teal house style per conventions (swappable in `packages/ui/src/styles/globals.css`). Light
theme default; dark toggle available.

## 11. Out of scope (per the meeting's own "future" framing)

Control Tower, ERP integration, machine learning, real QR encoding/procurement, real notification delivery
(email/WhatsApp), real authentication, camera-based scanning, IoT/tracking hardware.

## 12. Reuse map (existing scaffold → fleet)

| Existing                                     | Becomes                                     |
| -------------------------------------------- | ------------------------------------------- |
| `app/(app)/page.tsx` (dashboard)             | Management / Fleet Manager dashboards       |
| `app/(app)/customers`                        | Vehicles / Assets list                      |
| `app/(app)/orders`                           | Maintenance request pool                    |
| `app/(app)/settings`                         | Config (§9)                                 |
| `components/app-shell/*`                     | Web admin shell; nav items vary per persona |
| `components/dashboard/*` (StatCards, charts) | Fleet/permit metric tiles & charts          |
| `lib/mock.ts`, `lib/mock-data/*`             | Fleet mock data + persistence               |

New: persona switcher + demo toolbar, phone-frame wrapper, driver PWA screens, permit dashboard, Outbox panel.
