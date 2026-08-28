// The document-type contract. One definition, consumed by every layer.
//
// Before this, three overlapping vocabularies described the same documents:
// the Vault screen's own `DOC_TYPES`, the store's `VAULT_KINDS`, and the
// matcher's `DOCUMENT_KINDS`. Nothing reconciled them, so a document could sit
// in the wrong Vault section and could be attached to a field that should never
// have accepted it.
//
// Everything now refers to the ids below:
//   • the Vault decides which section a document belongs in from its `category`;
//   • a form field declares `accepts: [...]` with these ids;
//   • the endpoints reject an attachment whose type is not in that list;
//   • `vault_documents.type` stores it, indexed.
//
// Adding a document type is a change here and nowhere else.

/**
 * Vault sections. A document's category decides which one it appears in, so
 * "Cards & IDs" holds identity cards and nothing else — no letters, no
 * certificates, no supporting paperwork.
 */
export const VAULT_SECTIONS = {
  cards: { id: 'cards', title: 'Cards & IDs' },
  records: { id: 'records', title: 'Documents & records' },
};

/** Categories, and the Vault section each one lands in. */
export const DOCUMENT_CATEGORIES = {
  'id-card': { id: 'id-card', label: 'Identity card', section: 'cards' },
  'civil-certificate': { id: 'civil-certificate', label: 'Civil certificate', section: 'records' },
  clearance: { id: 'clearance', label: 'Clearance', section: 'records' },
  proof: { id: 'proof', label: 'Supporting proof', section: 'records' },
  land: { id: 'land', label: 'Land and property', section: 'records' },
  plan: { id: 'plan', label: 'Plan or drawing', section: 'records' },
  permit: { id: 'permit', label: 'Permit or approval', section: 'records' },
  letter: { id: 'letter', label: 'Letter', section: 'records' },
  photo: { id: 'photo', label: 'Photograph', section: 'records' },
  other: { id: 'other', label: 'Other document', section: 'records' },
};

/**
 * @typedef {Object} DocumentTypeDef
 * @property {string} id
 * @property {string} label          what a citizen sees
 * @property {string} category       keys DOCUMENT_CATEGORIES
 * @property {string} icon           lucide icon name
 * @property {string} [issuer]       who issues it, for the Vault request flow
 * @property {boolean} [requestable]  a citizen can ask the agency for a copy
 * @property {boolean} [issued]      government-issued: it lives in the Vault and
 *                                    connects from there — a citizen never uploads
 *                                    one (proofs, photos and plans stay uploadable)
 * @property {boolean} [unique]      a person holds at most one of these at a time,
 *                                    so a newer copy replaces the one on file rather
 *                                    than sitting beside it
 * @property {RegExp[]} [patterns]   how a free-text name is recognised as this type
 */

/**
 * Every document type the app knows about.
 * @type {Record<string, DocumentTypeDef>}
 */
export const DOCUMENT_TYPES = {
  // --- Cards & IDs -------------------------------------------------------
  EID: {
    id: 'EID', issued: true, unique: true, label: 'e-ID', category: 'id-card', icon: 'fingerprint',
    issuer: 'the Digital Identity Card Registry',
    patterns: [/\be-?id\b/, /digital identity card/],
  },
  NID: {
    id: 'NID', issued: true, unique: true, label: 'National ID', category: 'id-card', icon: 'id-card',
    issuer: 'GECOM', requestable: true,
    patterns: [/national id\b/, /\bnid\b/, /national identification/, /national identity card/],
  },
  PASSPORT: {
    id: 'PASSPORT', issued: true, unique: true, label: 'Passport', category: 'id-card', icon: 'book-user',
    issuer: 'the Immigration Department', requestable: true,
    patterns: [/passport/],
  },
  DRIVERS_LICENCE: {
    id: 'DRIVERS_LICENCE', issued: true, unique: true, label: "Driver's licence", category: 'id-card', icon: 'car',
    issuer: 'the Guyana Police Force', requestable: true,
    patterns: [/driver/, /driving licence/, /driving license/],
  },
  NIS_CARD: {
    id: 'NIS_CARD', issued: true, unique: true, label: 'NIS card', category: 'id-card', icon: 'shield-check',
    issuer: 'the National Insurance Scheme',
    patterns: [/nis card/],
  },

  // --- Civil certificates -------------------------------------------------
  BIRTH_CERTIFICATE: {
    id: 'BIRTH_CERTIFICATE', issued: true, unique: true, label: 'Birth certificate', category: 'civil-certificate', icon: 'baby',
    issuer: 'the General Register Office', requestable: true,
    patterns: [/birth/],
  },
  DEATH_CERTIFICATE: {
    id: 'DEATH_CERTIFICATE', issued: true, label: 'Death certificate', category: 'civil-certificate', icon: 'file-text',
    issuer: 'the General Register Office',
    patterns: [/death/],
  },
  MARRIAGE_CERTIFICATE: {
    id: 'MARRIAGE_CERTIFICATE', issued: true, label: 'Marriage certificate', category: 'civil-certificate', icon: 'heart-handshake',
    issuer: 'the General Register Office',
    patterns: [/marriage/],
  },

  // --- Clearances and registrations ---------------------------------------
  POLICE_CLEARANCE: {
    id: 'POLICE_CLEARANCE', issued: true, unique: true, label: 'Police clearance certificate', category: 'clearance', icon: 'shield',
    issuer: 'the Guyana Police Force', requestable: true,
    patterns: [/police clearance/, /clearance certificate/],
  },
  TIN_CERTIFICATE: {
    id: 'TIN_CERTIFICATE', issued: true, unique: true, label: 'TIN certificate', category: 'clearance', icon: 'hash',
    issuer: 'the Guyana Revenue Authority', requestable: true,
    patterns: [/\btin\b/, /taxpayer identification/],
  },
  NIS_CERTIFICATE: {
    id: 'NIS_CERTIFICATE', issued: true, unique: true, label: 'NIS registration certificate', category: 'clearance', icon: 'shield-check',
    issuer: 'the National Insurance Scheme',
    patterns: [/nis registration/, /national insurance/],
  },
  EID_LETTER: {
    id: 'EID_LETTER', issued: true, unique: true, label: 'e-ID issuance letter', category: 'letter', icon: 'badge-check',
    issuer: 'the Digital Identity Card Registry',
    patterns: [/e-?id issuance/, /issuance letter/],
  },

  // --- Supporting proofs ---------------------------------------------------
  PROOF_OF_ADDRESS: {
    id: 'PROOF_OF_ADDRESS', label: 'Proof of address', category: 'proof', icon: 'map-pin',
    patterns: [/proof of address/, /utility bill/, /bank statement/],
  },
  PROOF_OF_INCOME: {
    id: 'PROOF_OF_INCOME', label: 'Proof of income', category: 'proof', icon: 'receipt',
    patterns: [/proof of income/, /pay ?slip/, /income/],
  },
  BANK_PROOF: {
    id: 'BANK_PROOF', label: 'Bank account proof', category: 'proof', icon: 'landmark',
    patterns: [/bank account proof/, /bank letter/],
  },
  SCHOOL_LETTER: {
    id: 'SCHOOL_LETTER', label: 'School enrolment letter', category: 'letter', icon: 'graduation-cap',
    patterns: [/school enrolment/, /school enrollment/, /enrolment letter/],
  },
  AUTHORITY_LETTER: {
    id: 'AUTHORITY_LETTER', label: 'Letter of authority', category: 'letter', icon: 'file-signature',
    patterns: [/letter of authority/, /authority letter/],
  },
  PASSPORT_PHOTO: {
    id: 'PASSPORT_PHOTO', label: 'Passport photograph', category: 'photo', icon: 'camera',
    patterns: [/passport photo/, /photograph/],
  },

  // --- Land, plans and permits ---------------------------------------------
  LAND_TITLE: {
    id: 'LAND_TITLE', label: 'Transport, title or lease', category: 'land', icon: 'stamp',
    issuer: 'the Deeds Registry',
    patterns: [/transport/, /certificate of title/, /\btitle\b/, /lease/, /agreement of sale/],
  },
  OUTLINE_PERMISSION: {
    id: 'OUTLINE_PERMISSION', label: 'Outline planning permission', category: 'permit', icon: 'map',
    issuer: 'the Central Housing & Planning Authority',
    patterns: [/outline planning/, /outline permission/, /land development approval/, /land approval/],
  },
  BUILDING_PERMIT: {
    id: 'BUILDING_PERMIT', label: 'Construction permit', category: 'permit', icon: 'hard-hat',
    issuer: 'the Central Housing & Planning Authority',
    patterns: [/construction permit/, /occupancy certificate/, /building permit/],
  },
  SITE_PLAN: {
    id: 'SITE_PLAN', label: 'Site or location plan', category: 'plan', icon: 'land-plot',
    patterns: [/site or location/, /site plan/, /location plan/],
  },
  BUILDING_PLAN: {
    id: 'BUILDING_PLAN', label: 'Building plans', category: 'plan', icon: 'ruler',
    patterns: [/building plan/, /floor plan/, /elevation/],
  },
  STRUCTURAL_CERT: {
    id: 'STRUCTURAL_CERT', label: 'Structural certification', category: 'plan', icon: 'square-stack',
    patterns: [/structural/],
  },
  WIRING_CERTIFICATE: {
    id: 'WIRING_CERTIFICATE', label: 'Wiring certificate', category: 'clearance', icon: 'plug-zap',
    patterns: [/wiring/],
  },
  LOAD_SCHEDULE: {
    id: 'LOAD_SCHEDULE', label: 'Load schedule', category: 'plan', icon: 'list-checks',
    patterns: [/load schedule/],
  },

  OTHER: {
    id: 'OTHER', label: 'Other document', category: 'other', icon: 'file',
    patterns: [],
  },
};

/** Ids in a stable order — used for pickers and the request sheet. */
export const DOCUMENT_TYPE_IDS = Object.keys(DOCUMENT_TYPES);

/** The types a citizen can ask the issuing agency for from the Vault. */
export const REQUESTABLE_TYPE_IDS = DOCUMENT_TYPE_IDS.filter((id) => DOCUMENT_TYPES[id].requestable);

/**
 * How a document slot may be filled, from the types it accepts (per the
 * reference design): IDs and certificates connect straight from the Vault and
 * are never uploaded; anything only the citizen holds — a photo, a proof of
 * address, a plan — is uploaded. A slot accepting both kinds offers both.
 * @param {string[]} accepts
 * @returns {{vault: boolean, upload: boolean}}
 */
export function attachmentRoutes(accepts) {
  const defs = (accepts || []).map((id) => DOCUMENT_TYPES[id]).filter(Boolean);
  // An untyped slot keeps both doors open rather than locking the citizen out.
  if (!defs.length) return { vault: true, upload: true };
  return {
    vault: true, // whatever the type, a copy already in the Vault is always acceptable
    upload: defs.some((d) => !d.issued),
  };
}

/**
 * @param {string} typeId
 * @returns {DocumentTypeDef}
 */
export function documentType(typeId) {
  return DOCUMENT_TYPES[typeId] || DOCUMENT_TYPES.OTHER;
}

/** Which Vault section a type belongs in — `cards` or `records`. */
export function sectionForType(typeId) {
  const cat = DOCUMENT_CATEGORIES[documentType(typeId).category];
  return cat?.section || 'records';
}

/** Is this an identity card? Only these may appear under Cards & IDs. */
export function isIdCard(typeId) {
  return documentType(typeId).category === 'id-card';
}

/**
 * Does a citizen hold at most one of these?
 *
 * A person has one National ID, one passport, one licence, one birth
 * certificate. A newer copy of such a document is the *same* document — it
 * replaces what was on file rather than appearing beside it. Proofs, plans and
 * permits are the opposite: a citizen legitimately holds several, one per
 * parcel or per month, so those accumulate.
 */
export function isUniqueType(typeId) {
  return !!documentType(typeId).unique;
}

function normalise(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Order matters: the first type whose pattern hits wins, so the specific ones
// are tested before the general. `OTHER` has no patterns and never matches.
const MATCH_ORDER = [
  'EID_LETTER', 'EID',
  'BIRTH_CERTIFICATE', 'DEATH_CERTIFICATE', 'MARRIAGE_CERTIFICATE',
  'POLICE_CLEARANCE', 'NIS_CARD', 'NIS_CERTIFICATE', 'TIN_CERTIFICATE',
  'NID', 'PASSPORT_PHOTO', 'PASSPORT', 'DRIVERS_LICENCE',
  'PROOF_OF_ADDRESS', 'PROOF_OF_INCOME', 'BANK_PROOF',
  'SCHOOL_LETTER', 'AUTHORITY_LETTER',
  'OUTLINE_PERMISSION', 'BUILDING_PERMIT',
  'SITE_PLAN', 'BUILDING_PLAN', 'STRUCTURAL_CERT', 'LOAD_SCHEDULE', 'WIRING_CERTIFICATE',
  'LAND_TITLE',
];

/**
 * Recognise a type from a free-text document name. Used to classify the
 * documents the government record derives (which carry no stored type) and to
 * migrate rows written before types existed.
 * @param {string} name
 * @returns {string} a DOCUMENT_TYPES id
 */
export function typeFromName(name) {
  const n = normalise(name);
  if (!n) return 'OTHER';
  for (const id of MATCH_ORDER) {
    const patterns = DOCUMENT_TYPES[id].patterns || [];
    if (patterns.some((p) => p.test(n))) return id;
  }
  return 'OTHER';
}

/**
 * The type a stored row really is: what was recorded, or failing that what its
 * name reads as. One function so every layer classifies identically.
 * @param {string|null|undefined} storedType
 * @param {string|null|undefined} name
 */
export function resolveType(storedType, name) {
  if (storedType && DOCUMENT_TYPES[storedType]) return storedType;
  return typeFromName(name);
}

/**
 * Does a document of `typeId` satisfy a field that accepts `accepts`?
 *
 * A field with no `accepts` list accepts nothing from the Vault — a typed slot
 * has to say what it takes. This is the single rule both the picker and the
 * endpoints apply, so the UI can never offer what the API would reject.
 *
 * @param {string[]|undefined} accepts
 * @param {string} typeId
 */
export function typeAccepted(accepts, typeId) {
  if (!Array.isArray(accepts) || accepts.length === 0) return false;
  return accepts.includes(typeId);
}

/** Human list of what a field takes, for error messages and empty states. */
export function acceptedLabel(accepts) {
  const labels = (accepts || []).map((id) => documentType(id).label);
  if (labels.length === 0) return 'no document type';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}
