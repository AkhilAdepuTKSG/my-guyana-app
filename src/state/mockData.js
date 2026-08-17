// Shared mock/fixture data for the My Guyana prototype rebuild.
// All data here is invented placeholder data — there is no real backend.
// Screens should prefer reading from here; add local constants in your own
// file for anything screen-specific rather than editing this shared file.

export const AGENCIES = {
  nis: {
    id: 'nis', name: 'National Insurance Scheme', shortName: 'NIS',
    icon: 'shield-check', mark: '#00795a', dataAgency: 'nis',
  },
  mops: {
    id: 'mops', name: 'Ministry of Public Service', shortName: 'MoPS',
    icon: 'landmark', mark: '#8b2346', dataAgency: 'mops',
  },
  gpl: {
    id: 'gpl', name: 'Guyana Power & Light', shortName: 'GPL',
    icon: 'zap', mark: '#404293', dataAgency: 'gpl',
  },
  gra: {
    id: 'gra', name: 'Guyana Revenue Authority', shortName: 'GRA',
    icon: 'receipt', mark: '#2563c9', dataAgency: 'gra', comingSoon: true,
  },
  immigration: {
    id: 'immigration', name: 'Immigration & Passport', shortName: 'Immigration',
    icon: 'plane', mark: '#3a45b0', dataAgency: 'immigration',
  },
  mof: {
    id: 'mof', name: 'Ministry of Finance', shortName: 'MoF',
    icon: 'banknote', mark: '#0f7b6c', dataAgency: 'mof',
  },
  humanServices: {
    id: 'humanServices', name: 'Human Services & Social Security', shortName: 'Human Services',
    icon: 'hand-heart', mark: '#c2365f', dataAgency: 'human-services', comingSoon: true,
  },
  housing: {
    id: 'housing', name: 'Housing & Water (CH&PA)', shortName: 'Housing',
    icon: 'home', mark: '#b45f16', dataAgency: 'housing', comingSoon: true,
  },
  appointments: {
    id: 'appointments', name: 'Appointments (cross-government)', shortName: 'Appointments',
    icon: 'calendar-clock', mark: '#6d4bd8', dataAgency: 'appointments', comingSoon: true,
  },
};

// A freshly registered citizen starts empty: no agencies connected, no NIS
// record, no linked electricity account, no e-ID yet. The app fills up only
// from what the citizen actually does (connecting agencies, applying for
// things, booking appointments). The display name/initials are overlaid from
// the signed-in session in AppStateContext — the value here is just a
// pre-sign-in placeholder.
export const PERSONAS = {
  citizen: {
    id: 'citizen',
    name: '',
    initials: '',
    dob: '',
    region: 'r4',
    verified: false,
    nisNumber: null,
    nisAccountState: 'none', // none | pending | active
    eidStatus: 'none', // none | applied | issued
    connectedAgencies: [],
    contributions: { paid: 0, required: 750, weeks: 0, requiredWeeks: 750 },
    gpl: null,
  },
};

// Everything below is per-citizen activity that a brand-new account has none
// of. It stays empty by default; real submissions/notifications the citizen
// generates are persisted separately (see AppStateContext).
export const ONGOING_APPLICATIONS = [];

export const NOTIFICATIONS = [];

export const APPOINTMENTS = [];

export const PAYMENT_HISTORY = [];

export const NIS_ACTIVITY = [];

export const NIS_BENEFITS = [
  { id: 'b-sick', key: 'sickness', name: 'Sickness Benefit', icon: 'thermometer' },
  { id: 'b-mat', key: 'maternity', name: 'Maternity Benefit', icon: 'baby' },
  { id: 'b-fun', key: 'funeral', name: 'Funeral Grant', icon: 'flower-2' },
  { id: 'b-inj', key: 'injury', name: 'Injury Benefit', icon: 'bandage' },
];

export const SERVICE_DIRECTORY = [
  { id: 'cat-id', name: 'Identity & Records', icon: 'id-card', agency: 'mops', services: ['National e-ID Card', 'Birth certificate copy', 'Change of name'] },
  { id: 'cat-social', name: 'Social Security', icon: 'shield-check', agency: 'nis', services: ['NIS registration', 'Sickness Benefit', 'Maternity Benefit', 'Funeral Grant', 'Pension estimate'] },
  { id: 'cat-utilities', name: 'Utilities', icon: 'zap', agency: 'gpl', services: ['Pay electricity bill', 'Report an outage', 'New connection application'] },
  { id: 'cat-immigration', name: 'Immigration & Passport', icon: 'plane', agency: 'immigration', services: ['Guyana Passport'] },
  { id: 'cat-finance', name: 'Finance & Grants', icon: 'banknote', agency: 'mof', services: ['Cash Grant'] },
  { id: 'cat-revenue', name: 'Revenue & Tax', icon: 'receipt', agency: 'gra', services: ['TIN registration', 'File annual return'], comingSoon: true },
  { id: 'cat-housing', name: 'Housing & Land', icon: 'home', agency: 'housing', services: ['House lot application', 'Water connection'], comingSoon: true },
];

export const GPL_TICKETS = [];

export const REGIONS = [
  { id: 'r1', name: 'Region 1 — Barima-Waini' },
  { id: 'r2', name: 'Region 2 — Pomeroon-Supenaam' },
  { id: 'r3', name: 'Region 3 — Essequibo Islands-West Demerara' },
  { id: 'r4', name: 'Region 4 — Demerara-Mahaica' },
  { id: 'r5', name: 'Region 5 — Mahaica-Berbice' },
  { id: 'r6', name: 'Region 6 — East Berbice-Corentyne' },
  { id: 'r7', name: 'Region 7 — Cuyuni-Mazaruni' },
  { id: 'r8', name: 'Region 8 — Potaro-Siparuni' },
  { id: 'r9', name: 'Region 9 — Upper Takutu-Upper Essequibo' },
  { id: 'r10', name: 'Region 10 — Upper Demerara-Berbice' },
];

export const SERVICE_CENTRES = [
  { id: 'sc1', name: 'MoPS Service Centre — Georgetown', address: '1 Water St, Georgetown' },
  { id: 'sc2', name: 'MoPS Service Centre — Linden', address: 'Mackenzie, Linden' },
  { id: 'sc3', name: 'MoPS Service Centre — New Amsterdam', address: 'Main St, New Amsterdam' },
];
