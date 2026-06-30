import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';

export interface MetricTile {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'danger';
}

export function MetricTiles({ tiles }: { tiles: MetricTile[] }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>{t.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', t.tone === 'danger' && 'text-destructive')}>{t.value}</div>
            {t.hint ? <p className='text-muted-foreground mt-1 text-xs'>{t.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
