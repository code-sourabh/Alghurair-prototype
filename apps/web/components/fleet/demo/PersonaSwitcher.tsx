'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { useFleet } from '@/lib/fleet/store';
import type { Persona } from '@/lib/fleet/types';
import { useRouter } from 'next/navigation';

const HOME: Record<Persona, string> = {
  driver: '/driver',
  fleet_manager: '/',
  management: '/',
  vendor: '/vendor',
};

export function PersonaSwitcher() {
  const { persona, setPersona } = useFleet();
  const router = useRouter();

  const onChange = (v: Persona) => {
    setPersona(v);
    router.push(HOME[v]);
  };

  return (
    <Select value={persona} onValueChange={(v) => onChange(v as Persona)}>
      <SelectTrigger className='h-8 w-[170px]'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='driver'>Driver</SelectItem>
        <SelectItem value='fleet_manager'>Fleet Manager</SelectItem>
        <SelectItem value='management'>Management</SelectItem>
        <SelectItem value='vendor'>Vendor</SelectItem>
      </SelectContent>
    </Select>
  );
}
