// apps/web/lib/fleet/store.tsx
'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { localStore, mockId } from '@/lib/mock';
import { vehicles as seedVehicles } from './data/vehicles';
import { documents as seedDocuments } from './data/documents';
import { vendors as seedVendors } from './data/vendors';
import { seedRequests } from './data/requests';
import { seedConfig } from './data/config';
import type {
  Persona,
  Vehicle,
  VehicleDocument,
  Vendor,
  MaintenanceRequest,
  RenewalTask,
  OutboxMessage,
  DemoConfig,
  RequestType,
  Severity,
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
    vehicles: seedVehicles,
    documents: seedDocuments,
    vendors: seedVendors,
    requests: seedRequests,
    renewals: [],
    outbox: [],
    config: seedConfig,
  };
}

interface FleetContextValue extends PersistedState {
  persona: Persona;
  setPersona: (p: Persona) => void;
  submitRequest: (input: {
    vehicleId: string;
    type: RequestType;
    severity: Severity;
    description: string;
    photoDataUrl?: string;
    submittedBy: string;
  }) => MaintenanceRequest;
  updateMileage: (vehicleId: string, mileageKm: number) => void;
  logTemperature: (vehicleId: string, tempC: number) => void;
  assignVendor: (requestId: string, vendorId: string) => void;
  advanceRequest: (requestId: string) => void;
  sendRenewal: (documentId: string) => void;
  advanceRenewal: (renewalId: string) => void;
  updateConfig: (config: DemoConfig) => void;
  vendorRespond: (requestId: string, input: { quotedPrice: number; visitTime: string; vendorNotes?: string }) => void;
  resetDemo: () => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: ReactNode }) {
  // Initialize from seed on BOTH server and first client render so the SSR markup
  // matches (no hydration mismatch); hydrate persisted demo state after mount.
  const [persona, setPersonaState] = useState<Persona>('fleet_manager');
  const [state, setState] = useState<PersistedState>(seed);

  const firstPersist = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe post-mount hydration of persisted demo state
    setState(localStore.get<PersistedState>(STORE_KEY, seed()));
    const p = localStore.get<Persona | null>(STORE_KEY + ':persona', null);
    if (p) setPersonaState(p);
  }, []);

  useEffect(() => {
    // Skip the first run (seed) so we never transiently overwrite persisted state before hydration lands.
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    localStore.set(STORE_KEY, state);
  }, [state]);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    localStore.set(STORE_KEY + ':persona', p);
  };

  const now = () => new Date().toISOString();
  const vendorName = (id?: string) => state.vendors.find((v) => v.id === id)?.name ?? 'vendor';
  const vehicleLabel = (id: string) => {
    const v = state.vehicles.find((x) => x.id === id);
    return v ? `${v.id} (${v.name}) @ ${v.plant}` : id;
  };

  const submitRequest: FleetContextValue['submitRequest'] = (input) => {
    const req: MaintenanceRequest = { id: mockId('req'), createdAt: now(), status: 'new', ...input };
    const rule = state.config.routingRules.find((r) => r.requestType === input.type);
    const out: OutboxMessage[] = rule
      ? [
          {
            id: mockId('out'),
            channel: 'whatsapp',
            to: vendorName(rule.vendorId),
            subject: `New ${input.severity} ${input.type} request`,
            body: `Vehicle ${vehicleLabel(input.vehicleId)} — "${input.description}". Please propose a visit time.`,
            sentAt: now(),
            relatedId: req.id,
          },
        ]
      : [];
    setState((s) => ({ ...s, requests: [req, ...s.requests], outbox: [...out, ...s.outbox] }));
    return req;
  };

  const assignVendor: FleetContextValue['assignVendor'] = (requestId, vendorId) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, vendorId, status: 'assigned' } : r)),
      outbox: [
        {
          id: mockId('out'),
          channel: 'whatsapp',
          to: vendorName(vendorId),
          subject: 'Request assigned to you',
          body: `Vehicle ${vehicleLabel(s.requests.find((r) => r.id === requestId)?.vehicleId ?? '')} assigned. Please propose a visit time.`,
          sentAt: now(),
          relatedId: requestId,
        },
        ...s.outbox,
      ],
    }));
  };

  const advanceRequest: FleetContextValue['advanceRequest'] = (requestId) => {
    const next = { new: 'assigned', assigned: 'in_progress', in_progress: 'resolved', resolved: 'resolved' } as const;
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, status: next[r.status] } : r)),
    }));
  };

  const updateMileage: FleetContextValue['updateMileage'] = (vehicleId, mileageKm) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, mileageKm } : v)) }));
  };

  const logTemperature: FleetContextValue['logTemperature'] = (vehicleId, tempC) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, lastTempC: tempC } : v)) }));
  };

  const sendRenewal: FleetContextValue['sendRenewal'] = (documentId) => {
    const doc = state.documents.find((d) => d.id === documentId);
    if (!doc) return;
    const renewal: RenewalTask = {
      id: mockId('rnw'),
      documentId,
      vehicleId: doc.vehicleId,
      responsibleParty: doc.responsibleParty,
      sentAt: now(),
      status: 'sent',
    };
    setState((s) => ({
      ...s,
      renewals: [renewal, ...s.renewals],
      outbox: [
        {
          id: mockId('out'),
          channel: 'email',
          to: doc.responsibleParty,
          subject: `Renewal needed: ${doc.type}${doc.emirate ? ' (' + doc.emirate + ')' : ''}`,
          body: `Document for ${vehicleLabel(doc.vehicleId)} expires ${doc.expiry}. Please renew and confirm.`,
          sentAt: now(),
          relatedId: renewal.id,
        },
        ...s.outbox,
      ],
    }));
  };

  const advanceRenewal: FleetContextValue['advanceRenewal'] = (renewalId) => {
    const next = { sent: 'in_progress', in_progress: 'renewed', renewed: 'renewed' } as const;
    setState((s) => ({
      ...s,
      renewals: s.renewals.map((r) => (r.id === renewalId ? { ...r, status: next[r.status] } : r)),
    }));
  };

  const vendorRespond: FleetContextValue['vendorRespond'] = (requestId, input) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, ...input, status: 'in_progress' } : r)),
    }));
  };

  const updateConfig: FleetContextValue['updateConfig'] = (config) => setState((s) => ({ ...s, config }));

  const resetDemo = () => {
    setState(seed());
    setPersona('fleet_manager');
  };

  return (
    <FleetContext.Provider
      value={{
        ...state,
        persona,
        setPersona,
        submitRequest,
        updateMileage,
        logTemperature,
        assignVendor,
        advanceRequest,
        sendRenewal,
        advanceRenewal,
        updateConfig,
        vendorRespond,
        resetDemo,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
}
