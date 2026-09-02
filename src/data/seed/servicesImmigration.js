// Seeded catalogue for the Immigration Department — the Guyana passport.
//
// The passport was the last service still rendered by a screen of its own
// (the old overlays/apply + state/requirements.js): a modal form reached through a
// category drill-down, with no overview, no fee table and no tracker, while
// every other service opened the shared View / Apply / Track shell. It is a
// seed entry now like the rest, so the citizen meets it the same way they meet
// a TIN or the old age pension.
//
// One service covers the whole arc Immigration offers — first passport,
// renewal, and replacing one lost or damaged — behind a single
// `applicationType` choice, the way the GRA services do.
//
// Facts carried over from the flow this replaces: a standard passport is
// G$6,000 and takes about ten working days from the Passport Office visit;
// the visit itself is where the photo, signature and fingerprints are captured
// and the originals are checked, so it is booked as part of applying.

/** @type {import('../types').Service[]} */
export const IMMIGRATION_SERVICES = [
  {
    id: 'svc_immigration_passport',
    slug: 'immigration-passport',
    name: 'Guyana Passport',
    group: 'immigration',
    agencyId: 'immigration',
    icon: 'plane',
    active: true,
    sortOrder: 1,
    summary:
      'Apply for your first machine-readable Guyana passport, renew the one you hold, or replace one lost or damaged — G$6,000.',
    overview:
      'The Immigration Department of the Guyana Police Force issues the machine-readable Guyana passport. '
      + 'Your birth certificate and National ID connect straight from your Vault — you are not asked to hand in '
      + 'papers government already holds. What is left is a recent photograph and, if you have moved, a proof of '
      + 'address. You then book a Passport Office visit inside this application: the office checks your originals '
      + 'and captures your photo, signature and fingerprints, and the ten working days run from that visit.',
    steps: [
      'Choose whether this is a first passport, a renewal, or a replacement.',
      'Your details prefill from your government record — check them and fill the gaps.',
      'Connect your birth certificate, ID and police clearance from your Vault, and add a photograph.',
      'Book your Passport Office visit — photo, signature and fingerprints are captured in person.',
      'Immigration verifies your originals at the visit and prints the passport, usually within ten working days.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord'],
    eligibilityNotes: [
      'You must be a Guyanese citizen — the birth certificate is the primary proof of citizenship.',
      'Bring the originals of everything you connected to your Passport Office visit.',
      'A passport reported lost or stolen is cancelled; a replacement is a new passport, not a reprint.',
      'Applying for a child under 16 is done in person at a Passport Office by a parent or guardian.',
    ],
    prerequisites: [],
    appointment: {
      title: 'Your Passport Office visit',
      label: 'Book your Passport Office visit',
      note: 'Photo, signature and fingerprints are captured in person. Bring the originals of every document you connected.',
    },
    sections: [
      {
        id: 'request',
        title: 'What you need',
        description: 'A first passport, a renewal, or a replacement.',
      },
      {
        id: 'applicant',
        title: 'Your details',
        description: 'Prefilled from your government record — check and complete.',
      },
    ],
    fields: [
      {
        key: 'applicationType',
        label: 'What are you applying for?',
        type: 'radio',
        sectionId: 'request',
        required: true,
        options: [
          { value: 'first', label: 'My first passport' },
          { value: 'renewal', label: 'A renewal — my passport has expired or is about to' },
          { value: 'replacement', label: 'A replacement — mine was lost or damaged' },
        ],
      },
      {
        key: 'currentPassport',
        label: 'Your current passport number',
        type: 'text',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: ['renewal', 'replacement'] },
        validate: { pattern: '^[A-Za-z0-9 -]{6,20}$', message: 'Enter the number printed on your passport.' },
      },
      {
        key: 'lossDetails',
        label: 'What happened to the old passport?',
        type: 'textarea',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'replacement' },
        hint: 'A sentence or two — where and roughly when it was lost or damaged.',
        validate: { min: 10, message: 'A sentence or two is enough, but Immigration does need one.' },
      },
      { key: 'surname', label: 'Surname', type: 'text', sectionId: 'applicant', required: true },
      { key: 'givenNames', label: 'Given names', type: 'text', sectionId: 'applicant', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date', sectionId: 'applicant', required: true },
      {
        key: 'placeOfBirth',
        label: 'Place of birth',
        type: 'text',
        sectionId: 'applicant',
        required: true,
        hint: 'Town or village, and country.',
      },
      { key: 'occupation', label: 'Occupation', type: 'text', sectionId: 'applicant', required: true },
      {
        key: 'address',
        label: 'Home address',
        type: 'text',
        sectionId: 'applicant',
        required: true,
        hint: 'Lot, street, village or ward.',
      },
      { key: 'phone', label: 'Phone', type: 'tel', sectionId: 'applicant', required: true },
      { key: 'email', label: 'Email', type: 'email', sectionId: 'applicant', required: false },
    ],
    documents: [
      {
        id: 'birthCert', accepts: ['BIRTH_CERTIFICATE'],
        label: 'Birth certificate',
        issuer: 'General Register Office',
        required: true,
        hint: 'The primary proof of citizenship. Bring the original to your Passport Office visit.',
      },
      {
        id: 'nationalId', accepts: ['NID', 'PASSPORT'],
        label: 'National ID or current passport',
        issuer: 'GECOM / Immigration',
        required: true,
        hint: 'Valid photo ID in your current name.',
      },
      {
        id: 'clearance', accepts: ['POLICE_CLEARANCE'],
        label: 'Police clearance certificate',
        issuer: 'Guyana Police Force',
        required: true,
        hint: 'Connects from your Vault. Not there yet? Apply for it first — it is a service in its own right.',
      },
      {
        id: 'passportPhoto', accepts: ['PASSPORT_PHOTO'],
        label: 'Passport photograph',
        issuer: 'Recent, colour',
        required: true,
        hint: 'Plain background, taken within the last six months.',
      },
      {
        id: 'proofAddress', accepts: ['PROOF_OF_ADDRESS'],
        label: 'Proof of address',
        issuer: 'Dated within 3 months',
        required: false,
        hint: 'Only if you have moved since your last passport — a utility bill or bank statement.',
      },
    ],
    timeframeDays: 10,
    timeframeNote:
      'Ten working days from your Passport Office visit, not from the day you apply — the clock starts when your '
      + 'originals are checked and your biometrics are captured. Express processing is available at the Georgetown office.',
  },
];

/**
 * The one fee. Express processing is deliberately not a row here: a fee row is
 * either payable on applying or payable if approved, and express is neither —
 * it is bought across the counter on the day, at one office, if the citizen
 * wants it. It is said where it belongs, in the timeframe note.
 * @type {import('../types').ServiceFee[]}
 */
export const IMMIGRATION_FEES = [
  {
    id: 'fee_immigration_passport',
    serviceId: 'svc_immigration_passport',
    code: 'IMM-PP',
    label: 'Passport fee',
    amountGyd: 6000,
    kind: 'application',
    mandatory: true,
    note: 'G$6,000 — the same fee for a first passport, a renewal or a replacement.',
  },
];

/** @type {import('../types').ServiceRoute[]} */
export const IMMIGRATION_ROUTES = [
  {
    id: 'route_immigration_passport',
    serviceId: 'svc_immigration_passport',
    agencyId: 'immigration',
    sequence: 1,
    role: 'lead',
    slaDays: 10,
    purpose: 'Checks your originals at the Passport Office visit, captures your biometrics, and prints the passport.',
  },
];
