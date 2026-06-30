'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import { formatAED, formatDate } from '@/lib/fleet/format';
import type { MaintenanceRequest, RequestStatus, RequestType, Severity } from '@/lib/fleet/types';
import { REQUEST_TYPE_LABELS, SEVERITY_LABELS } from '@/lib/fleet/labels';
import { StatusBadge } from '@/components/fleet/StatusBadge';
import { Topbar } from '@/components/app-shell/Topbar';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/components/select';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';

// ── Labels ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

// ── Page ────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const { requests, vehicles, vendors, config, assignVendor, advanceRequest } = useFleet();

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | RequestType>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  // Vendor select local state for the detail dialog
  const [dialogVendorId, setDialogVendorId] = useState<string>('');

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const filtered = useMemo(
    () =>
      [...requests]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((r) => {
          if (statusFilter !== 'all' && r.status !== statusFilter) return false;
          if (typeFilter !== 'all' && r.type !== typeFilter) return false;
          if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
          return true;
        }),
    [requests, statusFilter, typeFilter, severityFilter],
  );

  function openDialog(r: MaintenanceRequest) {
    const defaultVendor =
      config.routingRules.find((rule) => rule.requestType === r.type)?.vendorId ?? vendors[0]?.id ?? '';
    setDialogVendorId(defaultVendor);
    setSelected(r);
  }

  function handleAssign() {
    if (!selected) return;
    assignVendor(selected.id, dialogVendorId);
    toast.success('Vendor notified via WhatsApp');
    setSelected(null);
  }

  function handleAdvance() {
    if (!selected) return;
    advanceRequest(selected.id);
    setSelected(null);
  }

  const selectedVehicle = selected ? vehicleMap.get(selected.vehicleId) : null;

  return (
    <>
      <Topbar title='Maintenance Requests' />
      <main className='flex flex-1 flex-col gap-4 p-4 md:p-6'>
        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | RequestStatus)}>
            <SelectTrigger className='w-40' aria-label='Filter by status'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | RequestType)}>
            <SelectTrigger className='w-40' aria-label='Filter by type'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {REQUEST_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as 'all' | Severity)}>
            <SelectTrigger className='w-36' aria-label='Filter by severity'>
              <SelectValue placeholder='All severities' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All severities</SelectItem>
              {(Object.keys(SEVERITY_LABELS) as Severity[]).map((sv) => (
                <SelectItem key={sv} value={sv}>
                  {SEVERITY_LABELS[sv]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const v = vehicleMap.get(r.vehicleId);
                return (
                  <TableRow
                    key={r.id}
                    className='cursor-pointer'
                    role='button'
                    tabIndex={0}
                    onClick={() => openDialog(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openDialog(r);
                      if (e.key === ' ') {
                        e.preventDefault();
                        openDialog(r);
                      }
                    }}
                  >
                    <TableCell>
                      <div className='font-mono text-sm'>{r.vehicleId}</div>
                      {v && <div className='text-muted-foreground text-xs'>{v.name}</div>}
                    </TableCell>
                    <TableCell>{REQUEST_TYPE_LABELS[r.type]}</TableCell>
                    <TableCell>
                      {r.severity === 'medium' ? (
                        <Badge variant='outline' className='border-destructive/40 text-destructive'>
                          {SEVERITY_LABELS[r.severity]}
                        </Badge>
                      ) : (
                        <Badge variant='secondary'>{SEVERITY_LABELS[r.severity]}</Badge>
                      )}
                    </TableCell>
                    <TableCell className='max-w-[280px] truncate'>{r.description}</TableCell>
                    <TableCell>{r.submittedBy}</TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.vendorId ? (vendorMap.get(r.vendorId)?.name ?? '—') : '—'}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className='text-muted-foreground text-center'>
                    No requests match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.vehicleId} — {REQUEST_TYPE_LABELS[selected.type]}
                </DialogTitle>
                <DialogDescription>
                  {selectedVehicle ? `${selectedVehicle.name} · ${selectedVehicle.plant}` : selected.vehicleId}
                </DialogDescription>
              </DialogHeader>

              {/* Meta grid */}
              <dl className='mt-2 grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium'>Severity</dt>
                  <dd className='mt-0.5'>
                    {selected.severity === 'medium' ? (
                      <Badge variant='outline' className='border-destructive/40 text-destructive'>
                        {SEVERITY_LABELS[selected.severity]}
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>{SEVERITY_LABELS[selected.severity]}</Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium'>Status</dt>
                  <dd className='mt-0.5'>
                    <StatusBadge status={selected.status} />
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium'>Submitted by</dt>
                  <dd className='mt-0.5'>{selected.submittedBy}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium'>Created</dt>
                  <dd className='mt-0.5'>{formatDate(selected.createdAt)}</dd>
                </div>
                {selected.vendorId && (
                  <div>
                    <dt className='text-muted-foreground text-xs font-medium'>Assigned vendor</dt>
                    <dd className='mt-0.5'>{vendorMap.get(selected.vendorId)?.name ?? selected.vendorId}</dd>
                  </div>
                )}
              </dl>

              {/* Description */}
              <div className='mt-3'>
                <p className='text-muted-foreground text-xs font-medium'>Description</p>
                <p className='mt-1 text-sm'>{selected.description}</p>
              </div>

              {/* Photo */}
              {selected.photoDataUrl && (
                <img
                  src={selected.photoDataUrl}
                  alt='Maintenance request photo'
                  className='mt-3 max-h-48 rounded-md border object-contain'
                />
              )}

              {/* Vendor response block */}
              {(selected.quotedPrice !== undefined || selected.visitTime || selected.vendorNotes) && (
                <div className='mt-4 rounded-md border p-3'>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide'>Vendor response</p>
                  <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                    {selected.quotedPrice !== undefined && (
                      <div>
                        <dt className='text-muted-foreground text-xs'>Quote</dt>
                        <dd>{formatAED(selected.quotedPrice)}</dd>
                      </div>
                    )}
                    {selected.visitTime && (
                      <div>
                        <dt className='text-muted-foreground text-xs'>Visit</dt>
                        <dd>{formatDate(selected.visitTime)}</dd>
                      </div>
                    )}
                    {selected.vendorNotes && (
                      <div className='col-span-2'>
                        <dt className='text-muted-foreground text-xs'>Notes</dt>
                        <dd>{selected.vendorNotes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Action area */}
              <DialogFooter className='mt-4 flex-col gap-2 sm:flex-row'>
                {selected.status === 'new' && (
                  <>
                    <div className='flex flex-1 flex-col gap-1'>
                      <label htmlFor='vendor-select' className='text-xs font-medium'>
                        Assign vendor
                      </label>
                      <Select value={dialogVendorId} onValueChange={setDialogVendorId}>
                        <SelectTrigger id='vendor-select' className='w-full'>
                          <SelectValue placeholder='Select vendor' />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAssign} disabled={!dialogVendorId} className='self-end'>
                      Assign &amp; notify
                    </Button>
                  </>
                )}
                {(selected.status === 'assigned' || selected.status === 'in_progress') && (
                  <Button onClick={handleAdvance}>Advance status</Button>
                )}
                {selected.status === 'resolved' && (
                  <p className='text-muted-foreground self-center text-sm'>Resolved — no further action needed.</p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
