// The citizen's personal information as the Final design lays it out: four
// cards (Identity & contact · Demographics · Family · Employment), each a list
// of fields. One definition so Home's avatar dot, the profile row badge and the
// Personal information page can never disagree (backlog 2.3–2.5): completeness
// is derived from the data, not a flag.
//
// Value precedence per field: what the citizen entered (user.profile) → the
// government record (govKey) → the session (userKey) → the connected-agency
// data (personaKey) → a default. A value that came from the record is LOCKED
// (changed at the issuing agency, never here). Required fields are the ones
// every agency needs to reach a citizen; everything else is optional.
export const PROFILE_SECTIONS = [
  {
    id: 'identity', title: 'Identity & contact',
    fields: [
      { id: 'aka', label: 'Also known as', placeholder: 'Other names you use' },
      { id: 'nationalId', label: 'National ID number', govKey: 'nationalId', masked: true, locked: true },
      { id: 'eidNo', label: 'e-ID number', userKey: 'eidNo', masked: true, locked: true },
      { id: 'address', label: 'Home address', govKey: 'address', required: true, placeholder: 'Lot, street, village or ward' },
      { id: 'ward', label: 'Ward / village', placeholder: 'e.g. Campbellville' },
      { id: 'county', label: 'County', placeholder: 'Demerara, Berbice or Essequibo' },
      { id: 'phone', label: 'Mobile', govKey: 'phone', required: true, type: 'tel', placeholder: 'e.g. 677 4820' },
      { id: 'email', label: 'Email', govKey: 'email', required: true, type: 'email', placeholder: 'you@example.gy' },
    ],
  },
  {
    id: 'demographics', title: 'Demographics',
    fields: [
      { id: 'maritalStatus', label: 'Marital status', placeholder: 'Single, married, …' },
      { id: 'countryOfOrigin', label: 'Country of origin', defaultValue: 'Guyana' },
      { id: 'placeOfBirth', label: 'Place of birth', govKey: 'placeOfBirth', placeholder: 'Town and country' },
      { id: 'motherName', label: "Mother's name", placeholder: 'Full name' },
      { id: 'motherMaidenName', label: "Mother's maiden name", placeholder: 'Surname at birth' },
    ],
  },
  {
    id: 'family', title: 'Family',
    fields: [
      { id: 'spouse', label: 'Spouse', placeholder: 'Full name' },
      { id: 'children', label: 'Children under 18', placeholder: 'Names, or how many' },
      { id: 'parents', label: 'Parents', placeholder: 'Full names' },
    ],
  },
  {
    id: 'employment', title: 'Employment',
    note: 'Occupation is pending confirmation with NIS before it appears on your record.',
    fields: [
      { id: 'occupation', label: 'Occupation', placeholder: 'e.g. Teacher' },
      { id: 'sector', label: 'Sector', placeholder: 'Public, private, self-employed' },
      { id: 'employer', label: 'Employer', personaKey: 'nisEmployer', placeholder: 'Company or organisation' },
    ],
  },
];

// Show the last four characters, hide the rest (dashes kept) — the design's
// treatment for identity numbers: "•••-••••-8901".
export function maskId(value) {
  const s = String(value || '');
  if (!s) return '';
  const digitsRev = [];
  let kept = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i];
    if (/[0-9A-Za-z]/.test(ch)) { digitsRev.push(kept < 4 ? ch : '•'); kept++; }
    else digitsRev.push(ch);
  }
  return digitsRev.reverse().join('');
}

function resolve(field, user, persona) {
  const own = user?.profile?.[field.id];
  if (own) return { value: own, source: 'own' };
  if (field.govKey && user?.gov?.[field.govKey]) return { value: user.gov[field.govKey], source: 'gov' };
  if (field.userKey && user?.[field.userKey]) return { value: user[field.userKey], source: 'gov' };
  if (field.personaKey && persona?.[field.personaKey]) {
    const v = persona[field.personaKey];
    return { value: typeof v === 'object' ? v.name : v, source: 'agency' };
  }
  if (field.defaultValue) return { value: field.defaultValue, source: 'default' };
  return { value: '', source: null };
}

// The sections with every field resolved for the signed-in citizen.
export function profileSections(user, persona) {
  return PROFILE_SECTIONS.map((sec) => ({
    ...sec,
    fields: sec.fields.map((f) => {
      const { value, source } = resolve(f, user, persona);
      return {
        ...f,
        value,
        display: f.masked && value ? maskId(value) : value,
        source,
        // Locked when the record supplied it (or the field is identity-only).
        locked: !!f.locked || source === 'gov' || source === 'agency',
        missing: !!f.required && !value,
      };
    }),
  }));
}

// Flat list of every field — what the profile sheet's summary rows use.
export function personalRows(user, persona) {
  return profileSections(user, persona).flatMap((s) => s.fields);
}

// The required fields that have no value anywhere yet — what the citizen is
// asked to complete. Empty when there is no signed-in user.
export function missingPersonalFields(user, persona) {
  return user ? personalRows(user, persona).filter((r) => r.missing) : [];
}
