// Fixed-locale formatters so SSR and client output match (no hydration mismatch).
const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('en-AE');

export const formatAED = (n: number): string => AED.format(n);
export const formatKm = (n: number): string => `${NUM.format(n)} km`;
/** Format an ISO date deterministically (UTC, fixed locale) e.g. "15 May 2026". */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
