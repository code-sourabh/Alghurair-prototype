'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import type { RequestType } from '@/lib/fleet/types';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/components/select';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';

const schema = z.object({
  type: z.enum(['electrical', 'mechanical', 'body', 'chiller', 'other']),
  severity: z.enum(['low', 'medium']),
  description: z.string().min(4, 'Please describe the issue'),
});

type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<RequestType, string> = {
  electrical: 'Electrical',
  mechanical: 'Mechanical',
  body: 'Body',
  chiller: 'Chiller',
  other: 'Other',
};

interface RaiseRequestFormProps {
  vehicleId: string;
  submittedBy: string;
  onDone: () => void;
}

export function RaiseRequestForm({ vehicleId, submittedBy, onDone }: RaiseRequestFormProps) {
  const { submitRequest } = useFleet();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { severity: 'low' },
  });

  const severity = watch('severity');

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onSubmit(data: FormValues) {
    submitRequest({ vehicleId, ...data, photoDataUrl, submittedBy });
    toast.success('Request submitted');
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 px-1'>
      {/* Type */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='req-type'>Type</Label>
        <Select onValueChange={(v) => setValue('type', v as RequestType)}>
          <SelectTrigger id='req-type'>
            <SelectValue placeholder='Select type…' />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABEL) as RequestType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && <p className='text-xs text-destructive'>{errors.type.message}</p>}
      </div>

      {/* Severity */}
      <div className='flex flex-col gap-1.5'>
        <Label>Severity</Label>
        <RadioGroup
          value={severity}
          onValueChange={(v) => setValue('severity', v as 'low' | 'medium')}
          className='flex gap-4'
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='low' id='sev-low' />
            <Label htmlFor='sev-low'>Low</Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='medium' id='sev-medium' />
            <Label htmlFor='sev-medium'>Medium</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Description */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='req-desc'>Description</Label>
        <Textarea id='req-desc' rows={3} placeholder='Describe the issue…' {...register('description')} />
        {errors.description && <p className='text-xs text-destructive'>{errors.description.message}</p>}
      </div>

      {/* Photo */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='req-photo'>Photo (optional)</Label>
        <Input id='req-photo' type='file' accept='image/*' onChange={handlePhoto} />
        {/* ponytail: next/image not used — data URL from local file, not a remote asset */}
        {photoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUrl} alt='Attached photo preview' className='max-h-32 rounded border object-contain' />
        )}
      </div>

      <Button type='submit' className='h-11 w-full' disabled={isSubmitting}>
        Submit request
      </Button>
    </form>
  );
}
