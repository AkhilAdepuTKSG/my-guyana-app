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

export const PERSONAS = {
  devindra: {
    id: 'devindra',
    name: 'Nicole Persaud',
    initials: 'NP',
    dob: '1990-04-12',
    region: 'r4',
    verified: true,
    nisNumber: 'NIS-2201-84732',
    nisAccountState: 'active', // none | pending | active
    eidStatus: 'issued', // none | applied | issued
    connectedAgencies: ['nis', 'mops', 'gpl'],
    contributions: { paid: 500, required: 750, weeks: 500, requiredWeeks: 750 },
    gpl: {
      account: 'GPL-88213-4', balance: 14250, dueDate: '2026-08-28', status: 'unpaid',
      usageKwh: [210, 198, 225, 240, 230, 260, 250, 245, 238, 255, 262, 248],
    },
  },
  aaliyah: {
    id: 'aaliyah',
    name: 'Aaliyah Persaud',
    initials: 'AP',
    dob: '2006-11-02',
    region: 'r4',
    verified: true,
    nisNumber: null,
    nisAccountState: 'none',
    eidStatus: 'none',
    connectedAgencies: ['mops'],
    contributions: { paid: 0, required: 750, weeks: 0, requiredWeeks: 750 },
    gpl: null,
  },
};

export const ONGOING_APPLICATIONS = [
  {
    id: 'app-eid-1', type: 'eid', agency: 'mops', title: 'National e-ID Card',
    status: 'In review', step: 2, totalSteps: 4,
    submittedOn: '2026-08-02', eta: 'Aug 20',
    documents: [{ name: 'Birth certificate', status: 'On file' }, { name: 'Proof of address', status: 'Uploaded' }],
    pendingActions: [],
  },
  {
    id: 'app-nis-1', type: 'nisReg', agency: 'nis', title: 'NIS Registration',
    status: 'Action needed', step: 1, totalSteps: 3,
    submittedOn: '2026-08-09', eta: 'Aug 16',
    documents: [{ name: 'Proof of employment', status: 'Missing' }],
    pendingActions: [{ label: 'Upload proof of employment' }],
  },
];

export const NOTIFICATIONS = [
  { id: 'n1', agency: 'nis', icon: 'shield-check', title: 'Employer filed your NIS registration', body: 'Devcon Construction Ltd. submitted a registration on your behalf. Review and confirm.', time: '2h ago', read: false },
  { id: 'n2', agency: 'mops', icon: 'landmark', title: 'e-ID application update', body: 'Your application moved to "In review."', time: '1d ago', read: false },
  { id: 'n3', agency: 'gpl', icon: 'zap', title: 'Bill ready', body: 'Your August electricity bill of $14,250 is ready.', time: '3d ago', read: true },
];

export const APPOINTMENTS = [
  { id: 'a1', agency: 'mops', title: 'e-ID enrolment appointment', location: 'MoPS Service Centre — Georgetown', date: '2026-08-20', time: '10:30 AM' },
];

export const PAYMENT_HISTORY = [
  { id: 'p1', agency: 'gpl', title: 'Electricity bill', amount: 13980, date: '2026-07-28', method: 'Bank transfer', status: 'Paid' },
  { id: 'p2', agency: 'nis', title: 'Voluntary contribution', amount: 4500, date: '2026-07-05', method: 'Debit card', status: 'Paid' },
  { id: 'p3', agency: 'gpl', title: 'Electricity bill', amount: 12760, date: '2026-06-27', method: 'Bank transfer', status: 'Paid' },
];

export const NIS_ACTIVITY = [
  { id: 'ac1', title: 'Contribution posted', subtitle: 'July 2026 · Devcon Construction Ltd.', date: '2026-08-01', amount: 4500 },
  { id: 'ac2', title: 'Contribution posted', subtitle: 'June 2026 · Devcon Construction Ltd.', date: '2026-07-01', amount: 4500 },
];

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

export const GPL_TICKETS = [
  { id: 't1', title: 'Outage report — Sophia', status: 'Resolved', date: '2026-07-14' },
];

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
