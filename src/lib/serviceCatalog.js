// Shared service-catalogue helpers.
//
// The app has two sources of services:
//   • the legacy directory in src/state/mockData.js, for the flows that live as
//     bespoke overlays (NIS registration, benefit claims, GPL, passport);
//   • the seeded `services` table, read through src/api/catalog.js, for Cash
//     Grants, the Single Window services and the GRO certificates — those render
//     their overview, form, fees and routing entirely from data.
//
// Everything here is about presenting both as one catalogue to the citizen,
// who should never have to know which is which.

import { SERVICE_DIRECTORY } from '../state/mockData';
import { listServices, SERVICE_GROUPS } from '../api/catalog';

// Per-service icon overrides for the legacy directory — falls back to the
// parent category's icon when a service isn't named here.
export const SERVICE_ICONS = {
  'Birth certificate copy': 'file-text',
  'Change of name': 'pen-line',
  'NIS registration': 'badge-check',
  'Sickness Benefit': 'thermometer',
  'Maternity Benefit': 'baby',
  'Funeral Grant': 'flower-2',
  'Pension estimate': 'piggy-bank',
  'Pay electricity bill': 'receipt',
  'Report an outage': 'zap-off',
  'New connection application': 'plug-zap',
  'Guyana Passport': 'plane',
  'Cash Grant': 'banknote',
  'TIN registration': 'hash',
  'File annual return': 'file-text',
  'House lot application': 'home',
  'Water connection': 'droplets',
};

/**
 * Maps a legacy service name to the overlay flow it opens. Anything not listed
 * has no built flow yet, so it just surfaces a toast. The e-ID is not a service
 * (backlog 3.7) — it is applied for from Home and accessed from the Vault.
 *
 * Cash Grant, the birth certificate and the utility connections are seeded
 * services now, so any name that still reaches this function is routed to the
 * seeded record rather than to the old flow. That keeps every existing entry
 * point — Ask Gov answers, the category drill-down, deep links — landing
 * somewhere real instead of on a "coming soon" toast.
 */
export function resolveServiceAction(name, { openOverlay, showToast }) {
  switch (name) {
    case 'NIS registration':
      return () => openOverlay('nisReg');
    case 'Sickness Benefit':
      return () => openOverlay('benefit', { type: 'sickness' });
    case 'Maternity Benefit':
      return () => openOverlay('benefit', { type: 'maternity' });
    case 'Funeral Grant':
      return () => openOverlay('benefit', { type: 'funeral' });
    case 'Pay electricity bill':
      return () => openOverlay('gplPay');
    case 'Report an outage':
      return () => openOverlay('gplOutage');
    case 'Guyana Passport':
      return () => openOverlay('apply', { serviceId: 'passport' });
    // --- names that moved to the seeded catalogue ---
    case 'Cash Grant':
      return () => openOverlay('serviceView', { serviceId: 'svc_cash_grant' });
    case 'Birth certificate copy':
      return () => openOverlay('serviceView', { serviceId: 'svc_gro_birth' });
    case 'Water connection':
      return () => openOverlay('serviceView', { serviceId: 'svc_sw_water_connection' });
    case 'New connection application':
      return () => openOverlay('serviceView', { serviceId: 'svc_sw_power_connection' });
    default:
      return () => showToast(`${name} — coming soon`);
  }
}

/**
 * Open a seeded service. Everything in the `services` table goes through the
 * same View screen; the Single Window group additionally has a hub of its own.
 * @param {import('../data/types').Service} service
 * @param {{openOverlay: (key: string, payload?: unknown) => void}} ctx
 */
export function openSeededService(service, { openOverlay }) {
  openOverlay('serviceView', { serviceId: service.id });
}

// Agencies with their own hub screen; every other agency is reached through
// its services category. Shared by the Home tiles and the agencies sheet.
export const AGENCY_HUBS = ['nis', 'gpl', 'mops'];

// The citizen-facing "services" the Final design pins to Home — the name and
// colour a citizen sees for an agency relationship (Digital ID, not MoPS).
// Order is the design's grid order.
export const SERVICE_ACCESS = {
  mops: { id: 'mops', name: 'Digital ID', icon: 'id-card', color: '#8b2346' },
  nis: { id: 'nis', name: 'Social Security', icon: 'shield-check', color: '#00674c' },
  gpl: { id: 'gpl', name: 'Electricity', icon: 'zap', color: '#b45309' },
  gwi: { id: 'gwi', name: 'Water', icon: 'droplets', color: '#0e7490' },
  gra: { id: 'gra', name: 'Tax & Revenue', icon: 'receipt-text', color: '#2563c9' },
  housing: { id: 'housing', name: 'Housing', icon: 'home', color: '#b5651d' },
  gro: { id: 'gro', name: 'Birth & Records', icon: 'file-text', color: '#7a4fbf' },
  humanServices: { id: 'humanServices', name: 'Public Assistance', icon: 'hand-heart', color: '#c2255c' },
};
export const SERVICE_ACCESS_ORDER = Object.keys(SERVICE_ACCESS);

export function agencyCategoryId(agencyId) {
  return SERVICE_DIRECTORY.find((c) => c.agency === agencyId)?.id || null;
}

/** The legacy directory, flattened for the tile grid and the search index. */
export function flattenServices() {
  return SERVICE_DIRECTORY.flatMap((cat) =>
    cat.services.map((name) => ({
      id: `${cat.id}::${name}`,
      name,
      categoryId: cat.id,
      categoryName: cat.name,
      agency: cat.agency,
      comingSoon: !!cat.comingSoon,
      icon: SERVICE_ICONS[name] || cat.icon,
      source: 'legacy',
    }))
  );
}

/**
 * Every seeded service, flattened into the same shape the tile grid uses, so
 * the two sources can be searched and rendered together.
 * @returns {Promise<{
 *   id: string, name: string, categoryId: string, categoryName: string,
 *   agency: string, comingSoon: boolean, icon: string, source: 'seeded',
 *   group: import('../data/types').ServiceGroup, serviceId: string, summary: string
 * }[]>}
 */
export async function flattenSeededServices() {
  const services = await listServices();
  return services.map((s) => ({
    id: `seeded::${s.id}`,
    serviceId: s.id,
    name: s.name,
    categoryId: s.group,
    categoryName: SERVICE_GROUPS[s.group]?.name || s.group,
    agency: s.agencyId,
    comingSoon: false,
    icon: s.icon,
    source: 'seeded',
    group: s.group,
    summary: s.summary,
  }));
}

/** The two grouped sections the Services screen can lead with. */
export const FEATURED_GROUPS = [
  {
    id: 'singleWindow',
    ...SERVICE_GROUPS.singleWindow,
    overlay: 'singleWindow',
    icon: 'building-2',
  },
  {
    id: 'gro',
    ...SERVICE_GROUPS.gro,
    overlay: null, // no hub — its three services stand on their own
    icon: 'book-open',
  },
];

export { SERVICE_GROUPS };
