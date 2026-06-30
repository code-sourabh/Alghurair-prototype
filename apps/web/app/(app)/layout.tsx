'use client';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar';
import { AppSidebar } from '@/components/app-shell/AppSidebar';
import { FleetProvider, useFleet } from '@/lib/fleet/store';
import { DemoToolbar } from '@/components/fleet/demo/DemoToolbar';
import { PhoneFrame } from '@/components/fleet/demo/PhoneFrame';

function Shell({ children }: { children: React.ReactNode }) {
  const { persona } = useFleet();
  if (persona === 'driver') {
    return (
      <div className='pt-12'>
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    );
  }
  return (
    <SidebarProvider className='[&_[data-slot=sidebar-container]]:top-12! [&_[data-slot=sidebar-container]]:h-[calc(100svh-3rem)]!'>
      <AppSidebar />
      <SidebarInset className='pt-12'>{children}</SidebarInset>
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
