// Seeded catalogue for the Cash Grants service (Ministry of Finance).
//
// This is the enhanced form of what src/state/requirements.js carried as a
// single flat `cashGrant` definition: the same grant types and documents, now
// split into gated sections, with per-field validation and a real fee/timeframe
// record. The apply engine renders straight from this — adding a question is a
// seed change, not a new screen.

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

/** @type {import('../types').Service[]} */
export const CASH_GRANT_SERVICES = [
  {
    id: 'svc_cash_grant',
    slug: 'cash-grant',
    name: 'Cash Grant',
    group: 'cashGrants',
    agencyId: 'mof',
    icon: 'banknote',
    summary: 'Apply for a government cash grant paid into your bank account.',
    overview:
      'The Ministry of Finance pays cash grants to households that qualify — the Because We Care school grant, public assistance, and one-off relief. '
      + 'We check what you tell us against the record government already holds, so you are not asked to prove things twice. '
      + 'Approved grants are paid directly into the bank account you give here.',
    steps: [
      'We check your eligibility against your own record before you fill anything in.',
      'You complete four short sections: who you are, your household, your income, and how you are paid.',
      'You attach the supporting documents — or pull them straight from your Vault.',
      'The Ministry of Finance reviews the application and confirms the award.',
      'Approved grants are paid into your bank account and the payment shows on your tracker.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord', 'adult', 'noOpenCashGrant'],
    eligibilityNotes: [
      'You must be a Guyanese citizen or a legal resident, 18 or over.',
      'One grant per person per cycle — a second application is declined automatically.',
      'The Because We Care school grant requires at least one child enrolled in school.',
      'Public assistance is means-tested against your declared household income.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'grant',
        title: 'The grant you want',
        description: 'Different grants ask for slightly different things — pick yours first.',
      },
      {
        id: 'household',
        title: 'Your household',
        description: 'Who lives with you, and where. This decides the amount you may receive.',
      },
      {
        id: 'income',
        title: 'Income',
        description: 'Means testing uses this. Give your household total before deductions.',
      },
      {
        id: 'payment',
        title: 'How you are paid',
        description: 'Approved grants are paid straight into this account.',
      },
    ],
    fields: [
      {
        key: 'grantType',
        label: 'Which grant are you applying for?',
        type: 'radio',
        sectionId: 'grant',
        required: true,
        options: [
          { value: 'because-we-care', label: 'Because We Care school grant' },
          { value: 'public-assistance', label: 'Public assistance' },
          { value: 'one-off-relief', label: 'One-off relief grant' },
        ],
      },
      {
        key: 'schoolChildren',
        label: 'Children enrolled in school',
        type: 'number',
        sectionId: 'grant',
        required: true,
        hint: 'The school grant is paid per enrolled child.',
        showIf: { field: 'grantType', equals: 'because-we-care' },
        validate: { min: 1, max: 15, message: 'Enter between 1 and 15 children.' },
      },
      {
        key: 'schoolName',
        label: 'School they attend',
        type: 'text',
        sectionId: 'grant',
        required: true,
        showIf: { field: 'grantType', equals: 'because-we-care' },
        validate: { min: 3, message: 'Enter the full school name.' },
      },
      {
        key: 'reliefReason',
        label: 'What happened?',
        type: 'textarea',
        sectionId: 'grant',
        required: true,
        hint: 'Flood, fire, loss of income — tell us briefly, in your own words.',
        showIf: { field: 'grantType', equals: 'one-off-relief' },
        validate: { min: 20, max: 600, message: 'Give us at least a sentence or two (20 characters or more).' },
      },

      {
        key: 'applicantName',
        label: 'Your full name',
        type: 'text',
        sectionId: 'household',
        required: true,
        hint: 'As it appears on your National ID.',
        validate: { min: 3, message: 'Enter your full name as it appears on your ID.' },
      },
      {
        key: 'dob',
        label: 'Date of birth',
        type: 'date',
        sectionId: 'household',
        required: true,
        validate: { date: 'past', message: 'Your date of birth must be in the past.' },
      },
      {
        key: 'address',
        label: 'Home address',
        type: 'textarea',
        sectionId: 'household',
        required: true,
        validate: { min: 8, message: 'Give the lot number, street and village or ward.' },
      },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        sectionId: 'household',
        required: true,
        options: REGION_OPTIONS,
      },
      {
        key: 'householdSize',
        label: 'People living in your household',
        type: 'number',
        sectionId: 'household',
        required: true,
        hint: 'Including you.',
        validate: { min: 1, max: 20, message: 'Enter a number between 1 and 20.' },
      },
      {
        key: 'phone',
        label: 'Contact number',
        type: 'tel',
        sectionId: 'household',
        required: true,
        placeholder: '+592 000 0000',
        validate: { pattern: '^[+ 0-9()-]{7,20}$', message: 'Enter a reachable phone number.' },
      },

      {
        key: 'employmentStatus',
        label: 'Your employment',
        type: 'select',
        sectionId: 'income',
        required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'employed', label: 'Employed' },
          { value: 'self-employed', label: 'Self-employed' },
          { value: 'unemployed', label: 'Not working' },
          { value: 'pensioner', label: 'Pensioner' },
        ],
      },
      {
        key: 'employerName',
        label: 'Employer',
        type: 'text',
        sectionId: 'income',
        required: true,
        showIf: { field: 'employmentStatus', equals: 'employed' },
      },
      {
        key: 'monthlyIncomeGyd',
        label: 'Household monthly income (GYD)',
        type: 'number',
        sectionId: 'income',
        required: true,
        hint: 'Everyone in the household added together, before deductions.',
        validate: { min: 0, max: 5000000, message: 'Enter the monthly total in Guyanese dollars.' },
      },
      {
        key: 'otherBenefits',
        label: 'Other government support you already receive',
        type: 'textarea',
        sectionId: 'income',
        required: false,
        hint: 'Optional — NIS benefit, public assistance, anything else.',
      },

      {
        key: 'bankName',
        label: 'Bank',
        type: 'select',
        sectionId: 'payment',
        required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'gbti', label: 'Guyana Bank for Trade & Industry (GBTI)' },
          { value: 'republic', label: 'Republic Bank (Guyana)' },
          { value: 'demerara', label: 'Demerara Bank' },
          { value: 'citizens', label: 'Citizens Bank Guyana' },
          { value: 'baroda', label: 'Bank of Baroda (Guyana)' },
          { value: 'gpo', label: 'Guyana Post Office (money order)' },
        ],
      },
      {
        key: 'bankAccount',
        label: 'Account number',
        type: 'text',
        sectionId: 'payment',
        required: true,
        hint: 'The grant is paid into this account. Only the last four digits are stored.',
        showIf: { field: 'bankName', equals: ['gbti', 'republic', 'demerara', 'citizens', 'baroda'] },
        validate: { pattern: '^[0-9]{6,20}$', message: 'Account numbers are 6 to 20 digits.' },
      },
      {
        key: 'accountHolder',
        label: 'Account holder name',
        type: 'text',
        sectionId: 'payment',
        required: true,
        hint: 'Must match your own name — grants cannot be paid to a third party.',
        showIf: { field: 'bankName', equals: ['gbti', 'republic', 'demerara', 'citizens', 'baroda'] },
      },
      {
        key: 'declaration',
        label: 'I declare that everything above is true and complete.',
        type: 'checkbox',
        sectionId: 'payment',
        required: true,
        hint: 'Giving false information to obtain a grant is an offence.',
      },
    ],
    documents: [
      {
        id: 'nationalId',
        label: 'National ID',
        issuer: 'GECOM',
        required: true,
        hint: 'Confirms who you are.',
        vaultKind: 'national-id',
      },
      {
        id: 'proofIncome',
        label: 'Proof of income',
        issuer: 'Pay slip or letter',
        required: true,
        hint: 'Most recent pay slip, or a letter if you are self-employed.',
        vaultKind: 'proof-of-income',
      },
      {
        id: 'proofAddress',
        label: 'Proof of address',
        issuer: 'Dated within 3 months',
        required: true,
        hint: 'A utility bill or bank statement in your name.',
        vaultKind: 'proof-of-address',
      },
      {
        id: 'schoolLetter',
        label: 'School enrolment letter',
        issuer: 'The school',
        required: false,
        hint: 'Only for the Because We Care grant — confirms the child is enrolled.',
        vaultKind: 'certificate',
      },
      {
        id: 'bankProof',
        label: 'Bank account proof',
        issuer: 'Your bank',
        required: false,
        hint: 'Optional — a statement header or bank letter showing your name and account number.',
        vaultKind: 'other',
      },
    ],
    timeframeDays: 21,
    timeframeNote: 'Most cash grants are decided within three weeks. Payment reaches your account within five working days of approval.',
    sortOrder: 10,
    active: true,
  },
];

/** @type {import('../types').ServiceFee[]} */
export const CASH_GRANT_FEES = [
  {
    id: 'fee_cash_grant_application',
    serviceId: 'svc_cash_grant',
    code: 'CG-APP',
    label: 'Application fee',
    amountGyd: 0,
    kind: 'application',
    mandatory: true,
    note: 'Cash grant applications are free. Nobody may charge you to apply.',
  },
];

/** @type {import('../types').ServiceRoute[]} */
export const CASH_GRANT_ROUTES = [
  {
    id: 'route_cash_grant_mof',
    serviceId: 'svc_cash_grant',
    agencyId: 'mof',
    sequence: 1,
    role: 'lead',
    slaDays: 21,
    purpose: 'Verifies your record, means-tests the application and confirms the award.',
  },
];
