// Seeded catalogue for the Ministry of Human Services & Social Security.
//
// One service so far: the Old Age Pension. Registration happens here rather
// than at a Ministry office — the citizen reads what the pension is, applies,
// and follows it to the award.
//
// Every number the scheme turns on lives in MHSSS_CONFIG below, not in this
// file's prose and not in the screens. The pension rose to $46,000 a month in
// January 2026 by ministerial announcement; the next rise must be a row change
// and nothing else, so the View screen, the age test and the award all read
// the same config rows.

export const OLD_AGE_PENSION_SERVICE_ID = 'svc_mhsss_old_age_pension';

const REGION_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'r1', label: 'Region 1 — Barima-Waini' },
  { value: 'r2', label: 'Region 2 — Pomeroon-Supenaam' },
  { value: 'r3', label: 'Region 3 — Essequibo Islands-West Demerara' },
  { value: 'r4', label: 'Region 4 — Demerara-Mahaica' },
  { value: 'r5', label: 'Region 5 — Mahaica-Berbice' },
  { value: 'r6', label: 'Region 6 — East Berbice-Corentyne' },
  { value: 'r7', label: 'Region 7 — Cuyuni-Mazaruni' },
  { value: 'r8', label: 'Region 8 — Potaro-Siparuni' },
  { value: 'r9', label: 'Region 9 — Upper Takutu-Upper Essequibo' },
  { value: 'r10', label: 'Region 10 — Upper Demerara-Berbice' },
];

/**
 * The banks and mobile money providers MHSSS disburses through — the two routes
 * on the Ministry's own bank/MMG form.
 */
const BANK_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'gbti', label: 'Guyana Bank for Trade & Industry (GBTI)' },
  { value: 'republic', label: 'Republic Bank (Guyana)' },
  { value: 'demerara', label: 'Demerara Bank' },
  { value: 'citizens', label: 'Citizens Bank Guyana' },
  { value: 'baroda', label: 'Bank of Baroda (Guyana)' },
  { value: 'gbs', label: 'Guyana Bank of Savings (New Building Society)' },
];

const MMG_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'mmg', label: 'MMG (Mobile Money Guyana)' },
  { value: 'gtt-mmg', label: 'GTT+ Mobile Money' },
];

/**
 * Per-service configuration.
 *
 * `valueType` is what makes these renderable without a screen knowing what any
 * particular key means: the View screen shows every row marked `showOnView`,
 * formatted by its type, and the endpoints read the ones they need by key.
 *
 * @type {import('../types').ServiceConfig[]}
 */
export const MHSSS_CONFIG = [
  {
    id: 'cfg_oap_monthly_benefit',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'monthlyBenefitGyd',
    label: 'Monthly pension',
    valueType: 'money',
    value: 46000,
    unit: 'month',
    note: 'Paid every month for life, from the month your application is approved.',
    effectiveFrom: '2026-01-01',
    showOnView: true,
  },
  {
    id: 'cfg_oap_transport_grant',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'transportGrantGyd',
    label: 'Transportation grant',
    valueType: 'money',
    value: 20000,
    unit: 'year',
    note: 'An annual grant towards travel, paid alongside the pension.',
    effectiveFrom: '2026-01-01',
    showOnView: true,
  },
  {
    id: 'cfg_oap_min_age',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'minAgeYears',
    label: 'Qualifying age',
    valueType: 'years',
    value: 65,
    note: 'The pension is payable from your 65th birthday.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
  {
    id: 'cfg_oap_apply_window',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'applyWindowWeeks',
    label: 'Apply from',
    valueType: 'weeks',
    value: 6,
    note: 'Applications open six weeks before your 65th birthday so the first payment is ready on time.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
  {
    id: 'cfg_oap_residency_years',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'residencyYears',
    label: 'Years lived in Guyana',
    valueType: 'years',
    value: 10,
    note: 'You must have lived in Guyana for at least ten years.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
  {
    id: 'cfg_oap_active_residency_years',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'activeResidencyYears',
    label: 'Years as an active resident',
    valueType: 'years',
    value: 2,
    note: 'At least two of those years must be as an active resident.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
  {
    id: 'cfg_oap_immigration_report_age',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'immigrationReportFromAge',
    label: 'Immigration report required from',
    valueType: 'years',
    value: 66,
    note: 'A first-time applicant aged 66 or over must produce an immigration report.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
  {
    id: 'cfg_oap_processing_weeks',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    key: 'processingWeeks',
    label: 'Processing time',
    valueType: 'weeks',
    value: 6,
    note: 'From submission to decision.',
    effectiveFrom: '2026-01-01',
    showOnView: false,
  },
];

/** @type {import('../types').Service[]} */
export const MHSSS_SERVICES = [
  {
    id: OLD_AGE_PENSION_SERVICE_ID,
    slug: 'old-age-pension',
    name: 'Old Age Pension',
    group: 'mhsss',
    agencyId: 'humanServices',
    icon: 'hand-heart',
    summary: 'The monthly pension every Guyanese aged 65 and over is entitled to.',
    overview:
      'The old age pension is universal: it is not means-tested and it does not depend on how much you contributed. '
      + 'Every citizen or legal resident of Guyana aged 65 or over, ordinarily resident here, is entitled to it. '
      + 'It is paid monthly into your bank account or your mobile money wallet, alongside an annual transportation grant. '
      + 'Apply from six weeks before your 65th birthday and your first payment is ready when you turn 65.',
    steps: [
      'We check your age and your record before you fill anything in — applications open six weeks before your 65th birthday.',
      'You complete three short sections: who you are, your residency, and how you want to be paid.',
      'You connect your National ID, passport or birth certificate from your Vault, and add a photograph.',
      'The Ministry verifies your record and confirms the award — normally within six weeks.',
      'Your pension award letter is filed in your Vault and payments begin on the monthly cycle.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord', 'pensionAgeWindow', 'noOpenPension'],
    eligibilityNotes: [
      'You must be 65 or over — you may apply from six weeks before your 65th birthday.',
      'You must be a Guyanese citizen or a legal resident, ordinarily resident in Guyana.',
      'You must have lived in Guyana for at least ten years, at least two of them as an active resident.',
      'The pension is universal — it is not means-tested, and other income does not reduce it.',
      'A first-time applicant aged 66 or over must also produce an immigration report.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'personal',
        title: 'About you',
        description: 'Taken from your government record where we already hold it — check it and correct anything that has changed.',
      },
      {
        id: 'residency',
        title: 'Your residency',
        description: 'The pension is for people ordinarily resident in Guyana. These answers are checked against your record.',
      },
      {
        id: 'payment',
        title: 'How you are paid',
        description: 'Your pension is paid into a bank account or a mobile money wallet in your own name.',
      },
    ],
    fields: [
      // --- About you -------------------------------------------------------
      {
        key: 'applicantName',
        label: 'Your full name',
        type: 'text',
        sectionId: 'personal',
        required: true,
        hint: 'Exactly as it appears on the identity document you are attaching.',
        validate: { min: 3, message: 'Enter your full name as it appears on your ID.' },
      },
      {
        key: 'dob',
        label: 'Date of birth',
        type: 'date',
        sectionId: 'personal',
        required: true,
        hint: 'Your age is worked out from this and checked against your record.',
        validate: { date: 'past', message: 'Your date of birth must be in the past.' },
      },
      {
        key: 'idDocumentType',
        label: 'Which identity document are you applying with?',
        type: 'radio',
        sectionId: 'personal',
        required: true,
        options: [
          { value: 'nid', label: 'National ID card' },
          { value: 'passport', label: 'Passport' },
          { value: 'birth', label: 'Birth certificate' },
        ],
      },
      {
        key: 'nationalId',
        label: 'National ID number',
        type: 'text',
        sectionId: 'personal',
        required: true,
        showIf: { field: 'idDocumentType', equals: 'nid' },
        validate: { pattern: '^[A-Za-z0-9 -]{6,20}$', message: 'Enter the number printed on your National ID.' },
      },
      {
        key: 'passport',
        label: 'Passport number',
        type: 'text',
        sectionId: 'personal',
        required: true,
        showIf: { field: 'idDocumentType', equals: 'passport' },
        validate: { pattern: '^[A-Za-z0-9 -]{6,20}$', message: 'Enter the number printed on your passport.' },
      },
      {
        key: 'birthRegNo',
        label: 'Birth registration number',
        type: 'text',
        sectionId: 'personal',
        required: true,
        hint: 'From your birth certificate — it looks like B/GT/1961/004512.',
        showIf: { field: 'idDocumentType', equals: 'birth' },
        validate: { min: 6, message: 'Enter the registration number from your birth certificate.' },
      },
      {
        key: 'address',
        label: 'Home address',
        type: 'textarea',
        sectionId: 'personal',
        required: true,
        validate: { min: 8, message: 'Give the lot number, street and village or ward.' },
      },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        sectionId: 'personal',
        required: true,
        options: REGION_OPTIONS,
      },
      {
        key: 'phone',
        label: 'Contact number',
        type: 'tel',
        sectionId: 'personal',
        required: true,
        placeholder: '+592 000 0000',
        hint: 'We use this to reach you about your pension — nothing else.',
        validate: { pattern: '^[+ 0-9()-]{7,20}$', message: 'Enter a reachable phone number.' },
      },

      // --- Residency --------------------------------------------------------
      {
        key: 'citizenship',
        label: 'Your status in Guyana',
        type: 'radio',
        sectionId: 'residency',
        required: true,
        options: [
          { value: 'citizen', label: 'Guyanese citizen' },
          { value: 'resident', label: 'Legal resident' },
        ],
      },
      {
        key: 'ordinarilyResident',
        label: 'I am ordinarily resident in Guyana.',
        type: 'checkbox',
        sectionId: 'residency',
        required: true,
        hint: 'Guyana is where you normally live, not somewhere you visit.',
      },
      {
        key: 'yearsInGuyana',
        label: 'Years you have lived in Guyana',
        type: 'number',
        sectionId: 'residency',
        required: true,
        hint: 'The total across your life, not necessarily unbroken.',
        validate: { min: 0, max: 120, message: 'Enter the number of years.' },
      },
      {
        key: 'activeResidentYears',
        label: 'Of those, years as an active resident',
        type: 'number',
        sectionId: 'residency',
        required: true,
        hint: 'Living here continuously — working, keeping a home, registered with an agency.',
        validate: { min: 0, max: 120, message: 'Enter the number of years.' },
      },
      {
        key: 'firstTimeApplicant',
        label: 'Have you drawn the old age pension before?',
        type: 'radio',
        sectionId: 'residency',
        required: true,
        hint: 'A first-time applicant aged 66 or over is asked for an immigration report.',
        options: [
          { value: 'yes', label: 'No — this is my first application' },
          { value: 'no', label: 'Yes — I have drawn it before' },
        ],
      },

      // --- Payment ----------------------------------------------------------
      {
        key: 'disbursementMethod',
        label: 'How would you like to be paid?',
        type: 'radio',
        sectionId: 'payment',
        required: true,
        options: [
          { value: 'bank', label: 'Into my bank account' },
          { value: 'mmg', label: 'Into my mobile money wallet (MMG)' },
        ],
      },
      {
        key: 'bankName',
        label: 'Bank',
        type: 'select',
        sectionId: 'payment',
        required: true,
        showIf: { field: 'disbursementMethod', equals: 'bank' },
        options: BANK_OPTIONS,
      },
      {
        key: 'bankBranch',
        label: 'Branch',
        type: 'text',
        sectionId: 'payment',
        required: true,
        showIf: { field: 'disbursementMethod', equals: 'bank' },
        validate: { min: 3, message: 'Enter the branch that holds the account.' },
      },
      {
        key: 'bankAccount',
        label: 'Account number',
        type: 'text',
        sectionId: 'payment',
        required: true,
        hint: 'Only the last four digits are stored.',
        showIf: { field: 'disbursementMethod', equals: 'bank' },
        validate: { pattern: '^[0-9]{6,20}$', message: 'Account numbers are 6 to 20 digits.' },
      },
      {
        key: 'mmgProvider',
        label: 'Mobile money provider',
        type: 'select',
        sectionId: 'payment',
        required: true,
        showIf: { field: 'disbursementMethod', equals: 'mmg' },
        options: MMG_OPTIONS,
      },
      {
        key: 'mmgWallet',
        label: 'Mobile money number',
        type: 'tel',
        sectionId: 'payment',
        required: true,
        hint: 'The number the wallet is registered to. Only the last four digits are stored.',
        showIf: { field: 'disbursementMethod', equals: 'mmg' },
        validate: { pattern: '^[+ 0-9()-]{7,20}$', message: 'Enter the number your wallet is registered to.' },
      },
      {
        key: 'accountHolder',
        label: 'Account or wallet holder name',
        type: 'text',
        sectionId: 'payment',
        required: true,
        hint: 'Must be your own name — the pension cannot be paid to anyone else.',
        validate: { min: 3, message: 'Enter the name the account is held in.' },
      },
      {
        key: 'declaration',
        label: 'I declare that everything above is true and complete.',
        type: 'checkbox',
        sectionId: 'payment',
        required: true,
        hint: 'Giving false information to obtain a pension is an offence.',
      },
    ],
    documents: [
      {
        id: 'identityDocument',
        // The three the Ministry accepts, and nothing else. All three are
        // government-issued, so this slot connects from the Vault rather than
        // taking an upload — see attachmentRoutes in src/data/documentTypes.js.
        accepts: ['NID', 'PASSPORT', 'BIRTH_CERTIFICATE'],
        label: 'National ID, passport or birth certificate',
        issuer: 'GECOM, Immigration or the GRO',
        required: true,
        hint: 'Any one of the three. Connect it from your Vault — you never upload one of these.',
      },
      {
        id: 'photograph',
        accepts: ['PASSPORT_PHOTO'],
        label: 'Recent photograph',
        issuer: 'Passport-style, taken within the last six months',
        required: true,
        hint: 'Required for the online application — head and shoulders, plain background.',
      },
      {
        id: 'immigrationReport',
        accepts: ['IMMIGRATION_REPORT'],
        label: 'Immigration report',
        issuer: 'the Immigration Department',
        // Turned on by requiredDocumentsFor when the applicant is a first-time
        // applicant at or over the configured age.
        required: false,
        hint: 'First-time applicants aged 66 or over only — it shows your travel history.',
      },
      {
        id: 'bankProof',
        accepts: ['BANK_PROOF'],
        label: 'Bank account proof',
        issuer: 'Your bank',
        required: false,
        hint: 'Optional — a statement header or bank letter showing your name and account number.',
      },
    ],
    // Six weeks, published as calendar days so the View screen reads "about 6 weeks".
    timeframeDays: 42,
    timeframeNote:
      'The Ministry normally decides an old age pension application within six weeks of submission. '
      + 'Your first payment covers the month your award takes effect.',
    sortOrder: 5,
    active: true,
  },
];

/** @type {import('../types').ServiceFee[]} */
export const MHSSS_FEES = [
  {
    id: 'fee_oap_application',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    code: 'OAP-APP',
    label: 'Application fee',
    amountGyd: 0,
    kind: 'application',
    mandatory: true,
    note: 'The old age pension is free to apply for. Nobody may charge you for it, at any office.',
  },
];

/** @type {import('../types').ServiceRoute[]} */
export const MHSSS_ROUTES = [
  {
    id: 'route_oap_mhsss',
    serviceId: OLD_AGE_PENSION_SERVICE_ID,
    agencyId: 'humanServices',
    sequence: 1,
    role: 'lead',
    // Six weeks of working days.
    slaDays: 30,
    purpose: 'Verifies your age and residency against the national record, and confirms the award.',
  },
];
