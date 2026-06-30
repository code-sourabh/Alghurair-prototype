'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useFleet } from '@/lib/fleet/store';
import { formatAED, formatDate } from '@/lib/fleet/format';
import type { MaintenanceRequest } from '@/lib/fleet/types';
import { REQUEST_TYPE_LABELS, SEVERITY_LABELS } from '@/lib/fleet/labels';
import { StatusBadge } from '@/components/fleet/StatusBadge';
import { Topbar } from '@/components/app-shell/Topbar';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui/components/select';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Button } from '@repo/ui/components/button';

// Converts an ISO string to the value expected by <input type="datetime-local">
function toDatetimeLocal(iso: string): string {
  // Slice to "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function VendorPage() {
  const { requests, vehicles, vendors, vendorRespond } = useFleet();

  const [loggedInVendorId, setLoggedInVendorId] = useState<string | null>(null);

  // Login form state
  const firstVendor = vendors[0];
  const [selectedUsername, setSelectedUsername] = useState<string>(firstVendor?.username ?? '');
  // password is not validated — any value works
  const [password, setPassword] = useState('');

  // Workspace dialog state
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [price, setPrice] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  // ── Login ────────────────────────────────────────────────────────────────

  function handleLogin() {
    const vendor = vendors.find((v) => v.username === selectedUsername);
    if (!vendor) return;
    setLoggedInVendorId(vendor.id);
  }

  if (loggedInVendorId === null) {
    return (
      <div className='flex min-h-svh items-center justify-center p-4'>
        <Card className='w-full max-w-sm'>
          <CardHeader>
            <CardTitle>Vendor sign in</CardTitle>
            <CardDescription>Demo — any password works</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vendor-username'>Username</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                <SelectTrigger id='vendor-username' aria-label='Select vendor username'>
                  <SelectValue placeholder='Select username' />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.username}>
                      {v.username} — {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='vendor-password'>Password</Label>
              <Input
                id='vendor-password'
                type='password'
                placeholder='Any value works'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button className='w-full' onClick={handleLogin} disabled={!selectedUsername}>
              Log in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Workspace ────────────────────────────────────────────────────────────

  const vendor = vendors.find((v) => v.id === loggedInVendorId)!;
  const assignedRequests = requests.filter((r) => r.vendorId === vendor.id);

  function openDialog(r: MaintenanceRequest) {
    setSelected(r);
    setPrice(r.quotedPrice !== undefined ? String(r.quotedPrice) : '');
    setVisitTime(r.visitTime ? toDatetimeLocal(r.visitTime) : '');
    setVendorNotes(r.vendorNotes ?? '');
  }

  function handleSubmit() {
    if (!selected || !price || !visitTime) return;
    vendorRespond(selected.id, {
      quotedPrice: Number(price),
      visitTime: new Date(visitTime).toISOString(),
      vendorNotes: vendorNotes || undefined,
    });
    toast.success('Response submitted');
    setSelected(null);
  }

  const selectedVehicle = selected ? vehicleMap.get(selected.vehicleId) : null;

  return (
    <>
      <Topbar title={vendor.name} />
      <main className='flex flex-1 flex-col gap-4 p-4 md:p-6'>
        {/* Header row */}
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-semibold'>Assigned requests</h2>
          <Button variant='ghost' size='sm' onClick={() => setLoggedInVendorId(null)}>
            Log out
          </Button>
        </div>

        {/* Table */}
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Your quote</TableHead>
                <TableHead>Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedRequests.map((r) => {
                const v = vehicleMap.get(r.vehicleId);
                return (
                  <TableRow key={r.id} className='cursor-pointer' onClick={() => openDialog(r)}>
                    <TableCell>
                      <div className='font-mono text-sm'>{r.vehicleId}</div>
                      {v && <div className='text-muted-foreground text-xs'>{v.name}</div>}
                    </TableCell>
                    <TableCell>{REQUEST_TYPE_LABELS[r.type]}</TableCell>
                    <TableCell>{SEVERITY_LABELS[r.severity]}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.quotedPrice !== undefined ? formatAED(r.quotedPrice) : '—'}</TableCell>
                    <TableCell>{r.visitTime ? formatDate(r.visitTime) : '—'}</TableCell>
                  </TableRow>
                );
              })}
              {assignedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground text-center'>
                    No requests assigned to you yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Respond Dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className='sm:max-w-md'>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.vehicleId} — {REQUEST_TYPE_LABELS[selected.type]}
                </DialogTitle>
                <DialogDescription>
                  {selectedVehicle ? `${selectedVehicle.name} · ${selectedVehicle.plant}` : selected.vehicleId}
                  {' · '}
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='resp-price'>Expected price (AED)</Label>
                  <Input
                    id='resp-price'
                    type='number'
                    min={0}
                    placeholder='e.g. 1500'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='resp-visit'>Visit time</Label>
                  <Input
                    id='resp-visit'
                    type='datetime-local'
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    required
                  />
                </div>

                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='resp-notes'>Notes (optional)</Label>
                  <Textarea
                    id='resp-notes'
                    placeholder='Any additional notes…'
                    value={vendorNotes}
                    onChange={(e) => setVendorNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmit} disabled={!price || !visitTime}>
                  Submit response
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
