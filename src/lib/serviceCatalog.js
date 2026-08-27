// Shared service-catalogue helpers: per-service icon overrides, the mapping
// from a service name to the real overlay flow it opens, and the flattened
// index the search uses. Shared by the Services screen and the full-screen
// category drill-down (backlog 3.1/3.3).
import { SERVICE_DIRECTORY } from '../state/mockData';

// Per-service icon overrides — falls back to the parent category's icon
// when a service isn't named here.
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

// Maps a service name to the real overlay flow it should open. Anything not
// listed here has no built flow yet, so it just surfaces a toast. The e-ID is
// not a service (backlog 3.7) — it is applied for from Home and accessed from
// the Vault/profile, so it has no entry here.
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
    case 'Cash Grant':
      return () => openOverlay('apply', { serviceId: 'cashGrant' });
    default:
      return () => showToast(`${name} — coming soon`);
  }
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
    }))
  );
}
