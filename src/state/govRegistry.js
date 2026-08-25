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
    eidNo: 'E1234567890',
    eidCardNo: '0000 1234 5678', // number printed on the physical smart card
    nationalId: 'N1234567890',
    passport: 'P1234567890',
    driversLicence: 'DL1234567890',
    tin: '1234567890',

    // Agencies holding a record in her name — connected automatically at signup.
    linkedAgencies: LINKED_AGENCY_IDS,
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
    address: 'Lot 8 Sheriff Street, Georgetown',
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

// Loose normaliser so "E1234567890", "e1234567890" and "e-123 456 7890" all
// compare equal — real cards are read/typed with inconsistent spacing.
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
    tin: citizen.tin,
  };
}
