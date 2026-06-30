export type Persona = 'driver' | 'fleet_manager' | 'management' | 'vendor';

export type VehicleType = 'big_truck' | 'small_truck' | 'van' | 'tickle_truck' | 'tanker' | 'equipment';
export type OperationalStatus = 'operational' | 'in_maintenance' | 'down';

export interface Vehicle {
  id: string; // plate-like, e.g. 'AG-1042'
  qrId: string; // QR payload, e.g. 'QR-AG-1042'
  name: string; // 'Mercedes Actros 2640'
  type: VehicleType;
  model: string;
  year: number;
  ageYears: number;
  purchasePrice: number; // AED
  currentValue: number; // AED
  mileageKm: number;
  serviceIntervalKm: number; // e.g. 5000
  lastServiceKm: number;
  plant: string; // 'Dubai DIP Plant'
  coldChain: boolean;
  status: OperationalStatus;
  lastTempC?: number; // last logged chiller temp (cold-chain only)
}

export type DocumentType = 'road_permit' | 'license' | 'trailer' | 'branding' | 'mulkea' | 'chiller';
export type Emirate = 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah';
export type DocStatus = 'valid' | 'near_expiry' | 'expired';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  emirate?: Emirate; // only for road_permit
  responsibleParty: string; // who renews it, e.g. 'Branding Dept'
  expiry: string; // ISO date 'YYYY-MM-DD'
}

export type Severity = 'low' | 'medium';
export type RequestType = 'electrical' | 'mechanical' | 'body' | 'chiller' | 'other';
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  vehicleId: string;
  type: RequestType;
  severity: Severity;
  description: string;
  photoDataUrl?: string; // attached photo preview
  submittedBy: string; // asset/driver number entered on scan
  createdAt: string; // ISO
  status: RequestStatus;
  vendorId?: string;
  quotedPrice?: number; // AED
  visitTime?: string; // ISO
  vendorNotes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  username: string; // fake login
  specialties: RequestType[];
  assignedPlants: string[];
  avgResponseHours: number; // for the report
}

export type RenewalStatus = 'sent' | 'in_progress' | 'renewed';
export interface RenewalTask {
  id: string;
  documentId: string;
  vehicleId: string;
  responsibleParty: string;
  sentAt: string;
  status: RenewalStatus;
}

export type OutboxChannel = 'whatsapp' | 'email';
export interface OutboxMessage {
  id: string;
  channel: OutboxChannel;
  to: string;
  subject: string;
  body: string;
  sentAt: string; // ISO
  relatedId?: string; // request or renewal id
}

export interface RoutingRule {
  requestType: RequestType;
  vendorId: string;
}
export interface DemoConfig {
  routingRules: RoutingRule[];
  alertWindowFarDays: number; // 90
  alertWindowNearDays: number; // 60
}
