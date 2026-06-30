'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import type { RequestType, RoutingRule } from '@/lib/fleet/types';
import { REQUEST_TYPE_LABELS } from '@/lib/fleet/labels';
import { Topbar } from '@/components/app-shell/Topbar';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/components/select';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Button } from '@repo/ui/components/button';

const REQUEST_TYPES: RequestType[] = ['electrical', 'mechanical', 'body', 'chiller', 'other'];

export default function ConfigPage() {
  const { config, vehicles, vendors, updateConfig, setServiceInterval } = useFleet();

  const [draftRules, setDraftRules] = useState<RoutingRule[]>(config.routingRules);
  const [draftNear, setDraftNear] = useState<number>(config.alertWindowNearDays);
  const [draftFar, setDraftFar] = useState<number>(config.alertWindowFarDays);
  const [draftIntervals, setDraftIntervals] = useState<Record<string, number>>(() =>
    Object.fromEntries(vehicles.map((v) => [v.id, v.serviceIntervalKm])),
  );

  function setRuleVendor(requestType: RequestType, vendorId: string) {
    setDraftRules((prev) => prev.map((r) => (r.requestType === requestType ? { ...r, vendorId } : r)));
  }

  function getRuleVendor(requestType: RequestType): string {
    return draftRules.find((r) => r.requestType === requestType)?.vendorId ?? '';
  }

  function saveConfig() {
    updateConfig({
      routingRules: draftRules,
      alertWindowNearDays: Number(draftNear),
      alertWindowFarDays: Number(draftFar),
    });
    toast.success('Configuration saved');
  }

  function saveIntervals() {
    for (const v of vehicles) {
      if (draftIntervals[v.id] !== v.serviceIntervalKm) {
        setServiceInterval(v.id, draftIntervals[v.id] ?? v.serviceIntervalKm);
      }
    }
    toast.success('Service intervals saved');
  }

  return (
    <>
      <Topbar title='Configuration' />
      <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        {/* Card A — Routing rules */}
        <Card>
          <CardHeader>
            <CardTitle>Routing rules</CardTitle>
            <CardDescription>Which vendor each request type is sent to automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request type</TableHead>
                  <TableHead>Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REQUEST_TYPES.map((rt) => (
                  <TableRow key={rt}>
                    <TableCell>{REQUEST_TYPE_LABELS[rt]}</TableCell>
                    <TableCell>
                      <Select value={getRuleVendor(rt)} onValueChange={(v) => setRuleVendor(rt, v)}>
                        <SelectTrigger aria-label={`Vendor for ${REQUEST_TYPE_LABELS[rt]}`} className='w-48'>
                          <SelectValue placeholder='Select vendor' />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Card B — Alert windows + save button */}
        <Card>
          <CardHeader>
            <CardTitle>Permit alert windows</CardTitle>
            <CardDescription>When permits start showing as expiring.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-6'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='near-window'>Near window (days)</Label>
                <Input
                  id='near-window'
                  type='number'
                  min={1}
                  value={draftNear}
                  onChange={(e) => setDraftNear(Number(e.target.value))}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='far-window'>Far window (days)</Label>
                <Input
                  id='far-window'
                  type='number'
                  min={1}
                  value={draftFar}
                  onChange={(e) => setDraftFar(Number(e.target.value))}
                />
              </div>
            </div>
            <Button className='self-start' onClick={saveConfig}>
              Save configuration
            </Button>
          </CardContent>
        </Card>

        {/* Card C — Service intervals */}
        <Card>
          <CardHeader>
            <CardTitle>Service intervals</CardTitle>
            <CardDescription>Distance between scheduled services, per vehicle.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='max-h-[480px] overflow-y-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service interval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <span className='font-medium'>{v.id}</span>
                        <span className='ml-2 text-sm text-muted-foreground'>{v.name}</span>
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={`interval-${v.id}`} className='sr-only'>
                          Service interval for {v.id}
                        </Label>
                        <Input
                          id={`interval-${v.id}`}
                          type='number'
                          min={0}
                          step={500}
                          className='w-36'
                          value={draftIntervals[v.id] ?? v.serviceIntervalKm}
                          onChange={(e) => setDraftIntervals((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button className='self-start' onClick={saveIntervals}>
              Save intervals
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
