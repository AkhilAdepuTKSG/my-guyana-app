// Seeded catalogue for the Single Window (CH&PA SWAS) services.
//
// The Single Window is one online window for land-development approvals: the
// citizen applies once, and the application is routed to every agency that has
// to sign it off. Two things gate every one of them — proof that you hold the
// land, and outline planning permission for what you want to build — so those
// are modelled as prerequisites rather than as ordinary form fields.
//
// Routing is seeded in SINGLE_WINDOW_ROUTES: an ordered list of reviewing
// agencies per service, each with what it is checking and how long it has.
// A route marked `appliesWhen: 'emptyPlot'` is only created when the parcel is
// undeveloped — that is how GWI's site investigation appears for empty plots
// and stays off a developed one.

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

// Every Single Window application opens with the same two sections — who is
// applying, and which parcel. Only the third section differs by service.
const APPLICANT_SECTION = {
  id: 'applicant',
  title: 'Who is applying',
  description: 'The approval is issued in this name. It must match your National ID.',
};

const PARCEL_SECTION = {
  id: 'parcel',
  title: 'The land',
  description: 'Identify the parcel exactly as it appears on your transport, title or lease.',
};

const DECLARATION_SECTION = {
  id: 'declaration',
  title: 'Declaration',
  description: 'Confirm what you have told us before it goes to the reviewing agencies.',
};

/** @returns {import('../types').FieldDef[]} */
function applicantFields() {
  return [
    {
      key: 'applicantName',
      label: 'Full name',
      type: 'text',
      sectionId: 'applicant',
      required: true,
      hint: 'As it appears on your National ID.',
      validate: { min: 3, message: 'Enter your full name as it appears on your ID.' },
    },
    {
      key: 'nationalId',
      label: 'National ID number',
      type: 'text',
      sectionId: 'applicant',
      required: true,
      validate: { min: 6, message: 'Enter the number printed on your National ID.' },
    },
    {
      key: 'phone',
      label: 'Contact number',
      type: 'tel',
      sectionId: 'applicant',
      required: true,
      placeholder: '+592 000 0000',
      hint: 'Agencies call this number to arrange inspections.',
      validate: { pattern: '^[+ 0-9()-]{7,20}$', message: 'Enter a reachable phone number.' },
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      sectionId: 'applicant',
      required: false,
      validate: { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', message: 'Enter a valid email address.' },
    },
    {
      key: 'applyingAs',
      label: 'You are applying as',
      type: 'select',
      sectionId: 'applicant',
      required: true,
      options: [
        { value: '', label: 'Select…' },
        { value: 'owner', label: 'The owner of the land' },
        { value: 'lessee', label: 'A lessee holding a government lease' },
        { value: 'agent', label: 'An agent acting for the owner' },
      ],
    },
    {
      key: 'agentAuthorityRef',
      label: 'Letter of authority reference',
      type: 'text',
      sectionId: 'applicant',
      required: true,
      hint: 'The owner must authorise you in writing. Attach the letter in the next step.',
      showIf: { field: 'applyingAs', equals: 'agent' },
    },
  ];
}

/** @returns {import('../types').FieldDef[]} */
function parcelFields() {
  return [
    {
      key: 'parcelId',
      label: 'Parcel / lot number',
      type: 'text',
      sectionId: 'parcel',
      required: true,
      hint: 'From your transport, title or lease — e.g. Lot 142 Block XX.',
      validate: { min: 2, message: 'Enter the parcel or lot number.' },
    },
    {
      key: 'parcelAddress',
      label: 'Address of the land',
      type: 'textarea',
      sectionId: 'parcel',
      required: true,
      hint: 'Street, scheme or village, and the nearest landmark.',
      validate: { min: 8, message: 'Give the street and village or scheme.' },
    },
    {
      key: 'region',
      label: 'Region',
      type: 'select',
      sectionId: 'parcel',
      required: true,
      options: REGION_OPTIONS,
    },
    {
      key: 'ownershipType',
      label: 'How you hold the land',
      type: 'radio',
      sectionId: 'parcel',
      required: true,
      options: [
        { value: 'transport', label: 'Transport' },
        { value: 'title', label: 'Certificate of title' },
        { value: 'lease', label: 'Government lease' },
        { value: 'allocation', label: 'CH&PA allocation / agreement of sale' },
      ],
    },
    {
      key: 'plotStatus',
      label: 'The plot today',
      type: 'radio',
      sectionId: 'parcel',
      required: true,
      hint: 'An empty plot needs a site investigation before a service can be run to it.',
      options: [
        { value: 'empty', label: 'Empty — nothing built on it yet' },
        { value: 'developed', label: 'Developed — there is a building on it' },
      ],
    },
  ];
}

/** @type {import('../types').PrerequisiteDef[]} */
const LAND_PREREQUISITES = [
  {
    id: 'proofOfLand',
    label: 'Proof that you hold the land',
    detail:
      'A transport, certificate of title, government lease or a CH&PA agreement of sale in your name. '
      + 'Nothing can be approved on a parcel you cannot show you hold.',
    issuedBy: 'Deeds Registry / Guyana Lands & Surveys Commission / CH&PA',
    evidenceRequired: true,
    evidenceLabel: 'Transport, title or lease number',
  },
  {
    id: 'outlinePermission', accepts: ['OUTLINE_PERMISSION'],
    label: 'Outline planning permission',
    detail:
      'CH&PA grants outline planning permission for what you intend to do with the parcel. '
      + 'It is the starting point of every Single Window approval.',
    issuedBy: 'Central Housing & Planning Authority',
    evidenceRequired: true,
    evidenceLabel: 'Outline permission reference',
  },
];

/** @type {import('../types').Service[]} */
export const SINGLE_WINDOW_SERVICES = [
  // ------------------------------------------------------------------
  {
    id: 'svc_sw_water_connection',
    slug: 'water-connection',
    name: 'Water connection',
    group: 'singleWindow',
    agencyId: 'gwi',
    icon: 'droplets',
    summary: 'Have Guyana Water Inc. run a metered potable water supply to your parcel.',
    overview:
      'Guyana Water Inc. supplies the connection, but the application goes through the Single Window so CH&PA, '
      + 'the Central Board of Health and — where a main has to be crossed — the Ministry of Public Works all see it at once. '
      + 'If the plot is still empty, GWI sends an officer to investigate the site first: they confirm how far the nearest main is, '
      + 'what size service line is needed, and what the connection will cost before you are asked to pay.',
    steps: [
      'You confirm you hold the land and have outline planning permission.',
      'You identify the parcel and say whether it is empty or already developed.',
      'GWI investigates an empty site and quotes the connection.',
      'CH&PA confirms the parcel is approved for development.',
      'The Central Board of Health clears the sanitation arrangements.',
      'You pay the connection fee and GWI installs the meter.',
    ],
    eligibilityRuleIds: ['identityVerified', 'canHoldLand'],
    eligibilityNotes: [
      'The parcel must be within a GWI service area with a main you can reasonably be connected to.',
      'Any arrears on another GWI account in your name must be settled first.',
      'An empty plot is always investigated on site before a quote is issued.',
    ],
    prerequisites: LAND_PREREQUISITES,
    sections: [
      APPLICANT_SECTION,
      PARCEL_SECTION,
      {
        id: 'supply',
        title: 'The supply you need',
        description: 'What GWI has to install, and where the meter goes.',
      },
      DECLARATION_SECTION,
    ],
    fields: [
      ...applicantFields(),
      ...parcelFields(),
      {
        key: 'connectionType',
        label: 'What is the water for?',
        type: 'radio',
        sectionId: 'supply',
        required: true,
        options: [
          { value: 'domestic', label: 'A home' },
          { value: 'commercial', label: 'A business' },
          { value: 'construction', label: 'A construction site' },
        ],
      },
      {
        key: 'serviceSize',
        label: 'Service line size',
        type: 'select',
        sectionId: 'supply',
        required: true,
        // No blank placeholder — the household size is the sensible default and
        // GWI confirms it on site, so it starts selected rather than empty.
        defaultValue: '0.5',
        hint: 'Not sure? Leave it as ½ inch — GWI confirms the size at the site investigation.',
        options: [
          { value: '0.5', label: '½ inch — a normal household' },
          { value: '0.75', label: '¾ inch' },
          { value: '1', label: '1 inch — a large household or small business' },
          { value: '2', label: '2 inch — commercial' },
        ],
      },
      {
        key: 'distanceToMain',
        label: 'Roughly how far is the nearest water main? (metres)',
        type: 'number',
        sectionId: 'supply',
        required: false,
        hint: 'An estimate is fine. GWI measures it properly on site.',
        validate: { min: 0, max: 2000, message: 'Enter a distance in metres, up to 2000.' },
      },
      {
        key: 'roadCrossing',
        label: 'Does the line have to cross a road?',
        type: 'radio',
        sectionId: 'supply',
        required: true,
        hint: 'A road crossing needs a Ministry of Public Works excavation permit, which we request for you.',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'I am not sure' },
        ],
      },
      {
        key: 'sanitationType',
        label: 'How is waste water handled?',
        type: 'select',
        sectionId: 'supply',
        required: true,
        hint: 'The Central Board of Health checks this before a supply is approved.',
        options: [
          { value: '', label: 'Select…' },
          { value: 'sewer', label: 'Connected to a public sewer' },
          { value: 'septic', label: 'Septic tank and soakaway' },
          { value: 'pit', label: 'Pit latrine' },
          { value: 'none', label: 'Nothing installed yet' },
        ],
      },
      {
        key: 'accessNotes',
        label: 'Anything the officer should know before visiting?',
        type: 'textarea',
        sectionId: 'supply',
        required: false,
        hint: 'Optional — dogs, locked gate, best time of day.',
      },
      {
        key: 'declaration',
        label: 'I confirm I hold this land and everything above is true.',
        type: 'checkbox',
        sectionId: 'declaration',
        required: true,
      },
    ],
    documents: [
      { id: 'landProof', accepts: ['LAND_TITLE'], label: 'Transport, title or lease', issuer: 'Deeds Registry / GLSC', required: true, hint: 'Your proof that you hold the parcel.' },
      { id: 'outlinePermission', accepts: ['OUTLINE_PERMISSION'], label: 'Outline planning permission', issuer: 'CH&PA', required: true, hint: 'The permission letter or approval notice.' },
      { id: 'nationalId', accepts: ['NID'], label: 'National ID', issuer: 'GECOM', required: true },
      { id: 'sitePlan', accepts: ['SITE_PLAN'], label: 'Site or location plan', issuer: 'A licensed surveyor', required: true, hint: 'Shows the parcel boundaries and where the meter should sit.' },
      { id: 'authorityLetter', accepts: ['AUTHORITY_LETTER'], label: 'Letter of authority', issuer: 'The land owner', required: false, hint: 'Only if you are applying as an agent.' },
    ],
    timeframeDays: 30,
    timeframeNote: 'GWI investigates an empty site within 10 working days. A straightforward connection is completed within 30 days of the fee being paid.',
    sortOrder: 20,
    active: true,
  },

  // ------------------------------------------------------------------
  {
    id: 'svc_sw_construction_permit',
    slug: 'construction-permit',
    name: 'Construction permit',
    group: 'singleWindow',
    agencyId: 'chpa',
    icon: 'hard-hat',
    summary: 'Get your building plan approved and your permit to build issued by CH&PA.',
    overview:
      'This is the main Single Window approval. You submit the building plan once and CH&PA routes it to every agency that has to see it — '
      + 'the Central Board of Health for sanitation, the EPA for environmental screening, the Fire Service for means of escape, '
      + 'Public Works for road access and drainage, Lands & Surveys for the boundaries, and Sea Defence where the parcel sits inside a '
      + 'sea or river reserve. You follow every one of those reviews here rather than visiting each office.',
    steps: [
      'You confirm you hold the land and have outline planning permission.',
      'You describe the building and upload the stamped plans.',
      'CH&PA scrutinises the plan and routes it to the reviewing agencies.',
      'Each agency records its decision here — you see who is holding it and why.',
      'You pay the permit fee once every agency has cleared it.',
      'CH&PA issues the construction permit and building may start.',
    ],
    eligibilityRuleIds: ['identityVerified', 'canHoldLand'],
    eligibilityNotes: [
      'Plans must be prepared and signed by a draughtsman, architect or engineer registered in Guyana.',
      'Structures over two storeys need an engineer\'s structural certification.',
      'Building without a permit is an offence and the structure can be ordered demolished.',
    ],
    prerequisites: LAND_PREREQUISITES,
    sections: [
      APPLICANT_SECTION,
      PARCEL_SECTION,
      {
        id: 'building',
        title: 'What you are building',
        description: 'This decides which agencies have to review the plan and what the fee is.',
      },
      DECLARATION_SECTION,
    ],
    fields: [
      ...applicantFields(),
      ...parcelFields(),
      {
        key: 'buildingUse',
        label: 'What is the building for?',
        type: 'select',
        sectionId: 'building',
        required: true,
        options: [
          { value: '', label: 'Select…' },
          { value: 'residential', label: 'A home' },
          { value: 'commercial', label: 'A business premises' },
          { value: 'industrial', label: 'Industrial' },
          { value: 'institutional', label: 'School, church, clinic or similar' },
          { value: 'mixed', label: 'Mixed use' },
        ],
      },
      {
        key: 'workType',
        label: 'Type of work',
        type: 'radio',
        sectionId: 'building',
        required: true,
        options: [
          { value: 'new', label: 'A new building' },
          { value: 'extension', label: 'An extension to an existing building' },
          { value: 'alteration', label: 'Alteration or renovation' },
          { value: 'demolition', label: 'Demolition' },
        ],
      },
      {
        key: 'storeys',
        label: 'Number of storeys',
        type: 'number',
        sectionId: 'building',
        required: true,
        validate: { min: 1, max: 20, message: 'Enter between 1 and 20 storeys.' },
      },
      {
        key: 'floorAreaSqft',
        label: 'Total floor area (square feet)',
        type: 'number',
        sectionId: 'building',
        required: true,
        hint: 'Every floor added together. The plan scrutiny fee is worked out from this.',
        validate: { min: 50, max: 500000, message: 'Enter the total floor area in square feet.' },
      },
      {
        key: 'estimatedCostGyd',
        label: 'Estimated cost of the works (GYD)',
        type: 'number',
        sectionId: 'building',
        required: true,
        validate: { min: 10000, message: 'Enter the estimated cost in Guyanese dollars.' },
      },
      {
        key: 'designerName',
        label: 'Who prepared the plans?',
        type: 'text',
        sectionId: 'building',
        required: true,
        hint: 'The draughtsman, architect or engineer who signed them.',
        validate: { min: 3, message: 'Name the person who prepared the plans.' },
      },
      {
        key: 'designerRegNo',
        label: 'Their registration number',
        type: 'text',
        sectionId: 'building',
        required: true,
      },
      {
        key: 'sanitationType',
        label: 'Sanitation arrangement',
        type: 'select',
        sectionId: 'building',
        required: true,
        hint: 'The Central Board of Health reviews this.',
        options: [
          { value: '', label: 'Select…' },
          { value: 'sewer', label: 'Connection to a public sewer' },
          { value: 'septic', label: 'Septic tank and soakaway' },
          { value: 'treatment', label: 'On-site treatment plant' },
        ],
      },
      {
        key: 'nearSeaDefence',
        label: 'Is the parcel within a sea or river defence reserve?',
        type: 'radio',
        sectionId: 'building',
        required: true,
        hint: 'Anything inside the reserve needs Sea Defence clearance. If you are unsure, say so — we will have it checked.',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'I am not sure' },
        ],
      },
      {
        key: 'declaration',
        label: 'I confirm the plans are as described and everything above is true.',
        type: 'checkbox',
        sectionId: 'declaration',
        required: true,
      },
    ],
    documents: [
      { id: 'landProof', accepts: ['LAND_TITLE'], label: 'Transport, title or lease', issuer: 'Deeds Registry / GLSC', required: true },
      { id: 'outlinePermission', accepts: ['OUTLINE_PERMISSION'], label: 'Outline planning permission', issuer: 'CH&PA', required: true },
      { id: 'buildingPlans', accepts: ['BUILDING_PLAN'], label: 'Building plans', issuer: 'Registered draughtsman, architect or engineer', required: true, hint: 'Floor plans, elevations and sections, signed and stamped.' },
      { id: 'sitePlan', accepts: ['SITE_PLAN'], label: 'Site plan', issuer: 'A licensed surveyor', required: true, hint: 'Shows boundaries, setbacks and where the building sits on the parcel.' },
      { id: 'structuralCert', accepts: ['STRUCTURAL_CERT'], label: 'Structural certification', issuer: 'A registered engineer', required: false, hint: 'Required above two storeys.' },
      { id: 'nationalId', accepts: ['NID'], label: 'National ID', issuer: 'GECOM', required: true },
      { id: 'authorityLetter', accepts: ['AUTHORITY_LETTER'], label: 'Letter of authority', issuer: 'The land owner', required: false, hint: 'Only if you are applying as an agent.' },
    ],
    timeframeDays: 45,
    timeframeNote: 'CH&PA aims to decide within 45 days of a complete application. The clock only starts once every reviewing agency has what it needs.',
    sortOrder: 21,
    active: true,
  },

  // ------------------------------------------------------------------
  {
    id: 'svc_sw_power_connection',
    slug: 'power-connection',
    name: 'Power connection',
    group: 'singleWindow',
    agencyId: 'gpl',
    icon: 'plug-zap',
    summary: 'Have Guyana Power & Light run a metered electricity supply to your property.',
    overview:
      'Guyana Power & Light connects the supply, but the application runs through the Single Window so the wiring inspection, '
      + 'and any Public Works clearance needed to put up a pole or cross a road reserve, are handled in the same place. '
      + 'A new building must have a valid construction permit or occupancy certificate and a wiring certificate from a licensed '
      + 'electrician before GPL will energise it.',
    steps: [
      'You confirm you hold the land and the building is permitted.',
      'You give the load you need and your electrician\'s wiring certificate.',
      'GPL inspects the installation.',
      'Public Works clears any pole or road-reserve work.',
      'You pay the connection fee and meter deposit.',
      'GPL installs the meter and energises the supply.',
    ],
    eligibilityRuleIds: ['identityVerified', 'canHoldLand'],
    eligibilityNotes: [
      'The property must be within reach of GPL\'s distribution network.',
      'A new building needs a construction permit or occupancy certificate first.',
      'The internal wiring must be certified by an electrician licensed in Guyana.',
      'Arrears on another GPL account in your name must be settled first.',
    ],
    prerequisites: [
      LAND_PREREQUISITES[0],
      {
        id: 'buildingApproval', accepts: ['BUILDING_PERMIT'],
        label: 'Construction permit or occupancy certificate',
        detail:
          'GPL will not energise a new building that CH&PA has not permitted. If the building already exists and is occupied, '
          + 'the occupancy certificate is what we need.',
        issuedBy: 'Central Housing & Planning Authority',
        evidenceRequired: true,
        evidenceLabel: 'Permit or occupancy certificate number',
      },
    ],
    sections: [
      APPLICANT_SECTION,
      PARCEL_SECTION,
      {
        id: 'supply',
        title: 'The supply you need',
        description: 'The load and the wiring certificate GPL inspects against.',
      },
      DECLARATION_SECTION,
    ],
    fields: [
      ...applicantFields(),
      ...parcelFields(),
      {
        key: 'supplyType',
        label: 'What is the supply for?',
        type: 'radio',
        sectionId: 'supply',
        required: true,
        options: [
          { value: 'domestic', label: 'A home' },
          { value: 'commercial', label: 'A business' },
          { value: 'industrial', label: 'Industrial' },
        ],
      },
      {
        key: 'phase',
        label: 'Phase',
        type: 'select',
        sectionId: 'supply',
        required: true,
        defaultValue: 'single',
        hint: 'Most homes are single phase. Your electrician will know.',
        options: [
          { value: 'single', label: 'Single phase' },
          { value: 'three', label: 'Three phase' },
        ],
      },
      {
        key: 'loadKw',
        label: 'Load required (kW)',
        type: 'number',
        sectionId: 'supply',
        required: true,
        hint: 'From your electrician\'s load schedule.',
        validate: { min: 1, max: 5000, message: 'Enter the load in kilowatts.' },
      },
      {
        key: 'electricianName',
        label: 'Your licensed electrician',
        type: 'text',
        sectionId: 'supply',
        required: true,
        validate: { min: 3, message: 'Name the electrician who wired the building.' },
      },
      {
        key: 'electricianLicenceNo',
        label: 'Their licence number',
        type: 'text',
        sectionId: 'supply',
        required: true,
      },
      {
        key: 'wiringCertRef',
        label: 'Wiring certificate number',
        type: 'text',
        sectionId: 'supply',
        required: true,
        hint: 'GPL inspects against this certificate.',
      },
      {
        key: 'newPoleRequired',
        label: 'Does a new pole or road crossing seem to be needed?',
        type: 'radio',
        sectionId: 'supply',
        required: true,
        hint: 'That needs Public Works clearance, which we request for you.',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'I am not sure' },
        ],
      },
      {
        key: 'declaration',
        label: 'I confirm the installation is complete and certified, and everything above is true.',
        type: 'checkbox',
        sectionId: 'declaration',
        required: true,
      },
    ],
    documents: [
      { id: 'landProof', accepts: ['LAND_TITLE'], label: 'Transport, title or lease', issuer: 'Deeds Registry / GLSC', required: true },
      { id: 'buildingApproval', accepts: ['BUILDING_PERMIT'], label: 'Construction permit or occupancy certificate', issuer: 'CH&PA', required: true },
      { id: 'wiringCert', accepts: ['WIRING_CERTIFICATE'], label: 'Wiring certificate', issuer: 'A licensed electrician', required: true, hint: 'Certifies the internal installation is safe to energise.' },
      { id: 'loadSchedule', accepts: ['LOAD_SCHEDULE'], label: 'Load schedule', issuer: 'Your electrician', required: false, hint: 'Optional for a normal household supply.' },
      { id: 'nationalId', accepts: ['NID'], label: 'National ID', issuer: 'GECOM', required: true },
    ],
    timeframeDays: 30,
    timeframeNote: 'GPL inspects within 10 working days and energises a straightforward supply within 30 days of the fee being paid.',
    sortOrder: 22,
    active: true,
  },

  // ------------------------------------------------------------------
  {
    id: 'svc_sw_construction_utilities',
    slug: 'construction-utilities',
    name: 'Construction utilities',
    group: 'singleWindow',
    agencyId: 'chpa',
    icon: 'construction',
    summary: 'Temporary water and power to a site you already have land approval to build on.',
    overview:
      'Once your land is approved for development you can ask for temporary utilities to build with, before the permanent '
      + 'connections are installed. CH&PA confirms the land approval, then GWI and GPL each set up a temporary supply for the '
      + 'duration of the works. The supplies are metered and are removed or converted when the building is complete.',
    steps: [
      'CH&PA confirms your land approval covers the works you describe.',
      'You say which temporary supplies you need and for how long.',
      'GWI arranges a temporary water supply where you asked for one.',
      'GPL arranges a temporary builder\'s supply where you asked for one.',
      'You pay the temporary connection fees and the supplies are installed.',
    ],
    eligibilityRuleIds: ['identityVerified', 'canHoldLand'],
    eligibilityNotes: [
      'You must already hold land approval or a construction permit for the site.',
      'A temporary supply runs for the stated period and is then removed or converted.',
      'The site must be reasonably secure — meters are your responsibility once installed.',
    ],
    prerequisites: [
      LAND_PREREQUISITES[0],
      {
        id: 'landApproval', accepts: ['OUTLINE_PERMISSION', 'BUILDING_PERMIT'],
        label: 'Land development approval',
        detail:
          'CH&PA\'s approval that this parcel may be developed as you intend. This is what a temporary utility supply hangs off.',
        issuedBy: 'Central Housing & Planning Authority',
        evidenceRequired: true,
        evidenceLabel: 'Land approval or permit reference',
      },
    ],
    sections: [
      APPLICANT_SECTION,
      PARCEL_SECTION,
      {
        id: 'works',
        title: 'The works and what you need',
        description: 'Which temporary supplies, and for how long.',
      },
      DECLARATION_SECTION,
    ],
    fields: [
      ...applicantFields(),
      ...parcelFields(),
      {
        key: 'worksDescription',
        label: 'What is being built?',
        type: 'textarea',
        sectionId: 'works',
        required: true,
        validate: { min: 15, max: 600, message: 'Describe the works in a sentence or two.' },
      },
      {
        key: 'utilitiesNeeded',
        label: 'Which temporary supplies do you need?',
        type: 'radio',
        sectionId: 'works',
        required: true,
        options: [
          { value: 'water', label: 'Water only' },
          { value: 'power', label: 'Power only' },
          { value: 'both', label: 'Both water and power' },
        ],
      },
      {
        key: 'startDate',
        label: 'When do the works start?',
        type: 'date',
        sectionId: 'works',
        required: true,
        validate: { date: 'future', message: 'The start date must be in the future.' },
      },
      {
        key: 'durationMonths',
        label: 'How many months do you need them for?',
        type: 'number',
        sectionId: 'works',
        required: true,
        hint: 'A temporary supply can be extended if the works run on.',
        validate: { min: 1, max: 36, message: 'Enter between 1 and 36 months.' },
      },
      {
        key: 'siteContactName',
        label: 'Site contact',
        type: 'text',
        sectionId: 'works',
        required: true,
        hint: 'Who the installation crews should ask for on site.',
      },
      {
        key: 'siteContactPhone',
        label: 'Site contact number',
        type: 'tel',
        sectionId: 'works',
        required: true,
        validate: { pattern: '^[+ 0-9()-]{7,20}$', message: 'Enter a reachable phone number.' },
      },
      {
        key: 'declaration',
        label: 'I confirm the site is approved for these works and everything above is true.',
        type: 'checkbox',
        sectionId: 'declaration',
        required: true,
      },
    ],
    documents: [
      { id: 'landProof', accepts: ['LAND_TITLE'], label: 'Transport, title or lease', issuer: 'Deeds Registry / GLSC', required: true },
      { id: 'landApproval', accepts: ['OUTLINE_PERMISSION', 'BUILDING_PERMIT'], label: 'Land development approval or permit', issuer: 'CH&PA', required: true },
      { id: 'sitePlan', accepts: ['SITE_PLAN'], label: 'Site plan', issuer: 'A licensed surveyor', required: true, hint: 'Shows where the temporary supplies should terminate.' },
      { id: 'nationalId', accepts: ['NID'], label: 'National ID', issuer: 'GECOM', required: true },
    ],
    timeframeDays: 21,
    timeframeNote: 'Temporary supplies are normally arranged within three weeks of CH&PA confirming the land approval.',
    sortOrder: 23,
    active: true,
  },
];

/** @type {import('../types').ServiceFee[]} */
export const SINGLE_WINDOW_FEES = [
  // Water connection
  { id: 'fee_sw_water_app', serviceId: 'svc_sw_water_connection', code: 'GWI-APP', label: 'Application processing', amountGyd: 2000, kind: 'application', mandatory: true, note: 'Payable when you submit.' },
  { id: 'fee_sw_water_site', serviceId: 'svc_sw_water_connection', code: 'GWI-SITE', label: 'Site investigation', amountGyd: 5000, kind: 'inspection', mandatory: false, note: 'Charged only for an empty plot, where GWI must survey the site first.' },
  { id: 'fee_sw_water_conn', serviceId: 'svc_sw_water_connection', code: 'GWI-CONN', label: 'Connection fee (½ inch service)', amountGyd: 25000, kind: 'connection', mandatory: false, note: 'Quoted after the site investigation and payable on approval. A longer run or larger service costs more.' },
  { id: 'fee_sw_water_meter', serviceId: 'svc_sw_water_connection', code: 'GWI-METER', label: 'Meter deposit', amountGyd: 8000, kind: 'connection', mandatory: false, note: 'Refundable when the account is closed.' },

  // Construction permit
  { id: 'fee_sw_permit_scrutiny', serviceId: 'svc_sw_construction_permit', code: 'CHPA-SCRUT', label: 'Plan scrutiny fee', amountGyd: 5000, kind: 'application', mandatory: true, note: 'Payable when you submit. Larger floor areas are charged more.' },
  { id: 'fee_sw_permit_permit', serviceId: 'svc_sw_construction_permit', code: 'CHPA-PERMIT', label: 'Construction permit fee', amountGyd: 20000, kind: 'processing', mandatory: false, note: 'Payable once every reviewing agency has cleared the plan.' },
  { id: 'fee_sw_permit_inspect', serviceId: 'svc_sw_construction_permit', code: 'CHPA-INSPECT', label: 'Stage inspections', amountGyd: 6000, kind: 'inspection', mandatory: false, note: 'Covers the foundation, framing and final inspections during construction.' },

  // Power connection
  { id: 'fee_sw_power_app', serviceId: 'svc_sw_power_connection', code: 'GPL-APP', label: 'Application processing', amountGyd: 2500, kind: 'application', mandatory: true, note: 'Payable when you submit.' },
  { id: 'fee_sw_power_inspect', serviceId: 'svc_sw_power_connection', code: 'GPL-INSPECT', label: 'Wiring inspection', amountGyd: 5000, kind: 'inspection', mandatory: true, note: 'GPL inspects the internal installation before energising.' },
  { id: 'fee_sw_power_conn', serviceId: 'svc_sw_power_connection', code: 'GPL-CONN', label: 'Service connection', amountGyd: 30000, kind: 'connection', mandatory: false, note: 'Quoted after inspection. A new pole or road crossing costs more.' },
  { id: 'fee_sw_power_meter', serviceId: 'svc_sw_power_connection', code: 'GPL-METER', label: 'Meter deposit', amountGyd: 12000, kind: 'connection', mandatory: false, note: 'Refundable when the account is closed.' },

  // Construction utilities
  { id: 'fee_sw_util_app', serviceId: 'svc_sw_construction_utilities', code: 'SWAS-UTIL-APP', label: 'Application processing', amountGyd: 3000, kind: 'application', mandatory: true, note: 'Payable when you submit.' },
  { id: 'fee_sw_util_water', serviceId: 'svc_sw_construction_utilities', code: 'GWI-TEMP', label: 'Temporary water supply', amountGyd: 15000, kind: 'connection', mandatory: false, note: 'Charged if you asked for temporary water. Payable on approval.' },
  { id: 'fee_sw_util_power', serviceId: 'svc_sw_construction_utilities', code: 'GPL-TEMP', label: 'Temporary builder\'s supply', amountGyd: 18000, kind: 'connection', mandatory: false, note: 'Charged if you asked for temporary power. Payable on approval.' },
];

/**
 * The approval routing. Order matters: `sequence` is the order agencies are
 * asked, and the tracker shows exactly who is holding an application. Routes
 * marked `appliesWhen: 'emptyPlot'` are only created for an undeveloped parcel.
 * @type {import('../types').ServiceRoute[]}
 */
export const SINGLE_WINDOW_ROUTES = [
  // --- Water connection ---
  { id: 'route_water_gwi', serviceId: 'svc_sw_water_connection', agencyId: 'gwi', sequence: 1, role: 'lead', slaDays: 5, purpose: 'Checks the parcel is in a service area and the application is complete.', appliesWhen: 'always' },
  { id: 'route_water_gwi_site', serviceId: 'svc_sw_water_connection', agencyId: 'gwi', sequence: 2, role: 'inspection', slaDays: 10, purpose: 'Site investigation — measures the run to the nearest main, fixes the service size and quotes the connection.', appliesWhen: 'emptyPlot' },
  { id: 'route_water_chpa', serviceId: 'svc_sw_water_connection', agencyId: 'chpa', sequence: 3, role: 'reviewer', slaDays: 7, purpose: 'Confirms the parcel is approved for development and the supply matches the permitted use.', appliesWhen: 'always' },
  { id: 'route_water_cbh', serviceId: 'svc_sw_water_connection', agencyId: 'cbh', sequence: 4, role: 'clearance', slaDays: 7, purpose: 'Clears the sanitation arrangement — a potable supply is not approved without safe waste-water disposal.', appliesWhen: 'always' },
  { id: 'route_water_mopw', serviceId: 'svc_sw_water_connection', agencyId: 'mopw', sequence: 5, role: 'clearance', slaDays: 7, purpose: 'Issues the excavation permit where the service line has to cross a road reserve.', appliesWhen: 'always' },

  // --- Construction permit ---
  { id: 'route_permit_chpa', serviceId: 'svc_sw_construction_permit', agencyId: 'chpa', sequence: 1, role: 'lead', slaDays: 10, purpose: 'Scrutinises the building plan against the development and zoning requirements.', appliesWhen: 'always' },
  { id: 'route_permit_glsc', serviceId: 'svc_sw_construction_permit', agencyId: 'glsc', sequence: 2, role: 'reviewer', slaDays: 7, purpose: 'Verifies the parcel boundaries and that the building sits inside them.', appliesWhen: 'always' },
  { id: 'route_permit_cbh', serviceId: 'svc_sw_construction_permit', agencyId: 'cbh', sequence: 3, role: 'clearance', slaDays: 7, purpose: 'Reviews sanitation, drainage and the water supply arrangements.', appliesWhen: 'always' },
  { id: 'route_permit_epa', serviceId: 'svc_sw_construction_permit', agencyId: 'epa', sequence: 4, role: 'clearance', slaDays: 10, purpose: 'Environmental screening — decides whether the works need an environmental authorisation.', appliesWhen: 'always' },
  { id: 'route_permit_gfs', serviceId: 'svc_sw_construction_permit', agencyId: 'gfs', sequence: 5, role: 'clearance', slaDays: 7, purpose: 'Checks means of escape, access for appliances and fire-fighting provision.', appliesWhen: 'always' },
  { id: 'route_permit_mopw', serviceId: 'svc_sw_construction_permit', agencyId: 'mopw', sequence: 6, role: 'clearance', slaDays: 7, purpose: 'Reviews access from the public road, parking and drainage discharge.', appliesWhen: 'always' },
  { id: 'route_permit_seadefence', serviceId: 'svc_sw_construction_permit', agencyId: 'seadefence', sequence: 7, role: 'clearance', slaDays: 10, purpose: 'Clears anything inside a sea or river defence reserve.', appliesWhen: 'always' },

  // --- Power connection ---
  { id: 'route_power_gpl', serviceId: 'svc_sw_power_connection', agencyId: 'gpl', sequence: 1, role: 'lead', slaDays: 5, purpose: 'Checks the network can carry the load and the application is complete.', appliesWhen: 'always' },
  { id: 'route_power_gpl_inspect', serviceId: 'svc_sw_power_connection', agencyId: 'gpl', sequence: 2, role: 'inspection', slaDays: 10, purpose: 'Inspects the internal wiring against the certificate before energising.', appliesWhen: 'always' },
  { id: 'route_power_chpa', serviceId: 'svc_sw_power_connection', agencyId: 'chpa', sequence: 3, role: 'reviewer', slaDays: 7, purpose: 'Confirms the building is permitted or holds an occupancy certificate.', appliesWhen: 'always' },
  { id: 'route_power_mopw', serviceId: 'svc_sw_power_connection', agencyId: 'mopw', sequence: 4, role: 'clearance', slaDays: 7, purpose: 'Clears a new pole or a service line crossing a road reserve.', appliesWhen: 'always' },

  // --- Construction utilities ---
  { id: 'route_util_chpa', serviceId: 'svc_sw_construction_utilities', agencyId: 'chpa', sequence: 1, role: 'lead', slaDays: 7, purpose: 'Confirms the land approval covers the works described.', appliesWhen: 'always' },
  { id: 'route_util_gwi', serviceId: 'svc_sw_construction_utilities', agencyId: 'gwi', sequence: 2, role: 'reviewer', slaDays: 10, purpose: 'Arranges the temporary water supply to the site.', appliesWhen: 'always' },
  { id: 'route_util_gpl', serviceId: 'svc_sw_construction_utilities', agencyId: 'gpl', sequence: 3, role: 'reviewer', slaDays: 10, purpose: 'Arranges the temporary builder\'s electricity supply.', appliesWhen: 'always' },
];
