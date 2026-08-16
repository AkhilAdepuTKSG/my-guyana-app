// #5 — the requirements engine. One config describes what each application
// asks for: personal fields, the documents that must be attached, and whether
// an in-person appointment is needed. The generic ApplyFlow overlay renders
// straight from these definitions, so adding an agency/service (e.g. #4 Passport,
// #6 Cash Grant) is a data change, not a new bespoke screen.
//
// Field: { key, label, type: 'text'|'tel'|'email'|'date'|'select', options?, required, hint? }
// Document: { id, label, issuer, required, hint? }

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
      { id: 'birthCert', label: 'Birth certificate', issuer: 'General Register Office', required: true, hint: 'Original Guyana birth certificate — the primary proof of citizenship' },
      { id: 'nationalId', label: 'National ID or current passport', issuer: 'GECOM / Immigration', required: true, hint: 'Valid photo ID in your current name' },
      { id: 'passportPhoto', label: 'Passport photograph', issuer: 'Recent, colour', required: true, hint: 'Plain background, taken within the last 6 months' },
      { id: 'proofAddress', label: 'Proof of address', issuer: 'Dated within 3 months', required: false, hint: 'Utility bill or bank statement' },
    ],
  },

  cashGrant: {
    id: 'cashGrant',
    agency: 'mof',
    title: 'Cash Grant',
    blurb: 'Apply to the Ministry of Finance for a cash grant. We check your details against your records and pay approved grants to your linked bank account.',
    connectsAgency: true,
    appointment: null, // reviewed remotely, no in-person visit
    fields: [
      {
        key: 'grantType', label: 'Which grant?', type: 'select', required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'because-i-care', label: 'Because We Care school grant' },
          { value: 'public-assistance', label: 'Public assistance' },
          { value: 'one-off', label: 'One-off relief grant' },
        ],
      },
      {
        key: 'householdSize', label: 'People in your household', type: 'select', required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
          { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6+', label: '6 or more' },
        ],
      },
      {
        key: 'monthlyIncome', label: 'Household monthly income', type: 'select', required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: '0-50k', label: 'Under $50,000' },
          { value: '50-100k', label: '$50,000 – $100,000' },
          { value: '100-200k', label: '$100,000 – $200,000' },
          { value: '200k+', label: 'Over $200,000' },
        ],
      },
      { key: 'bankAccount', label: 'Bank account for payment', type: 'text', required: true, hint: 'Account number the grant is paid into' },
      { key: 'reason', label: 'Anything we should know?', type: 'text', required: false },
    ],
    documents: [
      { id: 'nationalId', label: 'National ID', issuer: 'GECOM', required: true, hint: 'Confirms who you are' },
      { id: 'proofIncome', label: 'Proof of income', issuer: 'Pay slip / letter', required: true, hint: 'Most recent pay slip, or a letter if self-employed' },
      { id: 'proofAddress', label: 'Proof of address', issuer: 'Dated within 3 months', required: true, hint: 'Utility bill or bank statement' },
    ],
  },
};

export function getApplicationDef(serviceId) {
  return APPLICATION_DEFS[serviceId] || null;
}
