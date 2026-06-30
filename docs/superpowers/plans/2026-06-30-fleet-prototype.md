# Fleet Management Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clickable, frontend-only Next.js prototype of the Al Ghurair fleet system — Maintenance + Permits modules across four personas (Driver mobile PWA, Fleet Manager, Management, Vendor) — that demos the full request loop and the permit-expiry dashboard.

**Architecture:** Single Next.js app (App Router). A demo toolbar with a **persona switcher** swaps the active surface: Driver renders inside a phone frame; the other three render the web admin shell. All mutable state lives in one React context (`useFleet`) persisted to `localStorage`, so a driver's submission appears live in the Fleet Manager's pool. Notifications are faked into an **Outbox** panel. Reuse the existing Heizen template scaffold (shadcn `@repo/ui`, `lib/mock.ts`, app-shell).

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4, shadcn `@repo/ui`, `lucide-react`, `react-hook-form` + `zod`, `sonner`, `@tanstack/react-query` (already wired). pnpm + Turborepo.

**Verification model (read first — this is a no-backend prototype):** There is no test runner installed (`jest` is referenced in `package.json` but not a dependency) and the template charter is "frontend + mock data, no tests by default." So each task verifies with:
- `pnpm --filter web typecheck` → no errors
- `pnpm --filter web lint` → no errors
- A described manual check at `http://localhost:3000` (`pnpm --filter web dev`)

The one piece of real logic (permit-status date math, Task 2) is made **deterministic** against a fixed `DEMO_TODAY` constant and verified by documented expected counts, so the demo never drifts over time. Do not add jest/vitest.

**Conventions:** Follow `.claude/skills/prototype/conventions.md` — light theme + neutral/teal tokens (no raw hex), responsive, accessible, shadcn components from `@repo/ui`, mock data in typed files. Commit after every task.

---

## File Structure

New code lives under `apps/web/lib/fleet/` (domain) and `apps/web/components/fleet/` (UI), plus new routes. Reuse map from the spec:

| Existing | Reused as |
| --- | --- |
| `app/(app)/layout.tsx` | Demo shell: store provider + toolbar + conditional phone-frame/sidebar |
| `app/(app)/page.tsx` | Adaptive dashboard (Fleet Manager / Management) |
| `app/(app)/customers/` | Removed → `/vehicles` |
| `app/(app)/orders/` | Removed → `/requests` |
| `app/(app)/settings/` | Removed → `/config` |
| `components/app-shell/AppSidebar.tsx` | Persona-aware nav |
| `components/app-shell/Topbar.tsx` | Reused as-is |
| `components/dashboard/StatCards.tsx` | Pattern for metric tiles |
| `lib/mock.ts` (`fakeLatency`, `localStore`, `mockId`) | Reused |

**New files (created across tasks):**
- `lib/fleet/types.ts` — all domain types
- `lib/fleet/permit-status.ts` — deterministic date/status logic
- `lib/fleet/data/{vehicles,documents,requests,vendors,config}.ts` — seed data
- `lib/fleet/store.tsx` — `FleetProvider` + `useFleet()` context (state + actions + persistence)
- `components/fleet/demo/{DemoToolbar,PersonaSwitcher,PhoneFrame,OutboxPanel}.tsx`
- `components/fleet/{StatusBadge,MetricTiles}.tsx` — shared bits
- Web routes: `app/(app)/vehicles/page.tsx`, `requests/page.tsx`, `permits/page.tsx`, `reports/page.tsx`, `config/page.tsx`, `vendor/page.tsx`
- Driver routes: `app/(app)/driver/page.tsx`, `driver/asset/[id]/page.tsx`
- Driver components under `components/fleet/driver/`

---

## Task 1: Domain types

**Files:**
- Create: `apps/web/lib/fleet/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// apps/web/lib/fleet/types.ts
export type Persona = 'driver' | 'fleet_manager' | 'management' | 'vendor';

export type VehicleType = 'big_truck' | 'small_truck' | 'van' | 'tickle_truck' | 'tanker' | 'equipment';
export type OperationalStatus = 'operational' | 'in_maintenance' | 'down';

export interface Vehicle {
  id: string; // plate-like, e.g. 'AG-1042'
  qrId: string; // QR payload, e.g. 'QR-AG-1042'
  name: string; // 'Mercedes Actros 2640'
  type: VehicleType;
  model: string;
  year: number;
  ageYears: number;
  purchasePrice: number; // AED
  currentValue: number; // AED
  mileageKm: number;
  serviceIntervalKm: number; // e.g. 5000
  lastServiceKm: number;
  plant: string; // 'Dubai DIP Plant'
  coldChain: boolean;
  status: OperationalStatus;
  lastTempC?: number; // last logged chiller temp (cold-chain only)
}

export type DocumentType = 'road_permit' | 'license' | 'trailer' | 'branding' | 'mulkea' | 'chiller';
export type Emirate =
  | 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah';
export type DocStatus = 'valid' | 'near_expiry' | 'expired';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  emirate?: Emirate; // only for road_permit
  responsibleParty: string; // who renews it, e.g. 'Branding Dept'
  expiry: string; // ISO date 'YYYY-MM-DD'
}

export type Severity = 'low' | 'medium';
export type RequestType = 'electrical' | 'mechanical' | 'body' | 'chiller' | 'other';
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  vehicleId: string;
  type: RequestType;
  severity: Severity;
  description: string;
  photoDataUrl?: string; // attached photo preview
  submittedBy: string; // asset/driver number entered on scan
  createdAt: string; // ISO
  status: RequestStatus;
  vendorId?: string;
  quotedPrice?: number; // AED
  visitTime?: string; // ISO
  vendorNotes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  username: string; // fake login
  specialties: RequestType[];
  assignedPlants: string[];
  avgResponseHours: number; // for the report
}

export type RenewalStatus = 'sent' | 'in_progress' | 'renewed';
export interface RenewalTask {
  id: string;
  documentId: string;
  vehicleId: string;
  responsibleParty: string;
  sentAt: string;
  status: RenewalStatus;
}

export type OutboxChannel = 'whatsapp' | 'email';
export interface OutboxMessage {
  id: string;
  channel: OutboxChannel;
  to: string;
  subject: string;
  body: string;
  sentAt: string; // ISO
  relatedId?: string; // request or renewal id
}

export interface RoutingRule {
  requestType: RequestType;
  vendorId: string;
}
export interface DemoConfig {
  routingRules: RoutingRule[];
  alertWindowFarDays: number; // 90
  alertWindowNearDays: number; // 60
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter web typecheck`
Expected: PASS (no errors). The file is types-only so nothing imports it yet.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/fleet/types.ts
git commit -m "feat(fleet): add domain types"
```

---

## Task 2: Permit-status logic (deterministic)

**Files:**
- Create: `apps/web/lib/fleet/permit-status.ts`

- [ ] **Step 1: Write the pure status helpers**

```ts
// apps/web/lib/fleet/permit-status.ts
import type { DocStatus } from './types';

/**
 * Fixed "today" for the demo so expiry counts never drift between runs.
 * All seed expiry dates are chosen relative to this date.
 */
export const DEMO_TODAY = '2026-06-30';

const DAY_MS = 86_400_000;

/** Whole days from `today` until `expiry` (negative if already expired). */
export function daysUntil(expiry: string, today: string = DEMO_TODAY): number {
  return Math.floor((new Date(expiry).getTime() - new Date(today).getTime()) / DAY_MS);
}

/** True when the document expires within `days` from now and is not already expired. */
export function expiresWithin(expiry: string, days: number, today: string = DEMO_TODAY): boolean {
  const d = daysUntil(expiry, today);
  return d >= 0 && d <= days;
}

/** Color tier for a document. `nearDays` is the amber window (default 60). */
export function docStatus(expiry: string, nearDays = 60, today: string = DEMO_TODAY): DocStatus {
  const d = daysUntil(expiry, today);
  if (d < 0) return 'expired';
  if (d <= nearDays) return 'near_expiry';
  return 'valid';
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter web typecheck`
Expected: PASS.

- [ ] **Step 3: Sanity-check the math by hand (documented expected values)**

Against `DEMO_TODAY = '2026-06-30'`:
- `daysUntil('2026-06-20')` → `-10` → `docStatus` = `expired`
- `daysUntil('2026-07-20')` → `20` → `docStatus(.., 60)` = `near_expiry`; `expiresWithin(.., 60)` = `true`
- `daysUntil('2026-12-01')` → `154` → `docStatus` = `valid`; `expiresWithin(.., 90)` = `false`

These exact inputs are reused as seed dates in Task 3, so the dashboard counts are predictable. No code change needed — this step is a reasoning check.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/fleet/permit-status.ts
git commit -m "feat(fleet): add deterministic permit-status logic"
```

---

## Task 3: Seed mock data

Seed a believable fleet with **predictable permit aggregates** so the demo opens on a number that stings.

**Target aggregates (verify by eye in Task 9), across 30 vehicles:**
- **4 vehicles** have at least one **expired** document.
- **6 more vehicles** have a document **expiring within 60 days** (near-expiry, none expired).
- **3 more** have a document **expiring within 90 days** (but >60). → "expiring in 90" tile counts the 60-day ones too (cumulative ≤90 = 9 vehicles).
- The remaining **17 vehicles** are fully valid.
- ~6 vehicles are cold-chain (have a `chiller` document + `coldChain: true`).

**Files:**
- Create: `apps/web/lib/fleet/data/vehicles.ts`
- Create: `apps/web/lib/fleet/data/documents.ts`
- Create: `apps/web/lib/fleet/data/vendors.ts`
- Create: `apps/web/lib/fleet/data/requests.ts`
- Create: `apps/web/lib/fleet/data/config.ts`

- [ ] **Step 1: Vendors**

```ts
// apps/web/lib/fleet/data/vendors.ts
import type { Vendor } from '../types';

export const vendors: Vendor[] = [
  { id: 'v_elec', name: 'Emirates Auto Electric', username: 'electric', specialties: ['electrical'], assignedPlants: ['Dubai DIP Plant', 'Sharjah Plant'], avgResponseHours: 4 },
  { id: 'v_mech', name: 'Gulf Mechanical Services', username: 'mechanical', specialties: ['mechanical'], assignedPlants: ['Dubai DIP Plant', 'Abu Dhabi Plant'], avgResponseHours: 9 },
  { id: 'v_body', name: 'ProBody & Paint LLC', username: 'body', specialties: ['body'], assignedPlants: ['Sharjah Plant'], avgResponseHours: 28 }, // the slow one (for the report)
  { id: 'v_cold', name: 'CoolChain Refrigeration', username: 'chiller', specialties: ['chiller'], assignedPlants: ['Dubai DIP Plant', 'Abu Dhabi Plant'], avgResponseHours: 6 },
];
```

- [ ] **Step 2: Vehicles (30, typed)**

Create `apps/web/lib/fleet/data/vehicles.ts` exporting `vehicles: Vehicle[]` with 30 entries. Use a small set of plants: `'Dubai DIP Plant'`, `'Abu Dhabi Plant'`, `'Sharjah Plant'`, `'Al Ain Plant'`. Believable models (Mercedes Actros, Isuzu NPR, Mitsubishi Fuso, Toyota Hiace, tankers, forklifts). IDs `AG-1001`..`AG-1030`, `qrId` = `'QR-' + id`. ~6 with `coldChain: true`. Set 3 vehicles `status: 'in_maintenance'` and 1 `status: 'down'` (matches seeded open requests in Step 4); rest `operational`. Mileage near/over `serviceIntervalKm` multiples for 2 vehicles so a "service due" flag shows. Example row:

```ts
{
  id: 'AG-1001', qrId: 'QR-AG-1001', name: 'Mercedes Actros 2640', type: 'big_truck',
  model: 'Actros 2640', year: 2019, ageYears: 7, purchasePrice: 420000, currentValue: 180000,
  mileageKm: 312450, serviceIntervalKm: 15000, lastServiceKm: 300000, plant: 'Dubai DIP Plant',
  coldChain: false, status: 'operational',
},
```

- [ ] **Step 3: Documents (with dates that hit the Task 3 aggregates)**

Create `apps/web/lib/fleet/data/documents.ts` exporting `documents: VehicleDocument[]`. For each vehicle generate the standard set: `road_permit` for the emirate(s) it operates in (give most vehicles 2–3 emirate road permits, not all 7, to keep the list demoable), `license`, `mulkea`, `branding`, and `trailer` for trucks; add `chiller` for cold-chain vehicles. `responsibleParty` by type: road_permit→`'RTA Liaison'`, license→`'Licensing Dept'`, mulkea→`'Mulkea Desk'`, branding→`'Branding Dept'`, trailer→`'Fleet Admin'`, chiller→`'CoolChain Refrigeration'`.

**Dates — pick expiries relative to `DEMO_TODAY='2026-06-30'` to hit the aggregates:**
- Vehicles `AG-1001`..`AG-1004`: give ONE document an **expired** date (e.g. `'2026-05-15'`, `'2026-04-20'`, `'2026-06-10'`, `'2026-03-01'`). Vary which doc type (branding, road_permit Dubai, mulkea, chiller) for a believable spread.
- Vehicles `AG-1005`..`AG-1010`: give ONE document a **≤60-day** expiry (e.g. `'2026-07-20'`, `'2026-08-05'`, `'2026-07-10'`, `'2026-08-20'`, `'2026-07-31'`, `'2026-08-15'`).
- Vehicles `AG-1011`..`AG-1013`: give ONE document a **61–90-day** expiry (e.g. `'2026-09-15'`, `'2026-09-20'`, `'2026-09-25'`).
- All other documents: expiries `'2027-01-01'` or later (valid).

- [ ] **Step 4: Seed maintenance requests**

Create `apps/web/lib/fleet/data/requests.ts` exporting `seedRequests: MaintenanceRequest[]` — 5 entries across statuses, referencing real vehicle ids. Use fixed ISO `createdAt` strings (e.g. `'2026-06-28T08:15:00Z'`). Example:

```ts
{ id: 'req_seed_1', vehicleId: 'AG-1007', type: 'electrical', severity: 'medium',
  description: 'Right headlight not working', submittedBy: 'D-204',
  createdAt: '2026-06-29T07:40:00Z', status: 'new' },
{ id: 'req_seed_2', vehicleId: 'AG-1003', type: 'chiller', severity: 'medium',
  description: 'Chiller not holding temperature, reads 9°C', submittedBy: 'D-118',
  createdAt: '2026-06-28T13:05:00Z', status: 'assigned', vendorId: 'v_cold' },
// + one in_progress, one resolved, one more new
```

- [ ] **Step 5: Config**

```ts
// apps/web/lib/fleet/data/config.ts
import type { DemoConfig } from '../types';

export const seedConfig: DemoConfig = {
  routingRules: [
    { requestType: 'electrical', vendorId: 'v_elec' },
    { requestType: 'mechanical', vendorId: 'v_mech' },
    { requestType: 'body', vendorId: 'v_body' },
    { requestType: 'chiller', vendorId: 'v_cold' },
    { requestType: 'other', vendorId: 'v_mech' },
  ],
  alertWindowFarDays: 90,
  alertWindowNearDays: 60,
};
```

- [ ] **Step 6: Verify & commit**

Run: `pnpm --filter web typecheck` → PASS.
```bash
git add apps/web/lib/fleet/data
git commit -m "feat(fleet): seed mock fleet, documents, vendors, requests, config"
```

---

## Task 4: Fleet store (state + actions + persistence)

The heart of the demo. One context holds all mutable state, persists to `localStorage`, and exposes actions. Reuses `localStore`/`mockId` from `lib/mock.ts`.

**Files:**
- Create: `apps/web/lib/fleet/store.tsx`

- [ ] **Step 1: Write the provider + hook**

```tsx
// apps/web/lib/fleet/store.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { localStore, mockId } from '@/lib/mock';
import { vehicles as seedVehicles } from './data/vehicles';
import { documents as seedDocuments } from './data/documents';
import { vendors as seedVendors } from './data/vendors';
import { seedRequests } from './data/requests';
import { seedConfig } from './data/config';
import type {
  Persona, Vehicle, VehicleDocument, Vendor, MaintenanceRequest, RenewalTask,
  OutboxMessage, DemoConfig, RequestType, Severity,
} from './types';

const STORE_KEY = 'ag-fleet-demo-v2';

interface PersistedState {
  vehicles: Vehicle[];
  documents: VehicleDocument[];
  vendors: Vendor[];
  requests: MaintenanceRequest[];
  renewals: RenewalTask[];
  outbox: OutboxMessage[];
  config: DemoConfig;
}

function seed(): PersistedState {
  return {
    vehicles: seedVehicles, documents: seedDocuments, vendors: seedVendors,
    requests: seedRequests, renewals: [], outbox: [], config: seedConfig,
  };
}

interface FleetContextValue extends PersistedState {
  persona: Persona;
  setPersona: (p: Persona) => void;
  // driver actions
  submitRequest: (input: {
    vehicleId: string; type: RequestType; severity: Severity;
    description: string; photoDataUrl?: string; submittedBy: string;
  }) => MaintenanceRequest;
  updateMileage: (vehicleId: string, mileageKm: number) => void;
  logTemperature: (vehicleId: string, tempC: number) => void;
  // fleet manager actions
  assignVendor: (requestId: string, vendorId: string) => void;
  advanceRequest: (requestId: string) => void; // new→assigned→in_progress→resolved
  sendRenewal: (documentId: string) => void;
  advanceRenewal: (renewalId: string) => void; // sent→in_progress→renewed
  updateConfig: (config: DemoConfig) => void;
  // vendor actions
  vendorRespond: (requestId: string, input: { quotedPrice: number; visitTime: string; vendorNotes?: string }) => void;
  // demo
  resetDemo: () => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>('fleet_manager');
  const [state, setState] = useState<PersistedState>(seed);

  // hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setState(localStore.get<PersistedState>(STORE_KEY, seed()));
    const p = localStore.get<Persona | null>(STORE_KEY + ':persona', null);
    if (p) setPersonaState(p);
  }, []);

  // persist on change
  useEffect(() => { localStore.set(STORE_KEY, state); }, [state]);

  const setPersona = (p: Persona) => { setPersonaState(p); localStore.set(STORE_KEY + ':persona', p); };

  const now = () => new Date().toISOString();
  const vendorName = (id?: string) => state.vendors.find((v) => v.id === id)?.name ?? 'vendor';
  const vehicleLabel = (id: string) => {
    const v = state.vehicles.find((x) => x.id === id);
    return v ? `${v.id} (${v.name}) @ ${v.plant}` : id;
  };

  const submitRequest: FleetContextValue['submitRequest'] = (input) => {
    const req: MaintenanceRequest = { id: mockId('req'), createdAt: now(), status: 'new', ...input };
    // auto-route per config → outbox to the mapped vendor
    const rule = state.config.routingRules.find((r) => r.requestType === input.type);
    const out: OutboxMessage[] = rule
      ? [{ id: mockId('out'), channel: 'whatsapp', to: vendorName(rule.vendorId),
          subject: `New ${input.severity} ${input.type} request`,
          body: `Vehicle ${vehicleLabel(input.vehicleId)} — "${input.description}". Please propose a visit time.`,
          sentAt: now(), relatedId: req.id }]
      : [];
    setState((s) => ({ ...s, requests: [req, ...s.requests], outbox: [...out, ...s.outbox] }));
    return req;
  };

  const assignVendor: FleetContextValue['assignVendor'] = (requestId, vendorId) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => r.id === requestId ? { ...r, vendorId, status: 'assigned' } : r),
      outbox: [{ id: mockId('out'), channel: 'whatsapp', to: vendorName(vendorId),
        subject: 'Request assigned to you',
        body: `Vehicle ${vehicleLabel(s.requests.find((r) => r.id === requestId)?.vehicleId ?? '')} assigned. Please propose a visit time.`,
        sentAt: now(), relatedId: requestId }, ...s.outbox],
    }));
  };

  const advanceRequest: FleetContextValue['advanceRequest'] = (requestId) => {
    const next = { new: 'assigned', assigned: 'in_progress', in_progress: 'resolved', resolved: 'resolved' } as const;
    setState((s) => ({ ...s, requests: s.requests.map((r) => r.id === requestId ? { ...r, status: next[r.status] } : r) }));
  };

  const updateMileage: FleetContextValue['updateMileage'] = (vehicleId, mileageKm) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => v.id === vehicleId ? { ...v, mileageKm } : v) }));
  };

  const logTemperature: FleetContextValue['logTemperature'] = (vehicleId, tempC) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => v.id === vehicleId ? { ...v, lastTempC: tempC } : v) }));
  };

  const sendRenewal: FleetContextValue['sendRenewal'] = (documentId) => {
    const doc = state.documents.find((d) => d.id === documentId);
    if (!doc) return;
    const renewal: RenewalTask = { id: mockId('rnw'), documentId, vehicleId: doc.vehicleId, responsibleParty: doc.responsibleParty, sentAt: now(), status: 'sent' };
    setState((s) => ({
      ...s, renewals: [renewal, ...s.renewals],
      outbox: [{ id: mockId('out'), channel: 'email', to: doc.responsibleParty,
        subject: `Renewal needed: ${doc.type}${doc.emirate ? ' (' + doc.emirate + ')' : ''}`,
        body: `Document for ${vehicleLabel(doc.vehicleId)} expires ${doc.expiry}. Please renew and confirm.`,
        sentAt: now(), relatedId: renewal.id }, ...s.outbox],
    }));
  };

  const advanceRenewal: FleetContextValue['advanceRenewal'] = (renewalId) => {
    const next = { sent: 'in_progress', in_progress: 'renewed', renewed: 'renewed' } as const;
    setState((s) => ({ ...s, renewals: s.renewals.map((r) => r.id === renewalId ? { ...r, status: next[r.status] } : r) }));
  };

  const vendorRespond: FleetContextValue['vendorRespond'] = (requestId, input) => {
    setState((s) => ({ ...s, requests: s.requests.map((r) => r.id === requestId ? { ...r, ...input, status: 'in_progress' } : r) }));
  };

  const updateConfig: FleetContextValue['updateConfig'] = (config) => setState((s) => ({ ...s, config }));

  const resetDemo = () => { setState(seed()); setPersona('fleet_manager'); };

  return (
    <FleetContext.Provider value={{
      ...state, persona, setPersona, submitRequest, updateMileage, logTemperature,
      assignVendor, advanceRequest, sendRenewal, advanceRenewal, updateConfig, vendorRespond, resetDemo,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify & commit**

Run: `pnpm --filter web typecheck` → PASS.
```bash
git add apps/web/lib/fleet/store.tsx
git commit -m "feat(fleet): add fleet store with persistence and actions"
```

---

## Task 5: Demo shell — phone frame, toolbar, outbox

**Files:**
- Create: `apps/web/components/fleet/demo/PhoneFrame.tsx`
- Create: `apps/web/components/fleet/demo/PersonaSwitcher.tsx`
- Create: `apps/web/components/fleet/demo/OutboxPanel.tsx`
- Create: `apps/web/components/fleet/demo/DemoToolbar.tsx`

- [ ] **Step 1: PhoneFrame** — a centered device mock. Wraps children in a `~390px` wide, `~box` rounded container with a subtle border and a notch bar. Uses tokens only.

```tsx
// apps/web/components/fleet/demo/PhoneFrame.tsx
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-muted/40 flex min-h-svh w-full justify-center px-4 py-8'>
      <div className='border-border bg-background relative flex h-[820px] w-[390px] flex-col overflow-hidden rounded-[2.25rem] border-8 shadow-xl'>
        <div className='bg-background flex h-7 shrink-0 items-center justify-center'>
          <div className='bg-border h-1.5 w-20 rounded-full' />
        </div>
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: PersonaSwitcher** — a `Select` (from `@repo/ui/components/select`) bound to `useFleet().persona`. On change, call `setPersona` and `router.push` to the persona home: `driver`→`/driver`, `fleet_manager`→`/`, `management`→`/`, `vendor`→`/vendor`. Label each option with an icon + name (Driver, Fleet Manager, Management, Vendor). `'use client'`.

- [ ] **Step 3: OutboxPanel** — a `Sheet` (from `@repo/ui/components/sheet`) triggered by a button with a `Mail`/`Bell` icon showing a count badge = `useFleet().outbox.length`. Lists messages newest-first: channel icon (WhatsApp=`MessageCircle`, email=`Mail`), `to`, `subject`, `body`, relative time. Empty state: "No notifications sent yet." This is the faked WhatsApp/email feed.

- [ ] **Step 4: DemoToolbar** — a fixed top bar (`'use client'`) spanning the viewport: left = "Al Ghurair Fleet" wordmark + a small "DEMO" badge; right = `<PersonaSwitcher/>`, `<OutboxPanel/>` trigger, theme toggle (reuse `@repo/ui/components/theme-toggle`), and a **Reset demo** `Button` (variant `outline`, `RotateCcw` icon) calling `resetDemo()` then `toast('Demo reset')` (sonner).

- [ ] **Step 5: Verify & commit**

Run: `pnpm --filter web typecheck` → PASS (components not yet mounted; that's Task 6).
```bash
git add apps/web/components/fleet/demo
git commit -m "feat(fleet): add demo shell components (phone frame, toolbar, outbox)"
```

---

## Task 6: Wire the layout + persona-aware nav + branding

**Files:**
- Modify: `apps/web/app/(app)/layout.tsx`
- Modify: `apps/web/components/app-shell/AppSidebar.tsx`
- Delete: `apps/web/app/(app)/customers/`, `apps/web/app/(app)/orders/`, `apps/web/app/(app)/settings/` (replaced by new routes) and their now-unused components (`components/customers/`, the old order parts of `components/dashboard` stay reusable). Remove old mock-data files `lib/mock-data/{customers,orders}.ts` once nothing imports them.

- [ ] **Step 1: Rewrite `(app)/layout.tsx`** to provide the store, render the toolbar, and choose the shell by persona:

```tsx
// apps/web/app/(app)/layout.tsx
'use client';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar';
import { AppSidebar } from '@/components/app-shell/AppSidebar';
import { FleetProvider, useFleet } from '@/lib/fleet/store';
import { DemoToolbar } from '@/components/fleet/demo/DemoToolbar';
import { PhoneFrame } from '@/components/fleet/demo/PhoneFrame';

function Shell({ children }: { children: React.ReactNode }) {
  const { persona } = useFleet();
  if (persona === 'driver') {
    return <div className='pt-12'><PhoneFrame>{children}</PhoneFrame></div>;
  }
  return (
    <div className='pt-12'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FleetProvider>
      <DemoToolbar />
      <Shell>{children}</Shell>
    </FleetProvider>
  );
}
```

(The `pt-12` offsets the fixed toolbar height.)

- [ ] **Step 2: Persona-aware sidebar.** Rewrite `AppSidebar.tsx` to read `useFleet().persona` and render nav per role:
  - `fleet_manager`: Dashboard `/`, Vehicles `/vehicles`, Requests `/requests`, Permits `/permits`, Config `/config`
  - `management`: Dashboard `/`, Vehicles `/vehicles`, Permits `/permits`, Reports `/reports`
  - `vendor`: My Work `/vendor`
  - (`driver` never sees the sidebar)
  Header wordmark → "Al Ghurair Fleet". Keep the existing active-route logic. Icons: `LayoutDashboard`, `Truck`, `Wrench`, `FileBadge`, `Settings`, `BarChart3`, `ClipboardList`.

- [ ] **Step 3: Delete dead template routes/components & fix imports.** Remove `customers/`, `orders/`, `settings/` route folders, `components/customers/`, `lib/mock-data/{customers,orders}.ts`. Run `pnpm --filter web typecheck` and fix any dangling imports (e.g. `RecentOrders` still imports `orders` — leave `dashboard.ts`/charts for now; they get replaced in Task 10, so temporarily keep `RecentOrders`/`RevenueChart` compiling or stub the dashboard page in Step 4).

- [ ] **Step 4: Temporary dashboard placeholder.** Replace `(app)/page.tsx` body with a minimal placeholder (`<Topbar title='Dashboard' />` + "Coming up") so the app builds while later tasks fill it. Real dashboard is Task 10.

- [ ] **Step 5: Verify & commit**

Run: `pnpm --filter web dev`, open `http://localhost:3000`. Expect: fixed top toolbar with persona switcher + reset + outbox. Switch to **Driver** → content renders inside a phone frame, no sidebar. Switch to **Fleet Manager** → sidebar with fleet nav. No console errors. Run `pnpm --filter web typecheck && pnpm --filter web lint` → PASS.
```bash
git add -A
git commit -m "feat(fleet): wire demo shell, persona-aware nav, remove template routes"
```

---

## Task 7: Shared UI bits — StatusBadge & MetricTiles

**Files:**
- Create: `apps/web/components/fleet/StatusBadge.tsx`
- Create: `apps/web/components/fleet/MetricTiles.tsx`

- [ ] **Step 1: StatusBadge** — maps a status string to a shadcn `Badge` variant + label. Handle `DocStatus` (valid=secondary/teal, near_expiry=amber via `bg-amber-*`? NO — tokens only: use `outline` + `text-muted-foreground` for near, `destructive` for expired, `secondary` for valid), `RequestStatus`, `OperationalStatus`, `RenewalStatus`. Single component with a `kind` prop or a small map. Keep to tokens + `destructive`; for "near/warning" use `Badge variant="outline"` with `border-destructive/40 text-destructive` to avoid off-palette colors per conventions.

```tsx
// apps/web/components/fleet/StatusBadge.tsx
import { Badge } from '@repo/ui/components/badge';
const MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  valid: { label: 'Valid', variant: 'secondary' },
  near_expiry: { label: 'Near expiry', variant: 'outline', className: 'border-destructive/40 text-destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
  operational: { label: 'Operational', variant: 'secondary' },
  in_maintenance: { label: 'In maintenance', variant: 'outline' },
  down: { label: 'Down', variant: 'destructive' },
  new: { label: 'New', variant: 'default' },
  assigned: { label: 'Assigned', variant: 'outline' },
  in_progress: { label: 'In progress', variant: 'outline' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  renewed: { label: 'Renewed', variant: 'secondary' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
}
```

- [ ] **Step 2: MetricTiles** — takes `tiles: { label: string; value: string | number; hint?: string; tone?: 'default' | 'danger' }[]` and renders the `StatCards` grid pattern (reuse the `Card` markup from `components/dashboard/StatCards.tsx`; `tone:'danger'` → value in `text-destructive`). Grid `sm:grid-cols-2 lg:grid-cols-4`.

- [ ] **Step 3: Verify & commit**

Run: `pnpm --filter web typecheck` → PASS.
```bash
git add apps/web/components/fleet/StatusBadge.tsx apps/web/components/fleet/MetricTiles.tsx
git commit -m "feat(fleet): add StatusBadge and MetricTiles"
```

---

## Task 8: Vehicles list page

**Files:**
- Create: `apps/web/app/(app)/vehicles/page.tsx`

- [ ] **Step 1: Build the page** (`'use client'`). `<Topbar title='Vehicles' />` + a `Table` (`@repo/ui/components/table`) of `useFleet().vehicles`: columns ID, Name, Type, Plant, Mileage, Cold-chain (snowflake icon if true), Status (`<StatusBadge>`). Add a search `Input` filtering by id/name/plant and a `Select` filter by type. A row click opens a `Sheet` showing master data (purchase price, current value, age, model, service interval) + that vehicle's documents (from `useFleet().documents.filter(d => d.vehicleId === id)`) each with `docStatus(...)` → `<StatusBadge>`. Format AED with `Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' })`.

- [ ] **Step 2: Verify & commit**

Run: dev server, Fleet Manager persona → Vehicles. Expect 30 rows, working search/filter, row detail sheet with documents colored by status. `pnpm --filter web typecheck && lint` → PASS.
```bash
git add apps/web/app/(app)/vehicles/page.tsx
git commit -m "feat(fleet): vehicles list with detail sheet"
```

---

## Task 9: Maintenance request pool + assign vendor + permit dashboard

This task delivers the two Fleet Manager hubs. Split into two pages.

**Files:**
- Create: `apps/web/app/(app)/requests/page.tsx`
- Create: `apps/web/app/(app)/permits/page.tsx`

- [ ] **Step 1: Request pool (`/requests`)** (`'use client'`). `<Topbar title='Maintenance Requests' />`. Filter chips/`Select` by status, type, severity. `Table` of `useFleet().requests` (newest first): Vehicle (id + name), Type, Severity, Description (truncated), Submitted by, Created (relative), Status `<StatusBadge>`, Vendor (name or "—"). Row → `Dialog` with full detail incl. photo preview if `photoDataUrl`, and:
  - If `status === 'new'`: a vendor `Select` (options = `vendors`, default = the routing-rule match for the request type) + **Assign** button → `assignVendor(req.id, vendorId)` → `toast('Vendor notified')` → check the Outbox shows the message.
  - If assigned/in_progress: an **Advance status** button → `advanceRequest(req.id)`.
  - Show vendor response (price/visit/notes) when present.

```tsx
// key wiring inside the dialog
const { vendors, config, assignVendor } = useFleet();
const defaultVendor = config.routingRules.find((r) => r.requestType === req.type)?.vendorId ?? vendors[0]?.id;
const [vendorId, setVendorId] = useState(defaultVendor);
// ...
<Button onClick={() => { assignVendor(req.id, vendorId!); toast.success('Vendor notified via WhatsApp'); setOpen(false); }}>
  Assign &amp; notify
</Button>
```

- [ ] **Step 2: Permit dashboard (`/permits`)** (`'use client'`). `<Topbar title='Permits' />`. Compute from `useFleet().documents` + `config`:
  - tiles via `<MetricTiles>`: **Vehicles in use** (count vehicles), **Valid vehicles** (vehicles whose every doc `docStatus !== 'expired'`), **Expiring ≤90d** (vehicles with any doc `expiresWithin(expiry, config.alertWindowFarDays)`), **Expiring ≤60d** (`... alertWindowNearDays`), **Expired** (`tone:'danger'`, vehicles with any expired doc).
  - A **by-document-type** breakdown (small table or cards): for each `DocumentType`, count valid / near / expired.
  - A filterable table: rows = documents that are expired or expiring ≤90d (the actionable list), columns Vehicle, Document (type + emirate), Responsible party, Expiry (+ `daysUntil` like "in 18 days" / "12 days ago"), Status `<StatusBadge>`, Action. Filter `Select` by document type and by status.
  - Row action **Send renewal** → `sendRenewal(doc.id)` → `toast('Renewal request sent to <party>')` → appears in Outbox + creates a RenewalTask. If a renewal already exists for that doc, show its `<StatusBadge>` + an **Advance** button (`advanceRenewal`).

- [ ] **Step 3: Verify against Task 3 aggregates**

Run dev server, Fleet Manager → Permits. **Expect tiles: Expired = 4 vehicles, Expiring ≤60d = 6, Expiring ≤90d = 9, Valid vehicles = 21** (30 − 4 expired − 6 ... note "valid vehicles" counts those with no *expired* doc = 26; "expiring" tiles overlap — confirm the actionable table lists 13 documents: 4 expired + 6 ≤60 + 3 in 61–90). If counts are off, the seed dates in Task 3 are wrong — fix the seed, not the math. Send a renewal → confirm Outbox entry.

- [ ] **Step 4: Verify & commit**

`pnpm --filter web typecheck && lint` → PASS.
```bash
git add apps/web/app/(app)/requests/page.tsx apps/web/app/(app)/permits/page.tsx
git commit -m "feat(fleet): request pool with vendor assignment and permit dashboard"
```

---

## Task 10: Adaptive dashboard + management reports

**Files:**
- Modify: `apps/web/app/(app)/page.tsx`
- Create: `apps/web/app/(app)/reports/page.tsx`
- Modify/replace: `apps/web/components/dashboard/StatCards.tsx` usage (replace template charts with fleet metrics; delete `RevenueChart`/`RecentOrders` if unused, and `lib/mock-data/dashboard.ts`).

- [ ] **Step 1: Adaptive dashboard (`/`)** (`'use client'`). Reads `useFleet()`. Renders combined overview for both `fleet_manager` and `management`:
  - Maintenance `<MetricTiles>`: Total fleet (vehicles.length), Operational (status==='operational'), In maintenance (==='in_maintenance'), Open requests (status !== 'resolved').
  - Permit `<MetricTiles>` (same as Task 9 tiles).
  - A compact "Recent requests" list (reuse the `RecentOrders` card pattern, but map over `requests.slice(0,6)`).
  - A "Attention needed" panel: top expired/near-expiry documents with a link to `/permits`.
  - `<Topbar title={persona === 'management' ? 'Management Overview' : 'Dashboard'} />`.

- [ ] **Step 2: Reports (`/reports`, management)**. Two report cards:
  - **Vendor response time**: table of `vendors` with `avgResponseHours`, count of assigned requests, and a flag (`<StatusBadge>`-style) when `avgResponseHours > 24` ("Delaying"). ProBody (28h) should flag.
  - **Expired documents**: the list of all expired docs (vehicle, doc, party, days overdue) — the "14 of 40" story, here "4 vehicles / N documents".
  - Optional: a single teal `chart` (reuse `@repo/ui/components/chart`) of requests-by-status. Keep to the teal ramp.

- [ ] **Step 3: Verify & commit**

Dev server: Fleet Manager `/` and Management `/` both render; Management → Reports shows the slow vendor flagged. Remove dead template files; `pnpm --filter web typecheck && lint` → PASS.
```bash
git add -A
git commit -m "feat(fleet): adaptive dashboard and management reports"
```

---

## Task 11: Vendor view

**Files:**
- Create: `apps/web/app/(app)/vendor/page.tsx`

- [ ] **Step 1: Fake login gate.** On `/vendor`, if no vendor "session" selected (local component state), show a simple login `Card`: username `Select` (the 4 vendor usernames) + any password + **Log in** button. On submit, set the selected vendor in component state (no real auth). Show a hint: "Demo — any password works."

- [ ] **Step 2: Vendor workspace.** Once "logged in": `<Topbar title={vendor.name} />`. Show requests where `req.vendorId === vendor.id`. Table: Vehicle, Type, Severity, Status, your quote (if any). Row → `Dialog` to **respond**: `quotedPrice` (number input, AED), `visitTime` (`datetime-local` native input), `vendorNotes` (textarea) → `vendorRespond(req.id, {...})` → `toast('Response submitted')`. Status becomes `in_progress`; this is visible back in the Fleet Manager pool.

- [ ] **Step 3: Verify & commit**

Switch persona to Vendor → login as `mechanical` → see assigned requests → submit a quote → switch to Fleet Manager → open that request → see the quote/visit time. `typecheck && lint` → PASS.
```bash
git add apps/web/app/(app)/vendor/page.tsx
git commit -m "feat(fleet): vendor login and request response"
```

---

## Task 12: Driver PWA — scan & asset page

**Files:**
- Create: `apps/web/app/(app)/driver/page.tsx`
- Create: `apps/web/app/(app)/driver/asset/[id]/page.tsx`
- Create: `apps/web/components/fleet/driver/DriverNav.tsx` (bottom tab bar)

- [ ] **Step 1: Driver home (`/driver`)** (`'use client'`, mobile layout — renders inside PhoneFrame). A "Scan vehicle QR" hero `Button` (`QrCode` icon) that opens a `Dialog`/`Sheet` listing vehicles as tappable tiles (faked scan — "Point at the QR inside the fuel flap"). Tapping a vehicle → `router.push('/driver/asset/' + id)`. Below: a small "Recent" list of vehicles. Mobile-first: large touch targets, single column, `text-base`.

- [ ] **Step 2: Asset page (`/driver/asset/[id]`)**. Header with vehicle name/id/plant/mileage and operational `<StatusBadge>`. A "Your ID" `Input` (asset/driver number, stored in component state, prefilled `D-` placeholder) recorded with submissions. Four big action cards: **Report a problem** (→ request flow, Task 13), **Update mileage**, **Log temperature** (only if `coldChain`), **My requests** (filter `requests` by this vehicle). Use `useFleet()` to read the vehicle by `params.id`. If service due (`mileageKm - lastServiceKm >= serviceIntervalKm`), show an amber "Service due" note.

- [ ] **Step 3: DriverNav** — a sticky bottom tab bar (Home, Scan, My Requests) using icons; only shown on driver routes.

- [ ] **Step 4: Verify & commit**

Driver persona → phone frame → scan → pick AG-1003 → asset page shows cold-chain actions (it's a chiller vehicle). `typecheck && lint` → PASS.
```bash
git add apps/web/app/(app)/driver apps/web/components/fleet/driver/DriverNav.tsx
git commit -m "feat(fleet): driver scan and asset page"
```

---

## Task 13: Driver flows — raise request, mileage, temperature, my requests

**Files:**
- Create: `apps/web/components/fleet/driver/RaiseRequestForm.tsx`
- Create: `apps/web/components/fleet/driver/MileageForm.tsx`
- Create: `apps/web/components/fleet/driver/TemperatureForm.tsx`
- Create: `apps/web/components/fleet/driver/MyRequests.tsx`
- Wire these into the asset page action cards (modify `driver/asset/[id]/page.tsx` to open them in a `Sheet`/`Dialog`).

- [ ] **Step 1: RaiseRequestForm** — `react-hook-form` + `zod`. Fields: `type` (`Select`: electrical/mechanical/body/chiller/other — default `chiller` hidden unless coldChain), `severity` (`RadioGroup` or `Select`: low/medium), `description` (`Textarea`, required, min 4 chars), photo (`<input type="file" accept="image/*">` → read to data URL via `FileReader`, show thumbnail). Submit → `submitRequest({ vehicleId, ...values, submittedBy })` → `toast.success('Request submitted')` → close. Validation messages inline (friendly, not raw). The submission lands in the Fleet Manager pool and (per routing) the Outbox.

```tsx
const schema = z.object({
  type: z.enum(['electrical', 'mechanical', 'body', 'chiller', 'other']),
  severity: z.enum(['low', 'medium']),
  description: z.string().min(4, 'Please describe the issue'),
});
```

- [ ] **Step 2: MileageForm** — single number `Input` (current mileage, prefilled with vehicle's `mileageKm`), Submit → `updateMileage(vehicleId, value)`. If new value crosses the next service multiple (`value - lastServiceKm >= serviceIntervalKm`), `toast('Service due — fleet team notified')` (and the asset page service-due note appears).

- [ ] **Step 3: TemperatureForm** (cold-chain only) — number `Input` (°C, allow negatives), Submit → `logTemperature(vehicleId, value)`. If `value > 8` (demo limit), show a red inline warning "Above safe limit" + `toast` warning.

- [ ] **Step 4: MyRequests** — list `requests.filter(r => r.vehicleId === id)` newest-first with `<StatusBadge>` and vendor name when assigned. Empty state friendly.

- [ ] **Step 5: Verify the full loop**

Driver → AG-1007 → Report a problem → electrical / medium / "Right headlight out" / attach any image → submit. Switch to Fleet Manager → Requests → the new request is at top → assign vendor → Outbox shows the WhatsApp. Switch to Vendor (that vendor) → respond with price → back to Fleet Manager → quote visible. `typecheck && lint` → PASS.
```bash
git add apps/web/components/fleet/driver apps/web/app/(app)/driver/asset/[id]/page.tsx
git commit -m "feat(fleet): driver request, mileage, temperature, my-requests flows"
```

---

## Task 14: Config screens + final walkthrough

**Files:**
- Create: `apps/web/app/(app)/config/page.tsx`

- [ ] **Step 1: Config page (`/config`, fleet_manager)** (`'use client'`). `<Topbar title='Configuration' />`. Three sections in `Card`s, all editing local copies of `useFleet().config` / vehicle intervals, with a **Save** button → `updateConfig(...)` / per-vehicle update → `toast('Saved')`:
  - **Routing rules**: table of request type → vendor `Select`. Editing changes which vendor `submitRequest` auto-notifies.
  - **Service intervals**: table of vehicles with an editable `serviceIntervalKm` number input (or a representative subset — note clearly if limited; do all 30, it's cheap).
  - **Permit alert windows**: two number inputs (near=60, far=90) bound to `alertWindowNearDays`/`alertWindowFarDays`. Changing these re-drives the permit dashboard tiles.

- [ ] **Step 2: Verify config affects behavior**

Change electrical routing to a different vendor → save → submit a new electrical request as Driver → Outbox notifies the new vendor. Change alert window far to 120 → Permits "Expiring ≤90d" tile relabels/recounts. (If you make the window label dynamic, use the config value in the label.)

- [ ] **Step 3: Full demo walkthrough (the acceptance check)**

With `pnpm --filter web dev`, click through end-to-end and confirm each:
1. **Permits story** — Fleet Manager → Permits opens on **4 expired / 6 ≤60d / 9 ≤90d**; send a renewal; it appears in Outbox + tracker.
2. **Maintenance loop** — Driver scans → raises request → Fleet Manager pool → assign vendor (Outbox) → Vendor responds → status flows back.
3. **Management** — read-only dashboards + Reports flag the slow vendor.
4. **Persona switch** — Driver renders in phone frame; others in web shell.
5. **Reset demo** — restores seed (the 4/6/9 permit counts return; submitted requests cleared).
6. No console errors; responsive at mobile + desktop widths; dark-mode toggle works.

- [ ] **Step 4: Final verify & commit**

Run: `pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build` → all PASS.
```bash
git add -A
git commit -m "feat(fleet): configuration screens and final demo polish"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** Driver PWA (scan, request, mileage, temp, follow-up) → Tasks 12–13. Fleet Manager (pool, assign, permit dashboard, renewals, track) → Task 9. Management (dashboards, reports) → Task 10. Vendor (login, assigned fleet, respond) → Task 11. Config (routing, intervals, alert windows) → Task 14. Persona switcher + phone frame + Outbox (faked notifications) → Tasks 5–6. Mock data incl. master fields + 5 doc types + chiller + hero stat → Task 3. Branding/teal/out-of-scope → Tasks 5–6 + conventions. All spec sections map to a task.

**Placeholder scan:** No "TBD/TODO". Presentational markup is specified by component contract + shadcn parts + key snippets rather than full JSX — intentional for a prototype where the executor has the component library and conventions; all *logic-bearing* code (types, status math, store actions, key wiring) is complete. Seed data rows are specified by shape + exact target aggregates + example rows (executor fills 30 believable rows).

**Type consistency:** Action names (`submitRequest`, `assignVendor`, `advanceRequest`, `sendRenewal`, `advanceRenewal`, `vendorRespond`, `updateMileage`, `logTemperature`, `updateConfig`, `resetDemo`, `setPersona`) and the `useFleet()` hook are defined in Task 4 and used consistently in Tasks 8–14. Types from Task 1 (`Persona`, `Vehicle`, `VehicleDocument`, `MaintenanceRequest`, `Vendor`, `RenewalTask`, `OutboxMessage`, `DemoConfig`) referenced consistently. `docStatus`/`expiresWithin`/`daysUntil`/`DEMO_TODAY` from Task 2 used in Tasks 8–10.
