'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { ThemeToggle } from '@repo/ui/components/theme-toggle';
import { RotateCcw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useFleet } from '@/lib/fleet/store';
import { OutboxPanel } from './OutboxPanel';
import { PersonaSwitcher } from './PersonaSwitcher';

export function DemoToolbar() {
  const { resetDemo } = useFleet();

  return (
    <div className='bg-background fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-3 border-b px-4'>
      <Truck className='text-primary size-5' />
      <span className='text-sm font-bold'>Al Ghurair Fleet</span>
      <Badge variant='secondary'>DEMO</Badge>
      <div className='ml-auto flex items-center gap-2'>
        <PersonaSwitcher />
        <OutboxPanel />
        <Button
          variant='outline'
          size='sm'
          className='gap-1.5'
          onClick={() => {
            resetDemo();
            toast.success('Demo reset');
          }}
        >
          <RotateCcw className='size-4' />
          Reset
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
