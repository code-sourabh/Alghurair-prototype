'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, QrCode, ClipboardList } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

interface DriverNavProps {
  onMyRequests?: () => void;
}

const tabs = [
  { label: 'Home', icon: Home, href: '/driver' },
  { label: 'Scan', icon: QrCode, href: '/driver' },
] as const;

export function DriverNav({ onMyRequests }: DriverNavProps) {
  const pathname = usePathname();

  return (
    <nav className='sticky bottom-0 z-10 border-t bg-background'>
      <div className='grid grid-cols-3'>
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className='size-5' />
              <span>{label}</span>
            </Link>
          );
        })}

        {onMyRequests ? (
          <button
            type='button'
            onClick={onMyRequests}
            className='flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground'
          >
            <ClipboardList className='size-5' />
            <span>My requests</span>
          </button>
        ) : (
          <Link
            href='/driver'
            className='flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground'
          >
            <ClipboardList className='size-5' />
            <span>My requests</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
