'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import { formatKm } from '@/lib/fleet/format';
import type { Vehicle } from '@/lib/fleet/types';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

interface MileageFormProps {
  vehicle: Vehicle;
  onDone: () => void;
}

export function MileageForm({ vehicle, onDone }: MileageFormProps) {
  const { updateMileage } = useFleet();
  const [value, setValue] = useState(String(vehicle.mileageKm));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const km = Number(value);
    if (Number.isNaN(km) || km < 0) return;
    updateMileage(vehicle.id, km);
    const serviceDue = km - vehicle.lastServiceKm >= vehicle.serviceIntervalKm;
    if (serviceDue) {
      toast('Service due — fleet team notified', { description: `${formatKm(km)} recorded` });
    } else {
      toast.success('Mileage updated', { description: formatKm(km) });
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 px-1'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='mileage-input'>Current mileage (km)</Label>
        <Input
          id='mileage-input'
          type='number'
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className='h-11'
        />
      </div>
      <Button type='submit' className='h-11 w-full'>
        Save mileage
      </Button>
    </form>
  );
}
