// #5 — the requirements engine. One config describes what each application
// asks for: personal fields, the documents that must be attached, and whether
// an in-person appointment is needed. The generic ApplyFlow overlay renders
// straight from these definitions.
//
// Only the passport still lives here. Cash Grants, the Single Window services
// and the GRO certificates moved to the seeded `services` table (src/data/seed)
// and render through the shared View / Apply / Track shell in overlays/service.
//
// Field: { key, label, type: 'text'|'tel'|'email'|'date'|'select', options?, required, hint? }
// Document: { id, label, issuer, required, hint?, source? }
//   source 'vault'  — an ID or certificate government already holds: the citizen
//                     connects it from their Vault, never uploads it.
//   source omitted  — something only the citizen has (a photo, a pay slip, proof
//                     of address): uploaded.

export const APPLICATION_DEFS = {
  passport: {
    id: 'passport',
    agency: 'immigration',
    title: 'Guyana Passport',
    blurb: 'Apply for a machine-readable Guyana passport. Bring your originals to the appointment — the Passport Office verifies them and captures your photo and fingerprints.',
    connectsAgency: true,
    appointment: {
      label: 'Book your Passport Office visit',
      note: 'Photo, signature and fingerprints are captured in person.',
    },
    fields: [
      { key: 'surname', label: 'Surname', type: 'text', required: true },
      { key: 'givenNames', label: 'Given names', type: 'text', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date', required: true },
      { key: 'placeOfBirth', label: 'Place of birth', type: 'text', required: true, hint: 'Town/village and country' },
      { key: 'occupation', label: 'Occupation', type: 'text', required: true },
      {
        key: 'applicationType', label: 'Application type', type: 'select', required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'first', label: 'First passport' },
          { value: 'renewal', label: 'Renewal' },
          { value: 'replacement', label: 'Replacement (lost/damaged)' },
        ],
      },
    ],
    documents: [
      { id: 'birthCert', accepts: ['BIRTH_CERTIFICATE'], label: 'Birth certificate', issuer: 'General Register Office', required: true, source: 'vault', hint: 'Original Guyana birth certificate — the primary proof of citizenship' },
      { id: 'nationalId', accepts: ['NID', 'PASSPORT'], label: 'National ID or current passport', issuer: 'GECOM / Immigration', required: true, source: 'vault', hint: 'Valid photo ID in your current name' },
      { id: 'clearance', accepts: ['POLICE_CLEARANCE'], label: 'Police clearance certificate', issuer: 'Guyana Police Force', required: true, source: 'vault', hint: 'Not in your Vault yet? Apply for it right here, together with your passport application.' },
      { id: 'passportPhoto', accepts: ['PASSPORT_PHOTO'], label: 'Passport photograph', issuer: 'Recent, colour', required: true, hint: 'Plain background, taken within the last 6 months' },
      { id: 'proofAddress', accepts: ['PROOF_OF_ADDRESS'], label: 'Proof of address', issuer: 'Dated within 3 months', required: false, hint: 'Utility bill or bank statement' },
    ],
  },

};

export function getApplicationDef(serviceId) {
  return APPLICATION_DEFS[serviceId] || null;
}
