// Mock "government database" — the records the state already holds about a
// citizen, which the sign-in / account-creation flows look up. This stands in
// for the real registry integrations (DICR e-ID, GECOM, GRA, Immigration,
// Guyana Police Force) that a production app would call.
//
// Two demo citizens, each with fully self-consistent details (no value is
// shared or mismatched across a person's documents):
//   • Nicole Persaud — already has an e-ID (E1234567890)
//   • John Doe       — no e-ID yet, but is on record with other documents
//
// The sample documents in public/sample-docs/ are generated from these exact
// values (see scripts/gen-sample-docs.mjs), so scanning a sample card resolves
// to the same record a typed number would.

import { AGENCIES } from './mockData';

// Every live agency in the master list (~49, minus the few not yet on
// My Guyana). A registered citizen's government record links them to each
// agency that holds anything in their name — signup pulls the whole set in,
// never a hand-picked few (backlog 1.5).
const LINKED_AGENCY_IDS = Object.values(AGENCIES)
  .filter((a) => !a.comingSoon)
  .map((a) => a.id);

export const GOV_CITIZENS = [
  {
    id: 'nicole',
    firstName: 'Nicole',
    lastName: 'Persaud',
    name: 'Nicole Persaud',
    initials: 'NP',
    dob: '1990-04-12',
    gender: 'f',
    region: 'r4', // Region 4 — Demerara-Mahaica
    placeOfBirth: 'Georgetown, Guyana',
    address: 'Lot 22 Republic Road, Georgetown',
    phone: '+592 611 4820',
    phoneMasked: '••• ••• 4820',
    email: 'nicole.persaud@example.gy',
    emailMasked: 'n••••••@example.gy',

    // Identity documents on record
    hasEid: true,
    // e-ID number as printed on the card (format as issued by MoPS; backlog 1.1).
    eidNo: 'E1234567890',
    eidCardNo: '0000 1234 5678', // number printed on the physical smart card
    nationalId: 'N1234567890',
    passport: 'P1234567890',
    driversLicence: 'DL1234567890',
    // Expires this October — close enough for the GRA renewal flow to be the
    // obvious demo on her account (GRA advises renewing 3 months ahead).
    driversLicenceExpiry: '2026-10-15',
    tin: '1234567890',

    // Agencies holding a record in her name — connected automatically at signup.
    linkedAgencies: LINKED_AGENCY_IDS,

    // Her employer already registered her with NIS before she signed up, so the
    // NIS record arrives connected and active. First sign-up tells her so with a
    // push card on Home and asks her to confirm the employer's details.
    nisRegistration: {
      employer: 'Devcon Construction Ltd.',
      registeredOn: '2026-07-30',
      nisNumber: 'NIS-2201-84732',
      contributions: { paid: 500, required: 750, weeks: 500, requiredWeeks: 750 },
    },
  },
  {
    id: 'john',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    initials: 'JD',
    dob: '1985-09-30',
    gender: 'm',
    region: 'r4', // Region 4 — Demerara-Mahaica
    placeOfBirth: 'New Amsterdam, Guyana',
    // No verified current address on record — the one detail his profile asks
    // him to complete after sign-up (backlog 2.3–2.5). His older documents still
    // print his last known address.
    address: null,
    phone: '+592 645 7391',
    phoneMasked: '••• ••• 7391',
    email: 'john.doe@example.gy',
    emailMasked: 'j••••@example.gy',

    // No e-ID yet — this is why account creation must book an enrolment visit.
    hasEid: false,
    eidNo: null,
    eidCardNo: null,
    nationalId: 'N0987654321',
    passport: 'P0987654321',
    driversLicence: 'DL0987654321',
    driversLicenceExpiry: '2028-06-30',
    tin: '0987654321',

    // Agencies holding a record in his name — connected automatically at signup.
    linkedAgencies: LINKED_AGENCY_IDS,
  },
];

// Map the auth flow's document-type labels to the citizen field they match.
const DOC_FIELD = {
  'e-ID': 'eidNo',
  TIN: 'tin',
  'National ID': 'nationalId',
  Passport: 'passport',
  "Driver's licence": 'driversLicence',
};

// Loose normaliser so "E1234567890", "E123 4567 890" and "e1234567890"
// all compare equal — real cards are read/typed with inconsistent spacing and
// nobody types the prefix in the same case twice.
function norm(value) {
  return String(value ?? '').replace(/[\s-]/g, '').toUpperCase();
}

// Extract just the digits, most-significant grouping preserved — used for the
// e-ID card number, which is printed with spaces.
function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

// Look a citizen up by a typed/scanned document number.
export function findByDocument(type, number) {
  const field = DOC_FIELD[type];
  if (!field || !number) return null;
  const target = norm(number);
  if (!target) return null;
  return (
    GOV_CITIZENS.find((c) => c[field] && norm(c[field]) === target) || null
  );
}

// Look a citizen up by their e-ID — accepts either the printed e-ID number
// (E1234567890) or the long card number (0000 1234 5678).
export function findByEid(value) {
  if (!value) return null;
  const n = norm(value);
  const d = digits(value);
  return (
    GOV_CITIZENS.find((c) => {
      if (!c.hasEid) return false;
      if (c.eidNo && norm(c.eidNo) === n) return true;
      if (c.eidCardNo && digits(c.eidCardNo) === d && d.length >= 8) return true;
      return false;
    }) || null
  );
}

// Look a citizen up by a registered phone number or email (for returning
// sign-in by contact).
export function findByContact(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    return GOV_CITIZENS.find((c) => c.email.toLowerCase() === email) || null;
  }
  const d = digits(raw);
  if (d.length < 4) return null;
  return GOV_CITIZENS.find((c) => digits(c.phone).endsWith(d)) || null;
}

// Lenient date-of-birth check used as a second factor alongside a number.
// Accepts the common DD/MM/YYYY the app asks for, but tolerates other digit
// orderings and separators; an empty input passes so the number alone can be
// used in low-stakes demo paths.
export function dobMatches(input, isoDob) {
  if (!input || !input.trim()) return true;
  if (!isoDob) return false;
  const [y, m, day] = isoDob.split('-').map((s) => parseInt(s, 10));
  const nums = (input.match(/\d+/g) || []).map((s) => parseInt(s, 10));
  const hasYear = nums.includes(y);
  const hasMonth = nums.includes(m);
  const hasDay = nums.includes(day);
  return hasYear && hasMonth && hasDay;
}

// The subset of a citizen record that the app persists on the signed-in
// session (see AuthFlow.buildUser) — everything the UI needs to prepopulate
// the profile without re-holding the whole registry.
export function toSessionGov(citizen) {
  if (!citizen) return null;
  return {
    // Where the details came from. A matched entry is the state's own record;
    // see declaredGov() for the other case.
    source: 'registry',
    citizenId: citizen.id,
    firstName: citizen.firstName,
    lastName: citizen.lastName,
    dob: citizen.dob,
    gender: citizen.gender,
    region: citizen.region,
    placeOfBirth: citizen.placeOfBirth,
    address: citizen.address,
    phone: citizen.phone,
    phoneMasked: citizen.phoneMasked,
    email: citizen.email,
    emailMasked: citizen.emailMasked,
    nationalId: citizen.nationalId,
    passport: citizen.passport,
    driversLicence: citizen.driversLicence,
    driversLicenceExpiry: citizen.driversLicenceExpiry || null,
    tin: citizen.tin,
  };
}

// The record for a citizen the registry does not hold.
//
// Someone who creates an account by hand is still a citizen with a name, a date
// of birth and a document number — they are simply not in this demo registry.
// Without a record of their own, every screen that reads `user.gov` treated them
// as having no details at all: applications could not be prefilled, age could
// not be checked, and a GRO registration number could not be matched to them.
// So what they typed becomes their record, marked as declared rather than
// matched, and the app works the same way for them as for a matched citizen.
//
// @param {{first?: string, last?: string, dob?: string, gender?: string, phone?: string, email?: string, country?: string}} fields
// @param {{docType?: string, docNo?: string}} [doc] the ID they registered with
export function declaredGov(fields = {}, doc = {}) {
  const first = String(fields.first || '').trim();
  const last = String(fields.last || '').trim();
  if (!first && !last && !fields.dob) return null;

  const no = String(doc.docNo || '').trim() || null;
  // The number goes in the slot for the document type it belongs to, so a
  // National ID typed at sign-up is found where everything else looks for one.
  const byType = {
    'national-id': 'nationalId',
    'National ID': 'nationalId',
    passport: 'passport',
    Passport: 'passport',
    licence: 'driversLicence',
    "Driver's licence": 'driversLicence',
    tin: 'tin',
    TIN: 'tin',
  }[doc.docType] || null;

  return {
    source: 'declared',
    citizenId: null,
    firstName: first,
    lastName: last,
    dob: fields.dob || null,
    gender: fields.gender || null,
    region: fields.region || null,
    placeOfBirth: fields.country || null,
    address: fields.address || null,
    phone: fields.phone || null,
    phoneMasked: maskContact(fields.phone),
    email: fields.email || null,
    emailMasked: maskContact(fields.email),
    nationalId: byType === 'nationalId' ? no : null,
    passport: byType === 'passport' ? no : null,
    driversLicence: byType === 'driversLicence' ? no : null,
    tin: byType === 'tin' ? no : null,
  };
}

// Same masking the registry entries carry, so a declared contact is shown the
// way a matched one is.
function maskContact(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.includes('@')) {
    const [name, domain] = v.split('@');
    return `${name.slice(0, 1)}${'•'.repeat(Math.max(1, name.length - 1))}@${domain}`;
  }
  const tail = v.replace(/\D/g, '').slice(-4);
  return tail ? `••• ••• ${tail}` : null;
}
