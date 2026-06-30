'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import type { Vehicle } from '@/lib/fleet/types';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

interface TemperatureFormProps {
  vehicle: Vehicle;
  onDone: () => void;
}

const SAFE_LIMIT = 8;

export function TemperatureForm({ vehicle, onDone }: TemperatureFormProps) {
  const { logTemperature } = useFleet();
  const [value, setValue] = useState(vehicle.lastTempC != null ? String(vehicle.lastTempC) : '');

  const parsed = parseFloat(value);
  const hasValue = value !== '' && !Number.isNaN(parsed);
  const aboveLimit = hasValue && parsed > SAFE_LIMIT;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasValue) return;
    logTemperature(vehicle.id, parsed);
    if (aboveLimit) {
      toast.warning('Temperature above limit — flagged', { description: `${parsed}°C logged` });
    } else {
      toast.success('Temperature logged', { description: `${parsed}°C` });
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 px-1'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='temp-input'>Chiller temperature (°C)</Label>
        <Input
          id='temp-input'
          type='number'
          step='0.1'
          placeholder='e.g. 4.5'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className='h-11'
        />
        {hasValue && (
          <p className={aboveLimit ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
            {aboveLimit ? `Above safe limit (${SAFE_LIMIT}°C)` : 'Within range'}
          </p>
        )}
      </div>
      <Button type='submit' className='h-11 w-full' disabled={!hasValue}>
        Log temperature
      </Button>
    </form>
  );
}
