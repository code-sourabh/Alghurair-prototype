import type { DemoConfig } from '../types';

export const seedConfig: DemoConfig = {
  routingRules: [
    { requestType: 'electrical', vendorId: 'v_elec' },
    { requestType: 'mechanical', vendorId: 'v_mech' },
    { requestType: 'body', vendorId: 'v_body' },
    { requestType: 'chiller', vendorId: 'v_cold' },
    { requestType: 'other', vendorId: 'v_mech' },
  ],
  alertWindowFarDays: 90,
  alertWindowNearDays: 60,
};
