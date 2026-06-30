'use client';

import { useMemo } from 'react';

import { useFleet } from '@/lib/fleet/store';
import { daysUntil, docStatus } from '@/lib/fleet/permit-status';
import { formatDate } from '@/lib/fleet/format';
import type { DocumentType } from '@/lib/fleet/types';

import { Topbar } from '@/components/app-shell/Topbar';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Badge } from '@repo/ui/components/badge';

const DOC_LABELS: Record<DocumentType, string> = {
  road_permit: 'Road permit',
  license: 'License',
  trailer: 'Trailer',
  branding: 'Branding',
  mulkea: 'Mulkea',
  chiller: 'Chiller',
};

export default function ReportsPage() {
  const { vendors, requests, documents, vehicles } = useFleet();

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const expiredDocs = useMemo(() => documents.filter((d) => docStatus(d.expiry) === 'expired'), [documents]);

  return (
    <>
      <Topbar title='Reports' />
      <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        {/* Vendor response time */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor response time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Avg response</TableHead>
                    <TableHead className='text-right'>Assigned requests</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className='font-medium'>{v.name}</TableCell>
                      <TableCell>{v.avgResponseHours}h</TableCell>
                      <TableCell className='text-right'>{requests.filter((r) => r.vendorId === v.id).length}</TableCell>
                      <TableCell>
                        {v.avgResponseHours > 24 ? (
                          <Badge variant='destructive'>Delaying</Badge>
                        ) : (
                          <Badge variant='secondary'>On time</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Expired documents */}
        <Card>
          <CardHeader>
            <CardTitle>Expired documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Responsible party</TableHead>
                    <TableHead>Expired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredDocs.map((d) => {
                    const vehicle = vehicleMap.get(d.vehicleId);
                    const daysAgo = Math.abs(daysUntil(d.expiry));
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className='font-mono text-sm'>{d.vehicleId}</div>
                          {vehicle && <div className='text-muted-foreground text-xs'>{vehicle.name}</div>}
                        </TableCell>
                        <TableCell>
                          {DOC_LABELS[d.type]}
                          {d.emirate ? ` — ${d.emirate}` : ''}
                        </TableCell>
                        <TableCell>{d.responsibleParty}</TableCell>
                        <TableCell>
                          <div>{formatDate(d.expiry)}</div>
                          <div className='text-muted-foreground text-xs'>{daysAgo} days ago</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {expiredDocs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='text-muted-foreground text-center'>
                        No expired documents.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
