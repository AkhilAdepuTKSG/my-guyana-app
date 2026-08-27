// Seeded agency reference data.
//
// These are the bodies that own or review the three services. Ids and identity
// colours match src/state/mockData.js where an agency already exists there, so
// a service rendered from the database looks identical to one rendered from the
// legacy catalogue. The three new rows (CH&PA, Central Board of Health, Sea
// Defence) are the Single Window participants the legacy list never carried.

/** @type {import('../types').Agency[]} */
export const AGENCY_SEED = [
  {
    id: 'chpa',
    name: 'Central Housing & Planning Authority',
    shortName: 'CH&PA',
    icon: 'home',
    mark: '#b45f16',
  },
  {
    id: 'gwi',
    name: 'Guyana Water Inc.',
    shortName: 'GWI',
    icon: 'droplets',
    mark: '#0f7fbf',
  },
  {
    id: 'gpl',
    name: 'Guyana Power & Light',
    shortName: 'GPL',
    icon: 'zap',
    mark: '#404293',
  },
  {
    id: 'epa',
    name: 'Environmental Protection Agency',
    shortName: 'EPA',
    icon: 'leaf',
    mark: '#3a8e33',
  },
  {
    id: 'cbh',
    name: 'Central Board of Health',
    shortName: 'Central Board of Health',
    icon: 'heart-pulse',
    mark: '#c02a3c',
  },
  {
    id: 'mopw',
    name: 'Ministry of Public Works',
    shortName: 'Public Works',
    icon: 'construction',
    mark: '#a8621c',
  },
  {
    id: 'glsc',
    name: 'Guyana Lands & Surveys Commission',
    shortName: 'Lands & Surveys',
    icon: 'land-plot',
    mark: '#5c7d2a',
  },
  {
    id: 'gfs',
    name: 'Guyana Fire Service',
    shortName: 'Fire Service',
    icon: 'flame',
    mark: '#c2452a',
  },
  {
    id: 'seadefence',
    name: 'Sea & River Defence Department',
    shortName: 'Sea Defence',
    icon: 'waves',
    mark: '#146b8c',
  },
  {
    id: 'mof',
    name: 'Ministry of Finance',
    shortName: 'MoF',
    icon: 'banknote',
    mark: '#0f7b6c',
  },
  {
    id: 'gro',
    name: 'General Register Office',
    shortName: 'GRO',
    icon: 'book-open',
    mark: '#7d3550',
  },
];
