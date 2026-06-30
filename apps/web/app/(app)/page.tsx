'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { useFleet } from '@/lib/fleet/store';
import { daysUntil, expiresWithin, docStatus } from '@/lib/fleet/permit-status';
import type { DocumentType, VehicleDocument } from '@/lib/fleet/types';

import { Topbar } from '@/components/app-shell/Topbar';
import { MetricTiles } from '@/components/fleet/MetricTiles';
import { StatusBadge } from '@/components/fleet/StatusBadge';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';

const DOC_LABELS: Record<DocumentType, string> = {
  road_permit: 'Road permit',
  license: 'License',
  trailer: 'Trailer',
  branding: 'Branding',
  mulkea: 'Mulkea',
  chiller: 'Chiller',
};

function docLabel(d: VehicleDocument): string {
  return `${DOC_LABELS[d.type]}${d.emirate ? ' — ' + d.emirate : ''}`;
}

function relativeDays(expiry: string): string {
  const n = daysUntil(expiry);
  return n < 0 ? `${Math.abs(n)} days ago` : `in ${n} days`;
}

export default function DashboardPage() {
  const { persona, vehicles, requests, documents, config } = useFleet();

  // ── Maintenance tiles ──────────────────────────────────────────────────
  const maintenanceTiles = useMemo(
    () => [
      { label: 'Total fleet', value: vehicles.length },
      { label: 'Operational', value: vehicles.filter((v) => v.status === 'operational').length },
      { label: 'In maintenance', value: vehicles.filter((v) => v.status === 'in_maintenance').length },
      { label: 'Open requests', value: requests.filter((r) => r.status !== 'resolved').length },
    ],
    [vehicles, requests],
  );

  // ── Permit tiles (per-vehicle, mirrors permits page) ───────────────────
  const permitTiles = useMemo(() => {
    const docsByVehicle = new Map<string, VehicleDocument[]>();
    for (const d of documents) {
      const arr = docsByVehicle.get(d.vehicleId) ?? [];
      arr.push(d);
      docsByVehicle.set(d.vehicleId, arr);
    }

    let expiringFar = 0;
    let expiringNear = 0;
    let expiredVehicles = 0;
    let validVehicles = 0;

    for (const v of vehicles) {
      const docs = docsByVehicle.get(v.id) ?? [];
      const hasExpired = docs.some((d) => docStatus(d.expiry) === 'expired');
      if (docs.some((d) => expiresWithin(d.expiry, config.alertWindowFarDays))) expiringFar++;
      if (docs.some((d) => expiresWithin(d.expiry, config.alertWindowNearDays))) expiringNear++;
      if (hasExpired) expiredVehicles++;
      else validVehicles++;
    }

    return [
      { label: `Expiring ≤${config.alertWindowFarDays}d`, value: expiringFar },
      { label: `Expiring ≤${config.alertWindowNearDays}d`, value: expiringNear },
      { label: 'Expired', value: expiredVehicles, tone: 'danger' as const },
      { label: 'Valid vehicles', value: validVehicles },
    ];
  }, [vehicles, documents, config]);

  // ── Recent requests (6 newest) ─────────────────────────────────────────
  const recentRequests = useMemo(
    () => [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [requests],
  );

  // ── Attention needed: expired + near-expiry docs (up to 6) ────────────
  const attentionDocs = useMemo(() => {
    return documents
      .filter((d) => daysUntil(d.expiry) < 0 || expiresWithin(d.expiry, config.alertWindowFarDays))
      .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))
      .slice(0, 6);
  }, [documents, config.alertWindowFarDays]);

  return (
    <>
      <Topbar title={persona === 'management' ? 'Management Overview' : 'Dashboard'} />
      <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        {/* Maintenance section */}
        <section aria-labelledby='maintenance-heading'>
          <h2
            id='maintenance-heading'
            className='text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide'
          >
            Maintenance
          </h2>
          <MetricTiles tiles={maintenanceTiles} />
        </section>

        {/* Permits section */}
        <section aria-labelledby='permits-heading'>
          <h2 id='permits-heading' className='text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide'>
            Permits
          </h2>
          <MetricTiles tiles={permitTiles} />
        </section>

        {/* Two-column cards */}
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Recent requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent requests</CardTitle>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No requests yet.</p>
              ) : (
                <ul className='divide-y'>
                  {recentRequests.map((r) => (
                    <li key={r.id} className='flex items-center justify-between gap-3 py-2'>
                      <div className='min-w-0'>
                        <span className='font-mono text-sm'>{r.vehicleId}</span>
                        <span className='text-muted-foreground ml-2 truncate text-sm'>{r.description}</span>
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Attention needed */}
          <Card>
            <CardHeader>
              <CardTitle>Attention needed</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              {attentionDocs.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No documents require attention.</p>
              ) : (
                <ul className='divide-y'>
                  {attentionDocs.map((d) => (
                    <li key={d.id} className='flex items-center justify-between gap-3 py-2'>
                      <div className='min-w-0'>
                        <span className='font-mono text-sm'>{d.vehicleId}</span>
                        <span className='text-muted-foreground ml-2 text-sm'>{docLabel(d)}</span>
                        <span className='text-muted-foreground ml-1 text-xs'>· {relativeDays(d.expiry)}</span>
                      </div>
                      <StatusBadge status={docStatus(d.expiry)} />
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant='outline' size='sm' className='self-start'>
                <Link href='/permits'>View all permits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
