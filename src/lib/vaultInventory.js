// One answer to "what is in this citizen's Vault?".
//
// The Vault is fed from several places, and before this they were only ever
// assembled on the Vault screen itself — so a service asking "do you have a
// National ID?" could only see the documents its own store had written, and
// told the citizen their Vault was empty while the Vault screen was showing
// the very document they were asking for.
//
// Everything now goes through `buildVaultInventory`, which normalises all of
// it into one list, and `matchRequirement`, which decides whether a given
// requirement is already covered. Every service — the seeded ones and the
// older bespoke flows — asks the same two questions of the same list.
//
// The sources:
//   • the e-ID itself;
//   • CARDS & IDS derived from the government record (licence, National ID, NIS);
//   • DOCUMENTS & RECORDS derived from the record and connected agencies;
//   • documents the citizen requested through the Vault (context `vaultDocs`);
//   • documents filed by a service against their account (`vault_documents`),
//     which is where uploads and collected certificates land.

/** The vocabulary every source is normalised into. */
export const DOCUMENT_KINDS = [
  'e-id',
  'national-id',
  'passport',
  'licence',
  'birth-certificate',
  'death-certificate',
  'marriage-certificate',
  'nis',
  'police-clearance',
  'proof-of-address',
  'proof-of-income',
  'site-plan',
  'building-plan',
  'plan',
  'land-title',
  'permit',
  'certificate',
  'other',
];

// Words that identify a kind, most specific first — a label is tested against
// these in order, so "Birth certificate" is a birth certificate rather than a
// generic certificate, and "National ID or current passport" is a National ID.
const KIND_PATTERNS = [
  ['e-id', [/\be-?id\b/, /digital identity/]],
  ['birth-certificate', [/birth/]],
  ['death-certificate', [/death/]],
  ['marriage-certificate', [/marriage/]],
  ['police-clearance', [/police/, /clearance/]],
  ['national-id', [/national id/, /\bnid\b/, /national identification/, /gecom/]],
  ['passport', [/passport/]],
  ['licence', [/licence/, /license/, /driver/]],
  ['nis', [/\bnis\b/, /national insurance/]],
  ['proof-of-address', [/proof of address/, /utility bill/, /bank statement/]],
  ['proof-of-income', [/proof of income/, /pay ?slip/, /income/]],
  ['land-title', [/transport/, /title/, /lease/, /land/]],
  // A site plan and a set of building plans are different drawings by
  // different people — neither may stand in for the other.
  ['site-plan', [/site or location/, /site plan/, /location plan/]],
  ['building-plan', [/building plan/, /floor plan/, /elevation/, /structural/]],
  ['plan', [/plan\b/, /drawing/, /survey/, /schedule/]],
  ['permit', [/permit/, /approval/, /permission/, /occupancy/]],
  ['certificate', [/certificate/, /letter/]],
];

/** Strip a name down to something comparable. */
function normalise(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Work out which kind a free-text document name refers to.
 * @param {string} name
 * @returns {string} one of DOCUMENT_KINDS
 */
export function kindFromName(name) {
  const n = normalise(name);
  if (!n) return 'other';
  for (const [kind, patterns] of KIND_PATTERNS) {
    if (patterns.some((p) => p.test(n))) return kind;
  }
  return 'other';
}

/**
 * Settle on a kind from a declared one and a name.
 *
 * Both sides of a match run through this, which is the point: a document filed
 * under a seed's broad `vaultKind` of "certificate" but named "Transport, title
 * or lease" must land on the same kind as the requirement of the same name, or
 * the two can never meet. The name wins whenever it says something specific,
 * because it is what the citizen actually reads.
 *
 * @param {string|undefined|null} declared
 * @param {string|undefined|null} name
 * @returns {string} one of DOCUMENT_KINDS
 */
export function resolveKind(declared, name) {
  const d = declared && declared !== 'other' ? declared : null;
  const derived = kindFromName(name);
  if (derived !== 'other' && derived !== 'certificate') return derived;
  if (d) return d;
  return derived;
}

/**
 * The kind a requirement is asking for.
 * @param {import('../data/types').DocumentDef} doc
 */
export function kindForRequirement(doc) {
  if (!doc) return 'other';
  return resolveKind(doc.vaultKind, doc.label);
}

/**
 * @typedef {Object} VaultItem
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} icon
 * @property {string} kind
 * @property {'record'|'card'|'requested'|'filed'} origin  where it came from
 * @property {string|null} vaultDocId   set when it is a row in `vault_documents`
 * @property {number|null} sizeBytes
 * @property {string|null} fileName
 */

/**
 * Assemble everything in the citizen's Vault into one normalised list.
 *
 * @param {{
 *   persona?: any,
 *   cards?: {id: string, title: string, sub?: string, icon?: string}[],
 *   records?: {id: string, title: string, sub?: string, icon?: string}[],
 *   vaultDocs?: any[],
 *   storedDocs?: import('../data/types').VaultDocument[]
 * }} sources
 * @returns {VaultItem[]}
 */
export function buildVaultInventory({ persona, cards = [], records = [], vaultDocs = [], storedDocs = [] } = {}) {
  /** @type {VaultItem[]} */
  const items = [];

  // The e-ID is a document in its own right — plenty of services accept it as
  // photo ID.
  if (persona?.eidStatus === 'issued') {
    items.push({
      id: 'eid', title: 'e-ID', subtitle: 'Digital Identity Card Registry',
      icon: 'fingerprint', kind: 'e-id', origin: 'card',
      vaultDocId: null, sizeBytes: null, fileName: null,
    });
  }

  cards.forEach((c) => items.push({
    id: `card:${c.id}`, title: c.title, subtitle: c.sub || 'Held by government',
    icon: c.icon || 'id-card', kind: kindFromName(c.title), origin: 'card',
    vaultDocId: null, sizeBytes: null, fileName: null,
  }));

  records.forEach((r) => items.push({
    id: `record:${r.id}`, title: r.title, subtitle: r.sub || 'Issued by government',
    icon: r.icon || 'file-text', kind: kindFromName(r.title), origin: 'record',
    vaultDocId: null, sizeBytes: null, fileName: null,
  }));

  // Documents the citizen requested through the Vault screen.
  vaultDocs.forEach((d) => items.push({
    id: `requested:${d.id}`,
    title: d.label || d.typeLabel || 'Document',
    subtitle: d.typeLabel || 'Requested from the issuing agency',
    icon: d.icon || 'file',
    kind: resolveKind(d.typeId, d.label || d.typeLabel),
    origin: 'requested',
    vaultDocId: null, sizeBytes: null, fileName: d.fileName || null,
  }));

  // Documents a service filed against the account — uploads and collected
  // certificates. These carry a real file, so they are the strongest match.
  storedDocs.forEach((d) => items.push({
    id: `filed:${d.id}`,
    title: d.title,
    subtitle: d.subtitle || (d.issuedBy ? `Issued by ${d.issuedBy}` : 'In your Vault'),
    icon: d.icon || 'file',
    kind: resolveKind(d.kind, d.title),
    origin: 'filed',
    vaultDocId: d.id,
    sizeBytes: d.sizeBytes ?? null,
    fileName: d.fileName || null,
  }));

  return items;
}

// A document that carries an actual file is preferred over a derived record,
// because it can be previewed and re-attached.
const ORIGIN_RANK = { filed: 0, requested: 1, record: 2, card: 3 };

/**
 * The best Vault item that satisfies a requirement, or null.
 *
 * Matching is by kind first — that is what makes "National ID" in CARDS & IDS
 * answer a requirement labelled "National ID or current passport". Failing
 * that it falls back to the names reading as each other, so an unusual label
 * still finds an obviously-matching document.
 *
 * @param {VaultItem[]} inventory
 * @param {import('../data/types').DocumentDef} doc
 * @returns {VaultItem|null}
 */
export function matchRequirement(inventory, doc) {
  if (!doc || !inventory?.length) return null;
  const wanted = kindForRequirement(doc);
  const label = normalise(doc.label);

  const byRank = (a, b) => (ORIGIN_RANK[a.origin] ?? 9) - (ORIGIN_RANK[b.origin] ?? 9);

  if (wanted !== 'other') {
    const sameKind = inventory.filter((i) => i.kind === wanted).sort(byRank);
    if (sameKind.length) return sameKind[0];
  }

  // Name overlap, either direction: "National ID" matches a requirement for
  // "National ID or current passport", and vice versa.
  const byName = inventory
    .filter((i) => {
      const t = normalise(i.title);
      return !!t && !!label && (label.includes(t) || t.includes(label));
    })
    .sort(byRank);
  return byName[0] || null;
}

/**
 * Everything in the Vault that could plausibly answer a requirement — used to
 * tell the citizen what they do have when nothing matches.
 * @param {VaultItem[]} inventory
 * @param {import('../data/types').DocumentDef} doc
 */
export function suggestionsFor(inventory, doc) {
  const wanted = kindForRequirement(doc);
  return (inventory || []).filter((i) => i.kind !== wanted).slice(0, 3);
}
