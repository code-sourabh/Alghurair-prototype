'use client';

import { useFleet } from '@/lib/fleet/store';
import { StatusBadge } from '@/components/fleet/StatusBadge';
import { REQUEST_TYPE_LABELS } from '@/lib/fleet/labels';

interface MyRequestsProps {
  vehicleId?: string;
}

export function MyRequests({ vehicleId }: MyRequestsProps) {
  const { requests, vendors } = useFleet();

  const filtered = [...requests]
    .filter((r) => (vehicleId ? r.vehicleId === vehicleId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filtered.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        No requests yet. Tap &ldquo;Report a problem&rdquo; to raise one.
      </p>
    );
  }

  return (
    <ul className='flex flex-col gap-3'>
      {filtered.map((r) => {
        const vendor = vendors.find((v) => v.id === r.vendorId);
        return (
          <li key={r.id} className='rounded-lg border bg-card p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-medium'>{REQUEST_TYPE_LABELS[r.type]}</span>
                <span className='text-xs text-muted-foreground'>{r.vehicleId}</span>
                <p className='text-sm'>{r.description}</p>
                {vendor && <span className='text-xs text-muted-foreground'>Vendor: {vendor.name}</span>}
              </div>
              <StatusBadge status={r.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
