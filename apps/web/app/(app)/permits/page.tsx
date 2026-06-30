'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import { daysUntil, expiresWithin, docStatus } from '@/lib/fleet/permit-status';
import { formatDate } from '@/lib/fleet/format';
import type { DocumentType, VehicleDocument } from '@/lib/fleet/types';
import { DOC_LABELS } from '@/lib/fleet/labels';

import { Topbar } from '@/components/app-shell/Topbar';
import { MetricTiles } from '@/components/fleet/MetricTiles';
import { StatusBadge } from '@/components/fleet/StatusBadge';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Button } from '@repo/ui/components/button';

const DOC_TYPES = Object.keys(DOC_LABELS) as DocumentType[];

function docLabel(d: VehicleDocument): string {
  return `${DOC_LABELS[d.type]}${d.emirate ? ' — ' + d.emirate : ''}`;
}

function relativeDays(expiry: string): string {
  const n = daysUntil(expiry);
  return n < 0 ? `${Math.abs(n)} days ago` : `in ${n} days`;
}

export default function PermitsPage() {
  const { vehicles, documents, renewals, config, sendRenewal, advanceRenewal } = useFleet();

  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'near_expiry'>('all');

  // Build vehicles map for name lookups
  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  // ── Tile metrics (per-vehicle) ──────────────────────────────────────────
  const docsByVehicle = useMemo(() => {
    const m = new Map<string, VehicleDocument[]>();
    for (const d of documents) {
      const arr = m.get(d.vehicleId) ?? [];
      arr.push(d);
      m.set(d.vehicleId, arr);
    }
    return m;
  }, [documents]);

  const tiles = useMemo(() => {
    let validVehicles = 0;
    let expiringFar = 0;
    let expiringNear = 0;
    let expiredVehicles = 0;

    for (const v of vehicles) {
      const docs = docsByVehicle.get(v.id) ?? [];
      const hasExpired = docs.some((d) => docStatus(d.expiry) === 'expired');
      const hasNear = docs.some((d) => expiresWithin(d.expiry, config.alertWindowNearDays));
      const hasFar = docs.some((d) => expiresWithin(d.expiry, config.alertWindowFarDays));

      if (!hasExpired) validVehicles++;
      if (hasFar) expiringFar++;
      if (hasNear) expiringNear++;
      if (hasExpired) expiredVehicles++;
    }

    return [
      { label: 'Vehicles in use', value: vehicles.length },
      { label: 'Valid vehicles', value: validVehicles, hint: 'no expired documents' },
      { label: `Expiring ≤${config.alertWindowFarDays}d`, value: expiringFar },
      { label: `Expiring ≤${config.alertWindowNearDays}d`, value: expiringNear },
      { label: 'Expired', value: expiredVehicles, tone: 'danger' as const },
    ];
  }, [vehicles, docsByVehicle, config]);

  // ── By-type breakdown ───────────────────────────────────────────────────
  const byType = useMemo(() => {
    const counts: Record<DocumentType, { valid: number; near: number; expired: number }> = {
      road_permit: { valid: 0, near: 0, expired: 0 },
      license: { valid: 0, near: 0, expired: 0 },
      trailer: { valid: 0, near: 0, expired: 0 },
      branding: { valid: 0, near: 0, expired: 0 },
      mulkea: { valid: 0, near: 0, expired: 0 },
      chiller: { valid: 0, near: 0, expired: 0 },
    };
    for (const d of documents) {
      const s = docStatus(d.expiry);
      if (s === 'expired') counts[d.type].expired++;
      else if (s === 'near_expiry') counts[d.type].near++;
      else counts[d.type].valid++;
    }
    return counts;
  }, [documents]);

  // ── Action table ────────────────────────────────────────────────────────
  const actionDocs = useMemo(() => {
    return documents
      .filter((d) => daysUntil(d.expiry) < 0 || expiresWithin(d.expiry, config.alertWindowFarDays))
      .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));
  }, [documents, config.alertWindowFarDays]);

  const filteredActionDocs = useMemo(() => {
    return actionDocs.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (statusFilter !== 'all' && docStatus(d.expiry, config.alertWindowFarDays) !== statusFilter) return false;
      return true;
    });
  }, [actionDocs, typeFilter, statusFilter, config.alertWindowFarDays]);

  const renewalMap = useMemo(() => new Map(renewals.map((r) => [r.documentId, r])), [renewals]);

  return (
    <>
      <Topbar title='Permits' />
      <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        {/* Summary tiles */}
        <MetricTiles tiles={tiles} />

        {/* By-type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>By document type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className='text-right'>Valid</TableHead>
                    <TableHead className='text-right'>Near expiry</TableHead>
                    <TableHead className='text-right'>Expired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DOC_TYPES.map((type) => {
                    const c = byType[type];
                    return (
                      <TableRow key={type}>
                        <TableCell className='font-medium'>{DOC_LABELS[type]}</TableCell>
                        <TableCell className='text-right'>
                          {c.valid === 0 ? <span className='text-muted-foreground'>0</span> : c.valid}
                        </TableCell>
                        <TableCell className='text-right'>
                          {c.near === 0 ? <span className='text-muted-foreground'>0</span> : c.near}
                        </TableCell>
                        <TableCell className='text-right'>
                          {c.expired === 0 ? (
                            <span className='text-muted-foreground'>0</span>
                          ) : (
                            <span className='text-destructive font-medium'>{c.expired}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action needed */}
        <Card>
          <CardHeader>
            <CardTitle>Action needed</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {/* Filters */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | DocumentType)}>
                <SelectTrigger className='w-48' aria-label='Filter by document type'>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DOC_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'expired' | 'near_expiry')}
              >
                <SelectTrigger className='w-44' aria-label='Filter by status'>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                  <SelectItem value='near_expiry'>Near expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Responsible party</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActionDocs.map((d) => {
                    const vehicle = vehicleMap.get(d.vehicleId);
                    const renewal = renewalMap.get(d.id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className='font-mono text-sm'>{d.vehicleId}</div>
                          {vehicle && <div className='text-muted-foreground text-xs'>{vehicle.name}</div>}
                        </TableCell>
                        <TableCell>{docLabel(d)}</TableCell>
                        <TableCell>{d.responsibleParty}</TableCell>
                        <TableCell>
                          <div>{formatDate(d.expiry)}</div>
                          <div className='text-muted-foreground text-xs'>{relativeDays(d.expiry)}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={docStatus(d.expiry, config.alertWindowFarDays)} />
                        </TableCell>
                        <TableCell>
                          {renewal ? (
                            <div className='flex items-center gap-2'>
                              <StatusBadge status={renewal.status} />
                              {renewal.status !== 'renewed' && (
                                <Button size='sm' variant='outline' onClick={() => advanceRenewal(renewal.id)}>
                                  Advance
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Button
                              size='sm'
                              onClick={() => {
                                sendRenewal(d.id);
                                toast.success('Renewal request sent to ' + d.responsibleParty);
                              }}
                            >
                              Send renewal
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredActionDocs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='text-muted-foreground text-center'>
                        No documents match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
