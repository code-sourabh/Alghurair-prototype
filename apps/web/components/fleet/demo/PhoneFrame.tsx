'use client';

import { useState } from 'react';
import { PortalContainerContext } from '@repo/ui/lib/portal-container';

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  // Capture the frame element so portaled overlays (sheets, selects) render
  // into it. `translateZ(0)` makes the frame the containing block for their
  // `position: fixed`, so they stay inside the phone instead of covering the
  // full web viewport. useState (not useRef) re-renders once the node mounts.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);

  return (
    <div className='bg-muted/40 flex min-h-[calc(100svh-3rem)] w-full justify-center px-4 py-8'>
      <div
        ref={setFrame}
        className='border-border bg-background relative flex h-[820px] w-[390px] flex-col overflow-hidden rounded-[2.25rem] border-8 shadow-xl [transform:translateZ(0)]'
      >
        <div className='bg-background flex h-7 shrink-0 items-center justify-center'>
          <div className='bg-border h-1.5 w-20 rounded-full' />
        </div>
        <div className='flex-1 overflow-y-auto'>
          <PortalContainerContext.Provider value={frame}>{children}</PortalContainerContext.Provider>
        </div>
      </div>
    </div>
  );
}
