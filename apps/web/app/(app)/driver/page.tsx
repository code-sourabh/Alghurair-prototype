'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ClipboardList } from 'lucide-react';

import { useFleet } from '@/lib/fleet/store';
import { DriverNav } from '@/components/fleet/driver/DriverNav';
import { MyRequests } from '@/components/fleet/driver/MyRequests';
import { StatusBadge } from '@/components/fleet/StatusBadge';

import { Button } from '@repo/ui/components/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/sheet';

export default function DriverHomePage() {
  const router = useRouter();
  const { vehicles, requests } = useFleet();
  const [scanOpen, setScanOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);

  const recent = vehicles.slice(0, 5);

  return (
    <div className='flex min-h-full flex-col'>
      {/* Mobile header */}
      <header className='border-b px-4 py-4'>
        <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Al Ghurair Fleet</p>
        <h1 className='text-xl font-semibold'>Driver</h1>
      </header>

      <main className='flex flex-1 flex-col gap-6 p-4'>
        {/* Primary action */}
        <Button size='lg' className='h-14 gap-2 text-base' onClick={() => setScanOpen(true)}>
          <QrCode className='size-5' />
          Scan vehicle QR
        </Button>

        {/* Recent vehicles */}
        <section>
          <h2 className='mb-3 text-sm font-medium text-muted-foreground'>Recent vehicles</h2>
          <ul className='flex flex-col gap-2'>
            {recent.map((v) => (
              <li key={v.id}>
                <button
                  type='button'
                  onClick={() => router.push(`/driver/asset/${v.id}`)}
                  className='flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50'
                >
                  <div>
                    <p className='text-sm font-medium'>{v.id}</p>
                    <p className='text-xs text-muted-foreground'>{v.name}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* My requests shortcut */}
        <button
          type='button'
          onClick={() => setRequestsOpen(true)}
          className='flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50'
        >
          <ClipboardList className='size-5 shrink-0 text-muted-foreground' />
          <div>
            <p className='text-sm font-medium'>My requests</p>
            <p className='text-xs text-muted-foreground'>{requests.length} total</p>
          </div>
        </button>
      </main>

      {/* Scan sheet */}
      <Sheet open={scanOpen} onOpenChange={setScanOpen}>
        <SheetContent side='bottom' className='max-h-[80vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>Scan a vehicle</SheetTitle>
            <p className='text-sm text-muted-foreground'>Open the fuel flap and scan the QR sticker.</p>
          </SheetHeader>
          <ul className='flex flex-col gap-2'>
            {vehicles.map((v) => (
              <li key={v.id}>
                <button
                  type='button'
                  onClick={() => {
                    setScanOpen(false);
                    router.push(`/driver/asset/${v.id}`);
                  }}
                  className='flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50'
                >
                  <div>
                    <p className='text-sm font-medium'>{v.id}</p>
                    <p className='text-xs text-muted-foreground'>
                      {v.name} · {v.plant}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {/* My requests sheet */}
      <Sheet open={requestsOpen} onOpenChange={setRequestsOpen}>
        <SheetContent side='bottom' className='max-h-[80vh] overflow-y-auto'>
          <SheetHeader className='mb-4'>
            <SheetTitle>My requests</SheetTitle>
          </SheetHeader>
          <MyRequests />
        </SheetContent>
      </Sheet>

      <DriverNav onMyRequests={() => setRequestsOpen(true)} />
    </div>
  );
}
