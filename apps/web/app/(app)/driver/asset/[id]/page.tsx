'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wrench, Gauge, Thermometer, ClipboardList, Snowflake } from 'lucide-react';

import { useFleet } from '@/lib/fleet/store';
import { formatKm } from '@/lib/fleet/format';
import { StatusBadge } from '@/components/fleet/StatusBadge';
import { DriverNav } from '@/components/fleet/driver/DriverNav';
import { RaiseRequestForm } from '@/components/fleet/driver/RaiseRequestForm';
import { MileageForm } from '@/components/fleet/driver/MileageForm';
import { TemperatureForm } from '@/components/fleet/driver/TemperatureForm';
import { MyRequests } from '@/components/fleet/driver/MyRequests';

import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';

type ActiveSheet = 'report' | 'mileage' | 'temperature' | 'requests' | null;

export default function AssetPage() {
  const { id } = useParams<{ id: string }>();
  const { vehicles } = useFleet();
  const vehicle = vehicles.find((v) => v.id === id);

  const [yourId, setYourId] = useState('D-');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  if (!vehicle) {
    return (
      <div className='flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center'>
        <p className='text-base font-medium'>Vehicle not found</p>
        <p className='text-sm text-muted-foreground'>No vehicle with ID &ldquo;{id}&rdquo; exists.</p>
        <Link href='/driver' className='text-sm text-primary underline underline-offset-4'>
          Back to home
        </Link>
      </div>
    );
  }

  const serviceDue = vehicle.mileageKm - vehicle.lastServiceKm >= vehicle.serviceIntervalKm;

  const actions = [
    { key: 'report' as const, label: 'Report a problem', icon: Wrench, show: true },
    { key: 'mileage' as const, label: 'Update mileage', icon: Gauge, show: true },
    { key: 'temperature' as const, label: 'Log temperature', icon: Thermometer, show: vehicle.coldChain },
    { key: 'requests' as const, label: 'My requests', icon: ClipboardList, show: true },
  ] as const;

  return (
    <div className='flex min-h-full flex-col'>
      {/* Mobile header */}
      <header className='flex items-center gap-3 border-b px-3 py-3'>
        <Link
          href='/driver'
          aria-label='Back to home'
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-muted'
        >
          <ChevronLeft className='size-5' />
        </Link>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>{vehicle.id}</p>
          <h1 className='truncate text-base font-semibold'>{vehicle.name}</h1>
        </div>
      </header>

      <main className='flex flex-1 flex-col gap-4 p-4'>
        {/* Summary card */}
        <Card>
          <CardContent className='pt-4'>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
              <div>
                <dt className='text-xs text-muted-foreground'>Type</dt>
                <dd className='font-medium capitalize'>{vehicle.type.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Plant</dt>
                <dd className='font-medium'>{vehicle.plant}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Mileage</dt>
                <dd className='font-medium'>{formatKm(vehicle.mileageKm)}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Status</dt>
                <dd>
                  <StatusBadge status={vehicle.status} />
                </dd>
              </div>
            </dl>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              {vehicle.coldChain && (
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Snowflake className='size-3.5' />
                  Cold-chain
                </span>
              )}
              {serviceDue && <span className='text-xs font-medium text-destructive'>Service due</span>}
            </div>
          </CardContent>
        </Card>

        {/* Driver / asset ID */}
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='driver-id'>Driver / asset number</Label>
          <Input
            id='driver-id'
            placeholder='e.g. D-204'
            value={yourId}
            onChange={(e) => setYourId(e.target.value)}
            className='h-11'
          />
        </div>

        {/* Action cards */}
        <div className='flex flex-col gap-3'>
          {actions
            .filter((a) => a.show)
            .map(({ key, label, icon: Icon }) => (
              <Card
                key={key}
                className='cursor-pointer transition-colors hover:bg-muted/50'
                onClick={() => setActiveSheet(key)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveSheet(key)}
                aria-label={label}
              >
                <CardContent className='flex items-center gap-4 py-4'>
                  <Icon className='size-5 shrink-0 text-muted-foreground' />
                  <span className='text-base font-medium'>{label}</span>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>

      {/* Sheets */}
      <Sheet open={activeSheet === 'report'} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <SheetContent side='bottom' className='max-h-[90vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>Report a problem</SheetTitle>
          </SheetHeader>
          <RaiseRequestForm vehicleId={id} submittedBy={yourId} onDone={() => setActiveSheet(null)} />
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === 'mileage'} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <SheetContent side='bottom' className='max-h-[90vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>Update mileage</SheetTitle>
          </SheetHeader>
          <MileageForm vehicle={vehicle} onDone={() => setActiveSheet(null)} />
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === 'temperature'} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <SheetContent side='bottom' className='max-h-[90vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>Log temperature</SheetTitle>
          </SheetHeader>
          <TemperatureForm vehicle={vehicle} onDone={() => setActiveSheet(null)} />
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === 'requests'} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <SheetContent side='bottom' className='max-h-[80vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>My requests</SheetTitle>
          </SheetHeader>
          <MyRequests vehicleId={id} />
        </SheetContent>
      </Sheet>

      <DriverNav onMyRequests={() => setActiveSheet('requests')} />
    </div>
  );
}
