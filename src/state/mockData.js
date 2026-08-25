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

  // --- Full master list (~49 agencies). A citizen's government record links
  // them to agencies from this list; signup pulls every linked one in — no
  // hand-picked subset (backlog 1.5). Only NIS/MoPS/GPL have in-app hubs;
  // the rest are reachable through their services.
  moh: {
    id: 'moh', name: 'Ministry of Health', shortName: 'MoH',
    icon: 'heart-pulse', mark: '#c02a3c', dataAgency: 'moh',
  },
  moe: {
    id: 'moe', name: 'Ministry of Education', shortName: 'MoE',
    icon: 'graduation-cap', mark: '#1f6fb2', dataAgency: 'moe',
  },
  moha: {
    id: 'moha', name: 'Ministry of Home Affairs', shortName: 'MoHA',
    icon: 'shield', mark: '#31456e', dataAgency: 'moha',
  },
  moa: {
    id: 'moa', name: 'Ministry of Agriculture', shortName: 'MoA',
    icon: 'wheat', mark: '#7a8c1e', dataAgency: 'moa',
  },
  mola: {
    id: 'mola', name: 'Ministry of Legal Affairs', shortName: 'Legal Affairs',
    icon: 'scale', mark: '#5b3a8e', dataAgency: 'mola',
  },
  mofa: {
    id: 'mofa', name: 'Ministry of Foreign Affairs', shortName: 'Foreign Affairs',
    icon: 'globe', mark: '#0f6a8b', dataAgency: 'mofa',
  },
  mopw: {
    id: 'mopw', name: 'Ministry of Public Works', shortName: 'Public Works',
    icon: 'construction', mark: '#a8621c', dataAgency: 'mopw',
  },
  monr: {
    id: 'monr', name: 'Ministry of Natural Resources', shortName: 'Natural Resources',
    icon: 'mountain', mark: '#4e6151', dataAgency: 'monr',
  },
  moaa: {
    id: 'moaa', name: 'Ministry of Amerindian Affairs', shortName: 'Amerindian Affairs',
    icon: 'trees', mark: '#2f7d4f', dataAgency: 'moaa',
  },
  mocys: {
    id: 'mocys', name: 'Ministry of Culture, Youth & Sport', shortName: 'Culture & Sport',
    icon: 'trophy', mark: '#b3691a', dataAgency: 'mocys',
  },
  motic: {
    id: 'motic', name: 'Ministry of Tourism, Industry & Commerce', shortName: 'Tourism & Commerce',
    icon: 'briefcase', mark: '#0e7f74', dataAgency: 'motic',
  },
  mol: {
    id: 'mol', name: 'Ministry of Labour', shortName: 'Labour',
    icon: 'hard-hat', mark: '#8a5a13', dataAgency: 'mol',
  },
  molg: {
    id: 'molg', name: 'Ministry of Local Government & Regional Development', shortName: 'Local Government',
    icon: 'map', mark: '#396fa5', dataAgency: 'molg',
  },
  gwi: {
    id: 'gwi', name: 'Guyana Water Inc.', shortName: 'GWI',
    icon: 'droplets', mark: '#0f7fbf', dataAgency: 'gwi',
  },
  gecom: {
    id: 'gecom', name: 'Guyana Elections Commission', shortName: 'GECOM',
    icon: 'vote', mark: '#6b2d5c', dataAgency: 'gecom',
  },
  gro: {
    id: 'gro', name: 'General Register Office', shortName: 'GRO',
    icon: 'book-open', mark: '#7d3550', dataAgency: 'gro',
  },
  gpf: {
    id: 'gpf', name: 'Guyana Police Force', shortName: 'Police',
    icon: 'siren', mark: '#25355f', dataAgency: 'gpf',
  },
  gfs: {
    id: 'gfs', name: 'Guyana Fire Service', shortName: 'Fire Service',
    icon: 'flame', mark: '#c2452a', dataAgency: 'gfs',
  },
  gprs: {
    id: 'gprs', name: 'Guyana Prison Service', shortName: 'Prison Service',
    icon: 'building-2', mark: '#4a4f57', dataAgency: 'gprs',
  },
  deeds: {
    id: 'deeds', name: 'Deeds & Commercial Registries Authority', shortName: 'Deeds Registry',
    icon: 'stamp', mark: '#6e4a1f', dataAgency: 'deeds',
  },
  glsc: {
    id: 'glsc', name: 'Guyana Lands & Surveys Commission', shortName: 'Lands & Surveys',
    icon: 'land-plot', mark: '#5c7d2a', dataAgency: 'glsc',
  },
  ggmc: {
    id: 'ggmc', name: 'Guyana Geology & Mines Commission', shortName: 'GGMC',
    icon: 'gem', mark: '#8c6d1f', dataAgency: 'ggmc',
  },
  gfc: {
    id: 'gfc', name: 'Guyana Forestry Commission', shortName: 'Forestry',
    icon: 'tree-pine', mark: '#1e6b3a', dataAgency: 'gfc',
  },
  epa: {
    id: 'epa', name: 'Environmental Protection Agency', shortName: 'EPA',
    icon: 'leaf', mark: '#3a8e33', dataAgency: 'epa',
  },
  gnbs: {
    id: 'gnbs', name: 'Guyana National Bureau of Standards', shortName: 'GNBS',
    icon: 'ruler', mark: '#3d5aa8', dataAgency: 'gnbs',
  },
  fdd: {
    id: 'fdd', name: 'Government Analyst — Food & Drug Department', shortName: 'Food & Drug',
    icon: 'pill', mark: '#a53468', dataAgency: 'fdd',
  },
  glda: {
    id: 'glda', name: 'Guyana Livestock Development Authority', shortName: 'GLDA',
    icon: 'beef', mark: '#96522a', dataAgency: 'glda',
  },
  grdb: {
    id: 'grdb', name: 'Guyana Rice Development Board', shortName: 'GRDB',
    icon: 'sprout', mark: '#658a1f', dataAgency: 'grdb',
  },
  ndia: {
    id: 'ndia', name: 'National Drainage & Irrigation Authority', shortName: 'NDIA',
    icon: 'waves', mark: '#2277a8', dataAgency: 'ndia',
  },
  marad: {
    id: 'marad', name: 'Maritime Administration Department', shortName: 'MARAD',
    icon: 'anchor', mark: '#144d73', dataAgency: 'marad',
  },
  gcaa: {
    id: 'gcaa', name: 'Guyana Civil Aviation Authority', shortName: 'GCAA',
    icon: 'plane-takeoff', mark: '#4557a0', dataAgency: 'gcaa',
  },
  gpo: {
    id: 'gpo', name: 'Guyana Post Office Corporation', shortName: 'Post Office',
    icon: 'mailbox', mark: '#b0353c', dataAgency: 'gpo',
  },
  natlib: {
    id: 'natlib', name: 'National Library of Guyana', shortName: 'National Library',
    icon: 'library', mark: '#69518c', dataAgency: 'natlib',
  },
  courts: {
    id: 'courts', name: 'Supreme Court of Judicature', shortName: 'Courts',
    icon: 'gavel', mark: '#59452e', dataAgency: 'courts',
  },
  goinvest: {
    id: 'goinvest', name: 'Guyana Office for Investment', shortName: 'Go-Invest',
    icon: 'trending-up', mark: '#0d7a5c', dataAgency: 'goinvest',
  },
  sbb: {
    id: 'sbb', name: 'Small Business Bureau', shortName: 'SBB',
    icon: 'store', mark: '#c07a1d', dataAgency: 'sbb',
  },
  bit: {
    id: 'bit', name: 'Board of Industrial Training', shortName: 'BIT',
    icon: 'wrench', mark: '#54687d', dataAgency: 'bit',
  },
  uog: {
    id: 'uog', name: 'University of Guyana', shortName: 'UG',
    icon: 'school', mark: '#1d5e3f', dataAgency: 'uog',
  },
  ndma: {
    id: 'ndma', name: 'National Data Management Authority', shortName: 'NDMA',
    icon: 'server', mark: '#3c4a9e', dataAgency: 'ndma',
  },
  cdc: {
    id: 'cdc', name: 'Civil Defence Commission', shortName: 'CDC',
    icon: 'life-buoy', mark: '#b3411f', dataAgency: 'cdc',
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
