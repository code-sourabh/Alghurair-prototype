import type { DocStatus } from './types';

/**
 * Fixed "today" for the demo so expiry counts never drift between runs.
 * All seed expiry dates are chosen relative to this date.
 */
export const DEMO_TODAY = '2026-06-30';

const DAY_MS = 86_400_000;

/** Whole days from `today` until `expiry` (negative if already expired). */
export function daysUntil(expiry: string, today: string = DEMO_TODAY): number {
  return Math.floor((new Date(expiry).getTime() - new Date(today).getTime()) / DAY_MS);
}

/** True when the document expires within `days` from now and is not already expired. */
export function expiresWithin(expiry: string, days: number, today: string = DEMO_TODAY): boolean {
  const d = daysUntil(expiry, today);
  return d >= 0 && d <= days;
}

/** Color tier for a document. `nearDays` is the amber window (default 60). */
export function docStatus(expiry: string, nearDays = 60, today: string = DEMO_TODAY): DocStatus {
  const d = daysUntil(expiry, today);
  if (d < 0) return 'expired';
  if (d <= nearDays) return 'near_expiry';
  return 'valid';
}
