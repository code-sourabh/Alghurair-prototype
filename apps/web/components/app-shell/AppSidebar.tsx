'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/components/sidebar';
import { BarChart3, ClipboardList, FileBadge, LayoutDashboard, Settings, Truck, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFleet } from '@/lib/fleet/store';
import type { Persona } from '@/lib/fleet/types';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const NAV: Record<Persona, NavItem[]> = {
  fleet_manager: [
    { title: 'Dashboard', href: '/', icon: LayoutDashboard },
    { title: 'Vehicles', href: '/vehicles', icon: Truck },
    { title: 'Requests', href: '/requests', icon: Wrench },
    { title: 'Permits', href: '/permits', icon: FileBadge },
    { title: 'Config', href: '/config', icon: Settings },
  ],
  management: [
    { title: 'Dashboard', href: '/', icon: LayoutDashboard },
    { title: 'Vehicles', href: '/vehicles', icon: Truck },
    { title: 'Permits', href: '/permits', icon: FileBadge },
    { title: 'Reports', href: '/reports', icon: BarChart3 },
  ],
  vendor: [{ title: 'My Work', href: '/vendor', icon: ClipboardList }],
  driver: [],
};

const ROLE_LABEL: Record<Persona, string> = {
  fleet_manager: 'Fleet Manager',
  management: 'Management',
  vendor: 'Vendor',
  driver: 'Driver',
};

export function AppSidebar() {
  const pathname = usePathname();
  const { persona } = useFleet();
  // The sidebar only renders on web routes; if persona is momentarily 'driver'
  // (during a switch, or persisted from a prior session) fall back to a web persona
  // so the nav is never empty.
  const navPersona: Persona = persona === 'driver' ? 'fleet_manager' : persona;
  const items = NAV[navPersona];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-2 py-1.5'>
          <div className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md'>
            <Truck className='size-4' />
          </div>
          <span className='text-sm font-semibold'>Al Ghurair Fleet</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{ROLE_LABEL[navPersona]}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className='text-muted-foreground px-2 py-1 text-xs'>Prototype · mock data</div>
      </SidebarFooter>
    </Sidebar>
  );
}
