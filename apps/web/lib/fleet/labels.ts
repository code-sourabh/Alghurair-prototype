import type { DocumentType, RequestType, Severity, VehicleType } from './types';

export const DOC_LABELS: Record<DocumentType, string> = {
  road_permit: 'Road permit',
  license: 'License',
  trailer: 'Trailer',
  branding: 'Branding',
  mulkea: 'Mulkea',
  chiller: 'Chiller',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  electrical: 'Electrical',
  mechanical: 'Mechanical',
  body: 'Body',
  chiller: 'Chiller',
  other: 'Other',
};

export const SEVERITY_LABELS: Record<Severity, string> = { low: 'Low', medium: 'Medium' };

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  big_truck: 'Big truck',
  small_truck: 'Small truck',
  van: 'Van',
  tickle_truck: 'Tickle truck',
  tanker: 'Tanker',
  equipment: 'Equipment',
};
