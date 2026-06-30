'use client';

import { useState } from 'react';
import { Snowflake } from 'lucide-react';

import { useFleet } from '@/lib/fleet/store';
import { docStatus } from '@/lib/fleet/permit-status';
import type { Vehicle, VehicleType, DocumentType } from '@/lib/fleet/types';
import { StatusBadge } from '@/components/fleet/StatusBadge';
import { Topbar } from '@/components/app-shell/Topbar';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@repo/ui/components/sheet';
import { Input } from '@repo/ui/components/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/components/select';

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  big_truck: 'Big truck',
  small_truck: 'Small truck',
  van: 'Van',
  tickle_truck: 'Tickle truck',
  tanker: 'Tanker',
  equipment: 'Equipment',
};

const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABEL) as VehicleType[];

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  road_permit: 'Road permit',
  license: 'License',
  trailer: 'Trailer',
  branding: 'Branding',
  mulkea: 'Mulkea',
  chiller: 'Chiller',
};

const aed = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
});

export default function VehiclesPage() {
  const { vehicles, documents } = useFleet();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | VehicleType>('all');
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.plant.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || v.type === typeFilter;
    return matchSearch && matchType;
  });

  const selectedDocs = selected ? documents.filter((d) => d.vehicleId === selected.id) : [];

  const serviceDue = selected && selected.mileageKm - selected.lastServiceKm >= selected.serviceIntervalKm;

  return (
    <>
      <Topbar title='Vehicles' />
      <main className='flex flex-1 flex-col gap-4 p-4 md:p-6'>
        {/* Controls */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Input
            placeholder='Search by ID, name, or plant…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | VehicleType)}>
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {VEHICLE_TYPE_LABEL[t]}
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
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Cold-chain</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id} className='cursor-pointer' onClick={() => setSelected(v)}>
                  <TableCell className='font-mono text-sm'>{v.id}</TableCell>
                  <TableCell>
                    <div>{v.name}</div>
                    <div className='text-muted-foreground text-xs'>{v.model}</div>
                  </TableCell>
                  <TableCell>{VEHICLE_TYPE_LABEL[v.type]}</TableCell>
                  <TableCell>{v.plant}</TableCell>
                  <TableCell>{v.mileageKm.toLocaleString()} km</TableCell>
                  <TableCell>
                    {v.coldChain ? (
                      <Snowflake className='text-primary h-4 w-4' />
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='text-muted-foreground text-center'>
                    No vehicles match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Detail Sheet */}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.id} — {selected.name}
                </SheetTitle>
                <SheetDescription>Vehicle master data &amp; documents</SheetDescription>
              </SheetHeader>

              {/* Master data grid */}
              <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                {(
                  [
                    ['Model', selected.model],
                    ['Type', VEHICLE_TYPE_LABEL[selected.type]],
                    ['Year', selected.year],
                    ['Age', `${selected.ageYears} yrs`],
                    ['Plant', selected.plant],
                    ['Status', <StatusBadge key='status' status={selected.status} />],
                    ['Mileage', `${selected.mileageKm.toLocaleString()} km`],
                    ['Service interval', `${selected.serviceIntervalKm.toLocaleString()} km`],
                    ['Purchase price', aed.format(selected.purchasePrice)],
                    ['Current value', aed.format(selected.currentValue)],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className='text-muted-foreground text-xs font-medium'>{label}</dt>
                    <dd className='mt-0.5'>{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Service due notice */}
              {serviceDue && (
                <p className='text-destructive mt-3 text-sm font-medium'>
                  Service overdue — {(selected.mileageKm - selected.lastServiceKm).toLocaleString()} km since last
                  service.
                </p>
              )}
              {!serviceDue && (
                <p className='text-muted-foreground mt-3 text-sm'>
                  Next service in{' '}
                  {(selected.serviceIntervalKm - (selected.mileageKm - selected.lastServiceKm)).toLocaleString()} km.
                </p>
              )}

              {/* Documents */}
              <h3 className='mt-6 mb-2 text-sm font-semibold'>Documents</h3>
              {selectedDocs.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No documents on record.</p>
              ) : (
                <div className='flex flex-col gap-2'>
                  {selectedDocs.map((d) => (
                    <div
                      key={d.id}
                      className='flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'
                    >
                      <div>
                        <div className='font-medium'>
                          {DOC_TYPE_LABEL[d.type]}
                          {d.emirate ? ` — ${d.emirate}` : ''}
                        </div>
                        <div className='text-muted-foreground text-xs'>Expires {d.expiry}</div>
                      </div>
                      <StatusBadge status={docStatus(d.expiry)} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
