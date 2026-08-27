// The personal details My Guyana expects on a citizen's profile, where each one
// comes from, and what is still missing. One definition so Home's avatar badge,
// the profile section, the banner and the Personal Information page can never
// disagree (backlog 2.3–2.5): completeness is derived from the data, not a flag.
//
// A value comes from the government record first (never asked for again); only
// what the record could not supply is asked of the citizen. Required fields are
// the ones every agency needs to reach a citizen — occupation stays optional so a
// fully-on-record citizen is never flagged.
export const PERSONAL_FIELDS = [
  { id: 'email', label: 'Email', icon: 'mail', type: 'email', required: true, placeholder: 'you@example.gy', govKey: 'email' },
  { id: 'phone', label: 'Mobile', icon: 'smartphone', type: 'tel', required: true, placeholder: 'e.g. 677 4820', govKey: 'phone' },
  { id: 'address', label: 'Address', icon: 'map-pin', type: 'text', required: true, placeholder: 'Lot, street, village or ward', govKey: 'address' },
  { id: 'occupation', label: 'Occupation', icon: 'briefcase', type: 'text', required: false, placeholder: 'e.g. Teacher' },
  { id: 'tin', label: 'TIN', icon: 'receipt', readOnly: true, govKey: 'tin' },
];

// Every field with its resolved value and provenance for the signed-in citizen.
export function personalRows(user) {
  const gov = user?.gov || {};
  const filled = user?.profile || {};
  return PERSONAL_FIELDS.map((f) => {
    const own = filled[f.id];
    const fromGov = f.govKey ? gov[f.govKey] : undefined;
    const value = own || fromGov || '';
    return {
      ...f,
      value,
      fromGov: !own && !!fromGov, // supplied by the record, so shown locked
      missing: !!f.required && !value,
    };
  });
}

// The required fields that have no value anywhere yet — what the citizen is
// asked to complete. Empty when there is no signed-in user.
export function missingPersonalFields(user) {
  return user ? personalRows(user).filter((r) => r.missing) : [];
}
