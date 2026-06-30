'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@repo/ui/components/sheet';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Bell, Mail, MessageCircle } from 'lucide-react';
import { useFleet } from '@/lib/fleet/store';

export function OutboxPanel() {
  const { outbox } = useFleet();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm' className='gap-1.5'>
          <Bell className='size-4' />
          Outbox
          {outbox.length > 0 && <Badge className='ml-0.5 h-5 px-1.5'>{outbox.length}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Notifications sent</SheetTitle>
        </SheetHeader>
        {outbox.length === 0 ? (
          <p className='text-muted-foreground mt-6 text-sm'>No notifications sent yet.</p>
        ) : (
          <ul className='mt-4 flex flex-col gap-3'>
            {outbox.map((msg) => (
              <li key={msg.id} className='border-border rounded-lg border p-3 text-sm'>
                <div className='text-muted-foreground mb-1 flex items-center gap-1.5'>
                  {msg.channel === 'whatsapp' ? <MessageCircle className='size-3.5' /> : <Mail className='size-3.5' />}
                  <span className='capitalize'>{msg.channel}</span>
                  <span>→ {msg.to}</span>
                </div>
                <p className='font-semibold'>{msg.subject}</p>
                <p className='text-muted-foreground mt-0.5'>{msg.body}</p>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
