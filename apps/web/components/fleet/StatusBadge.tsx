import { Badge } from '@repo/ui/components/badge';

const MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  valid: { label: 'Valid', variant: 'secondary' },
  near_expiry: { label: 'Near expiry', variant: 'outline', className: 'border-destructive/40 text-destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
  operational: { label: 'Operational', variant: 'secondary' },
  in_maintenance: { label: 'In maintenance', variant: 'outline' },
  down: { label: 'Down', variant: 'destructive' },
  new: { label: 'New', variant: 'default' },
  assigned: { label: 'Assigned', variant: 'outline' },
  in_progress: { label: 'In progress', variant: 'outline' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  renewed: { label: 'Renewed', variant: 'secondary' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, variant: 'outline' as const };
  return (
    <Badge variant={s.variant} className={s.className}>
      {s.label}
    </Badge>
  );
}
