import type { Vendor } from '../types';

export const vendors: Vendor[] = [
  {
    id: 'v_elec',
    name: 'Emirates Auto Electric',
    username: 'electric',
    specialties: ['electrical'],
    assignedPlants: ['Dubai DIP Plant', 'Sharjah Plant'],
    avgResponseHours: 4,
  },
  {
    id: 'v_mech',
    name: 'Gulf Mechanical Services',
    username: 'mechanical',
    specialties: ['mechanical'],
    assignedPlants: ['Dubai DIP Plant', 'Abu Dhabi Plant'],
    avgResponseHours: 9,
  },
  {
    id: 'v_body',
    name: 'ProBody & Paint LLC',
    username: 'body',
    specialties: ['body'],
    assignedPlants: ['Sharjah Plant'],
    avgResponseHours: 28,
  },
  {
    id: 'v_cold',
    name: 'CoolChain Refrigeration',
    username: 'chiller',
    specialties: ['chiller'],
    assignedPlants: ['Dubai DIP Plant', 'Abu Dhabi Plant'],
    avgResponseHours: 6,
  },
];
