'use client';
import { usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar';
import { AppSidebar } from '@/components/app-shell/AppSidebar';
import { FleetProvider } from '@/lib/fleet/store';
import { DemoToolbar } from '@/components/fleet/demo/DemoToolbar';
import { PhoneFrame } from '@/components/fleet/demo/PhoneFrame';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDriver = pathname.startsWith('/driver');
  // SidebarProvider is always mounted so <Topbar>'s <SidebarTrigger> can never be
  // orphaned (no crash even mid route-transition). The visible surface is chosen by
  // ROUTE, so the rendered page always matches its shell — admin pages never appear
  // inside the phone frame, and driver pages never appear in the web shell.
  return (
    <SidebarProvider className='[&_[data-slot=sidebar-container]]:top-12! [&_[data-slot=sidebar-container]]:h-[calc(100svh-3rem)]!'>
      {isDriver ? (
        <div className='w-full pt-12'>
          <PhoneFrame>{children}</PhoneFrame>
        </div>
      ) : (
        <>
          <AppSidebar />
          <SidebarInset className='pt-12'>{children}</SidebarInset>
        </>
      )}
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FleetProvider>
      <DemoToolbar />
      <Shell>{children}</Shell>
    </FleetProvider>
  );
}
