// Seeded catalogue for the Guyana Revenue Authority (gra.gov.gy).
//
// Four services, each covering the full arc the GRA offers for it — first
// application, changes, and (where it exists) renewal — behind a single
// `applicationType` choice, so View / Apply / Changes / Renew / Track all run
// through the one form and the one tracker.
//
// Facts grounded in gra.gov.gy: a TIN is free and needs valid ID plus proof of
// address; a driver's licence costs G$4,500, runs five years, and a renewal
// needs only the old card; VAT registration is mandatory at G$15,000,000
// turnover; property tax returns are due by April 30 where net property
// exceeds G$40,000,000 (0.5% on the next G$20M, 0.75% above that).

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
export const GRA_SERVICES = [
  {
    id: 'svc_gra_tin',
    slug: 'gra-tin',
    name: 'Taxpayer Identification Number (TIN)',
    group: 'gra',
    agencyId: 'gra',
    icon: 'id-card',
    active: true,
    sortOrder: 1,
    summary: 'Get your TIN — free, and needed for banking, employment and every other tax service — or update the details on it.',
    overview:
      'A Taxpayer Identification Number identifies you to the Guyana Revenue Authority and is asked for almost everywhere — '
      + 'opening a bank account, starting a job, registering a business, importing goods. It is issued free of charge. '
      + 'Apply with valid identification and a proof of address; if the proof of address is not in your name, an attestation '
      + 'from the person you live with is accepted. The same form updates the details on a TIN you already hold.',
    steps: [
      'Choose whether you are applying for a new TIN or updating one you already hold.',
      'Your details prefill from your government record — check them and fill the gaps.',
      'Attach your identification from the Vault and a proof of address.',
      'GRA verifies the application — TIN certificates are usually ready within three working days.',
      'The TIN certificate is issued to your account.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord'],
    eligibilityNotes: [
      'A TIN is issued free of charge — nobody may charge you for one.',
      'One TIN per person, for life. If you already hold one, use the update option instead.',
      'Businesses need their own TIN — see Business Tax Registration.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'request',
        title: 'What you need',
        description: 'A new TIN, or a change to the one you hold.',
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
          { value: 'new', label: 'A new TIN — I have never held one' },
          { value: 'change', label: 'Update my TIN — name, address or a correction' },
        ],
      },
      {
        key: 'tin',
        label: 'Your current TIN',
        type: 'text',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        validate: { min: 6, message: 'Enter the TIN as printed on your certificate.' },
      },
      {
        key: 'changeWhat',
        label: 'What needs to change?',
        type: 'select',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        options: [
          { value: '', label: 'Select…' },
          { value: 'name', label: 'My name' },
          { value: 'address', label: 'My address' },
          { value: 'correction', label: 'An error on the record' },
          { value: 'other', label: 'Something else' },
        ],
      },
      {
        key: 'changeDetails',
        label: 'Describe the change',
        type: 'textarea',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        hint: 'What the record says now, and what it should say.',
        validate: { min: 10, message: 'A sentence or two helps the officer make the change correctly.' },
      },
      { key: 'applicantName', label: 'Full name', type: 'text', sectionId: 'applicant', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date', sectionId: 'applicant', required: true },
      { key: 'nationalId', label: 'National ID number', type: 'text', sectionId: 'applicant', required: true },
      { key: 'address', label: 'Home address', type: 'text', sectionId: 'applicant', required: true, hint: 'Lot, street, village or ward.' },
      { key: 'region', label: 'Region', type: 'select', sectionId: 'applicant', required: true, options: REGION_OPTIONS },
      { key: 'phone', label: 'Phone', type: 'tel', sectionId: 'applicant', required: true },
      { key: 'email', label: 'Email', type: 'email', sectionId: 'applicant', required: false },
    ],
    documents: [
      {
        id: 'idDocument', accepts: ['NID', 'PASSPORT', 'NIS_CARD'],
        label: 'Valid identification',
        issuer: 'GECOM / Immigration / NIS',
        required: true,
        hint: 'National ID card, passport or NIS card.',
      },
      {
        id: 'proofAddress', accepts: ['PROOF_OF_ADDRESS'],
        label: 'Proof of address',
        issuer: 'Dated within 3 months',
        required: true,
        hint: 'A utility bill, bank statement or mail received by post. Not in your name? An attestation from the person you live with is accepted.',
      },
      {
        id: 'supportingDoc', accepts: ['BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'OTHER'],
        label: 'Proof of the change',
        issuer: 'GRO / court / deed poll',
        required: false,
        hint: 'Only for updates — the document that shows the new name or corrected detail.',
      },
    ],
  },

  {
    id: 'svc_gra_drivers_licence',
    slug: 'gra-drivers-licence',
    name: "Driver's Licence",
    group: 'gra',
    agencyId: 'gra',
    icon: 'car',
    active: true,
    sortOrder: 2,
    summary: "Apply for, renew or replace your five-year driver's licence — G$4,500, renewals completed the same day.",
    overview:
      "The Licence Revenue Office of the GRA is the only body in Guyana that registers drivers and issues the licence. "
      + "A licence runs five years and costs G$4,500, new or renewed. First-time drivers need the Letter of Competence "
      + "issued by the Guyana Police Force after the driving test. Renewing needs only your old plastic card — no photo, "
      + "no ID copies — and is completed the same day; GRA advises renewing up to three months before the card expires. "
      + "The same form replaces a lost or damaged card and corrects the details printed on it.",
    steps: [
      'Choose new licence, renewal, or a replacement/correction.',
      'Your details and current licence number prefill from your government record.',
      'Attach what your choice needs — old card for a renewal, photo and Letter of Competence for a first licence.',
      'Pay the G$4,500 licence fee.',
      'The Licence Revenue Office verifies and prints — renewals are completed the same day.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord', 'adult'],
    eligibilityNotes: [
      'A first licence needs the Letter of Competence from the Guyana Police Force — issued after you pass the driving test.',
      'Renew up to three months before your licence expires.',
      'Holders of the plastic card renew with just the old card — no new photo or ID copies.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'request',
        title: 'What you need',
        description: 'New licence, renewal, or a replacement.',
      },
      {
        id: 'driver',
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
          { value: 'new', label: 'My first licence — I hold a Letter of Competence' },
          { value: 'renewal', label: 'Renew my licence' },
          { value: 'change', label: 'Replace my card, or correct what it says' },
        ],
      },
      {
        key: 'licenceNumber',
        label: 'Your current licence number',
        type: 'text',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: ['renewal', 'change'] },
        validate: { min: 6, message: 'The number as printed on the card.' },
      },
      {
        key: 'licenceClass',
        label: 'Licence class',
        type: 'select',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'new' },
        options: [
          { value: '', label: 'Select…' },
          { value: 'motorcycle', label: 'Motorcycle' },
          { value: 'motorcar', label: 'Motor car' },
          { value: 'minibus', label: 'Minibus' },
          { value: 'lorry', label: 'Lorry' },
        ],
      },
      {
        key: 'competenceLetter',
        label: 'Letter of Competence number',
        type: 'text',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'new' },
        hint: 'Issued by the Certifying Office of the Guyana Police Force when you passed your test.',
        validate: { min: 4, message: 'Enter the number on the letter.' },
      },
      {
        key: 'changeReason',
        label: 'Why does the card need replacing?',
        type: 'select',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        options: [
          { value: '', label: 'Select…' },
          { value: 'lost', label: 'Lost' },
          { value: 'damaged', label: 'Damaged' },
          { value: 'name', label: 'My name changed' },
          { value: 'error', label: 'A detail on it is wrong' },
        ],
      },
      {
        key: 'changeDetails',
        label: 'Anything the officer should know',
        type: 'textarea',
        sectionId: 'request',
        required: false,
        showIf: { field: 'applicationType', equals: 'change' },
      },
      { key: 'applicantName', label: 'Full name', type: 'text', sectionId: 'driver', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date', sectionId: 'driver', required: true },
      { key: 'nationalId', label: 'National ID number', type: 'text', sectionId: 'driver', required: true },
      { key: 'address', label: 'Home address', type: 'text', sectionId: 'driver', required: true },
      { key: 'region', label: 'Region', type: 'select', sectionId: 'driver', required: true, options: REGION_OPTIONS },
      { key: 'phone', label: 'Phone', type: 'tel', sectionId: 'driver', required: true },
    ],
    documents: [
      {
        id: 'idDocument', accepts: ['NID', 'PASSPORT'],
        label: 'Valid identification',
        issuer: 'GECOM / Immigration',
        required: true,
        hint: 'National ID card or the bio-data page of your passport.',
      },
      {
        id: 'oldLicence', accepts: ['DRIVERS_LICENCE'],
        label: 'Your current licence card',
        issuer: 'GRA Licence Revenue Office',
        required: false,
        hint: 'Renewals and replacements only — the plastic card you hold now.',
      },
      {
        id: 'photo', accepts: ['PASSPORT_PHOTO'],
        label: 'Passport-sized photograph',
        issuer: 'Taken within the last 6 months',
        required: false,
        hint: 'First licence only — renewals of the plastic card need no photo.',
      },
    ],
  },

  {
    id: 'svc_gra_business',
    slug: 'gra-business-tax',
    name: 'Business Tax Registration',
    group: 'gra',
    agencyId: 'gra',
    icon: 'briefcase',
    active: true,
    sortOrder: 3,
    summary: 'Register a business for tax — VAT and PAYE against your TIN — or update a registration you already hold.',
    overview:
      'Every business in Guyana is registered with the GRA against a TIN before it can file, bank, bid for government '
      + 'contracts or import. This registration sets up the tax accounts: VAT — mandatory once taxable turnover reaches '
      + 'G$15,000,000 over twelve months, voluntary below that — and PAYE if you employ staff. Registration is free. '
      + 'The same form updates a registration when the business changes address, name or activity.',
    steps: [
      'Choose a new registration or a change to an existing one.',
      'Tell us about the business — name, type, address and expected turnover.',
      'Choose the tax accounts to open: VAT (mandatory at G$15M turnover) and PAYE for employers.',
      'Attach the business registration or certificate of incorporation, ID and proof of the business address.',
      'GRA sets up the accounts — typically within a week.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord', 'adult'],
    eligibilityNotes: [
      'You need a personal TIN first — the registration is filed against it.',
      'VAT registration is mandatory where taxable turnover reaches G$15,000,000 over twelve months; voluntary registration below that is at the Commissioner-General\'s discretion.',
      'Registering is free of charge.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'request',
        title: 'What you need',
        description: 'A new registration, or a change to one you hold.',
      },
      {
        id: 'business',
        title: 'The business',
        description: 'What it is, where it operates.',
      },
      {
        id: 'taxes',
        title: 'Tax accounts',
        description: 'Which accounts to open against your TIN.',
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
          { value: 'new', label: 'Register a business for tax' },
          { value: 'change', label: 'Update an existing registration' },
        ],
      },
      {
        key: 'tin',
        label: 'Your TIN',
        type: 'text',
        sectionId: 'request',
        required: true,
        hint: 'The registration is filed against your personal TIN — apply for one first if you do not have it.',
        validate: { min: 6, message: 'Enter the TIN as printed on your certificate.' },
      },
      {
        key: 'changeDetails',
        label: 'What changed?',
        type: 'textarea',
        sectionId: 'request',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        hint: 'New address, trading name, activity — what the record says now and what it should say.',
        validate: { min: 10, message: 'A sentence or two helps the officer make the change correctly.' },
      },
      { key: 'businessName', label: 'Business name', type: 'text', sectionId: 'business', required: true },
      {
        key: 'businessType',
        label: 'Business type',
        type: 'select',
        sectionId: 'business',
        required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'sole', label: 'Sole trader' },
          { value: 'partnership', label: 'Partnership' },
          { value: 'company', label: 'Incorporated company' },
        ],
      },
      { key: 'businessAddress', label: 'Business address', type: 'text', sectionId: 'business', required: true, hint: 'The place of business must be easily identifiable.' },
      { key: 'region', label: 'Region', type: 'select', sectionId: 'business', required: true, options: REGION_OPTIONS },
      {
        key: 'turnover',
        label: 'Expected taxable turnover over the next 12 months (GYD)',
        type: 'number',
        sectionId: 'taxes',
        required: true,
        hint: 'G$15,000,000 and above must register for VAT.',
        validate: { min: 1, message: 'An estimate is fine — it decides whether VAT registration is mandatory.' },
      },
      {
        key: 'registerVat',
        label: 'Register for VAT?',
        type: 'radio',
        sectionId: 'taxes',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No — turnover is below the threshold' },
        ],
      },
      {
        key: 'registerPaye',
        label: 'Will the business employ staff? (PAYE)',
        type: 'radio',
        sectionId: 'taxes',
        required: true,
        options: [
          { value: 'yes', label: 'Yes — open a PAYE account' },
          { value: 'no', label: 'No employees yet' },
        ],
      },
    ],
    documents: [
      {
        id: 'registrationCert', accepts: ['OTHER'],
        label: 'Business registration or certificate of incorporation',
        issuer: 'Deeds & Commercial Registries',
        required: true,
        hint: 'The certificate that registered the business name or incorporated the company.',
      },
      {
        id: 'idDocument', accepts: ['NID', 'PASSPORT'],
        label: 'Identification of the owner or directors',
        issuer: 'GECOM / Immigration',
        required: true,
      },
      {
        id: 'proofBusinessAddress', accepts: ['PROOF_OF_ADDRESS'],
        label: 'Proof of the business address',
        issuer: 'Dated within 3 months',
        required: true,
        hint: 'A utility bill or lease for the place of business.',
      },
    ],
  },

  {
    id: 'svc_gra_property_tax',
    slug: 'gra-property-tax',
    name: 'Property Tax Return',
    group: 'gra',
    agencyId: 'gra',
    icon: 'home',
    active: true,
    sortOrder: 4,
    summary: 'File your annual property tax return — due April 30 where net property exceeds G$40,000,000 — or amend one you filed.',
    overview:
      'Every person whose net property exceeds G$40,000,000 on December 31 must file a Property Tax Return with the GRA '
      + 'by April 30 of the following year. The first G$40,000,000 is tax-free; the next G$20,000,000 is taxed at 0.5% '
      + 'and everything above that at 0.75%. Below the threshold there is nothing to pay and no return to file. '
      + 'Filing is free — this form files the return, or amends one you already submitted, and the assessment is raised '
      + 'against your TIN.',
    steps: [
      'Choose whether you are filing the annual return or amending one already filed.',
      'Give the year of assessment and the net value of your property at December 31.',
      'Attach any valuation or statements that support the figure (optional).',
      'GRA assesses the return — the assessment shows here when it is ready.',
      'Any tax due is payable by April 30.',
    ],
    eligibilityRuleIds: ['identityVerified', 'hasGovRecord', 'adult'],
    eligibilityNotes: [
      'A return is only required where net property exceeds G$40,000,000 at December 31.',
      'Returns are due on or before April 30 of the following year.',
      'Rates: nothing on the first G$40M, 0.5% on the next G$20M, 0.75% on the remainder.',
    ],
    prerequisites: [],
    sections: [
      {
        id: 'return',
        title: 'The return',
        description: 'Which year, and whether this is a first filing or an amendment.',
      },
      {
        id: 'property',
        title: 'The property',
        description: 'Where it is and what it is worth.',
      },
    ],
    fields: [
      {
        key: 'applicationType',
        label: 'What are you filing?',
        type: 'radio',
        sectionId: 'return',
        required: true,
        options: [
          { value: 'return', label: 'My annual property tax return' },
          { value: 'change', label: 'An amendment to a return I already filed' },
        ],
      },
      {
        key: 'taxYear',
        label: 'Year of assessment (to 31 December)',
        type: 'select',
        sectionId: 'return',
        required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: '2025', label: '2025 — due 30 April 2026' },
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
        ],
      },
      {
        key: 'previousRef',
        label: 'Reference of the return you are amending',
        type: 'text',
        sectionId: 'return',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        validate: { min: 4, message: 'The reference the original return was filed under.' },
      },
      {
        key: 'changeDetails',
        label: 'What is being corrected?',
        type: 'textarea',
        sectionId: 'return',
        required: true,
        showIf: { field: 'applicationType', equals: 'change' },
        validate: { min: 10, message: 'Say what the filed return got wrong and what the correct position is.' },
      },
      {
        key: 'tin',
        label: 'Your TIN',
        type: 'text',
        sectionId: 'return',
        required: true,
        hint: 'The assessment is raised against your TIN.',
        validate: { min: 6, message: 'Enter the TIN as printed on your certificate.' },
      },
      { key: 'propertyAddress', label: 'Property address', type: 'text', sectionId: 'property', required: true, hint: 'The main property — attach a schedule for others.' },
      { key: 'region', label: 'Region', type: 'select', sectionId: 'property', required: true, options: REGION_OPTIONS },
      {
        key: 'netPropertyValue',
        label: 'Net property value at 31 December (GYD)',
        type: 'number',
        sectionId: 'property',
        required: true,
        hint: 'Everything you own less what you owe. Tax applies only above G$40,000,000.',
        validate: { min: 1, message: 'Enter the net value in Guyana dollars.' },
      },
    ],
    documents: [
      {
        id: 'valuation', accepts: ['OTHER', 'BANK_PROOF'],
        label: 'Valuation or supporting statements',
        issuer: 'Valuer / bank',
        required: false,
        hint: 'Optional — anything that supports the declared value.',
      },
    ],
  },
];

/** @type {import('../types').ServiceFee[]} */
export const GRA_FEES = [
  {
    id: 'fee_gra_tin',
    serviceId: 'svc_gra_tin',
    code: 'GRA-TIN',
    label: 'TIN certificate',
    amountGyd: 0,
    kind: 'application',
    mandatory: true,
    note: 'A TIN is issued free of charge. Nobody may charge you for one.',
  },
  {
    id: 'fee_gra_dl_licence',
    serviceId: 'svc_gra_drivers_licence',
    code: 'GRA-DL',
    label: 'Licence fee (new or renewal)',
    amountGyd: 4500,
    kind: 'application',
    mandatory: true,
    note: 'G$4,500 — the licence is valid for five years.',
  },
  {
    id: 'fee_gra_dl_provisional',
    serviceId: 'svc_gra_drivers_licence',
    code: 'GRA-DL-PROV',
    label: 'Provisional licence (learners only)',
    amountGyd: 1500,
    kind: 'other',
    mandatory: false,
    note: 'Only while learning to drive, before the Letter of Competence is issued.',
  },
  {
    id: 'fee_gra_business',
    serviceId: 'svc_gra_business',
    code: 'GRA-BTX',
    label: 'Registration',
    amountGyd: 0,
    kind: 'application',
    mandatory: true,
    note: 'Registering a business for VAT and PAYE is free of charge.',
  },
  {
    id: 'fee_gra_property_tax',
    serviceId: 'svc_gra_property_tax',
    code: 'GRA-PTX',
    label: 'Filing',
    amountGyd: 0,
    kind: 'application',
    mandatory: true,
    note: 'Filing is free. Any tax assessed is due by April 30.',
  },
];

/** @type {import('../types').ServiceRoute[]} */
export const GRA_ROUTES = [
  {
    id: 'route_gra_tin',
    serviceId: 'svc_gra_tin',
    agencyId: 'gra',
    sequence: 1,
    role: 'lead',
    slaDays: 3,
    purpose: 'Verifies your identity against the record and issues the TIN certificate.',
  },
  {
    id: 'route_gra_drivers_licence',
    serviceId: 'svc_gra_drivers_licence',
    agencyId: 'gra',
    sequence: 1,
    role: 'lead',
    slaDays: 1,
    purpose: 'The Licence Revenue Office verifies your record and prints the licence — renewals are completed the same day.',
  },
  {
    id: 'route_gra_business',
    serviceId: 'svc_gra_business',
    agencyId: 'gra',
    sequence: 1,
    role: 'lead',
    slaDays: 7,
    purpose: 'Sets up the VAT and PAYE accounts against your TIN.',
  },
  {
    id: 'route_gra_property_tax',
    serviceId: 'svc_gra_property_tax',
    agencyId: 'gra',
    sequence: 1,
    role: 'lead',
    slaDays: 14,
    purpose: 'Assesses the return; any property tax due is raised against your TIN.',
  },
];
