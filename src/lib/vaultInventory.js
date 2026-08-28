// One answer to "what is in this citizen's Vault?", and one answer to "may this
// document go in that slot?".
//
// The Vault is fed from several places. Each source records different things,
// and only one of them ever stored a type — so before this, a document could
// appear in the wrong Vault section and could be attached to a field that
// should never have accepted it.
//
// Everything is now normalised to the shared contract in
// src/data/documentTypes.js. A document has exactly one type; that type decides
// the section it appears in and the fields that will take it. `candidatesFor`
// is the only way a form finds a document, and it filters by type — so the UI
// cannot offer something the endpoints would reject.
//
// The sources:
//   • the e-ID itself;
//   • CARDS & IDS derived from the government record (licence, National ID, NIS);
//   • DOCUMENTS & RECORDS derived from the record and connected agencies;
//   • documents the citizen requested through the Vault (context `vaultDocs`);
//   • documents filed by a service (`vault_documents`) — uploads and collected
//     certificates.

import {
  documentType, resolveType, sectionForType, typeAccepted, acceptedLabel,
} from '../data/documentTypes';

/**
 * @typedef {Object} VaultItem
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} icon
 * @property {string} type              a DOCUMENT_TYPES id
 * @property {string} section           'cards' | 'records'
 * @property {'record'|'card'|'requested'|'filed'} origin
 * @property {string|null} vaultDocId   set when it is a row in `vault_documents`
 * @property {number|null} sizeBytes
 * @property {string|null} fileName
 * @property {string|null} addedAt
 */

/** Build one normalised item, with its type resolved once. */
function item({ id, title, subtitle, storedType, origin, vaultDocId = null, sizeBytes = null, fileName = null, addedAt = null }) {
  const type = resolveType(storedType, title);
  const def = documentType(type);
  return {
    id,
    title: title || def.label,
    subtitle: subtitle || def.label,
    icon: def.icon,
    type,
    section: sectionForType(type),
    origin,
    vaultDocId,
    sizeBytes,
    fileName,
    addedAt,
  };
}

/**
 * Assemble everything in the citizen's Vault into one typed list.
 *
 * @param {{
 *   persona?: any,
 *   cards?: {id: string, title: string, sub?: string}[],
 *   records?: {id: string, title: string, sub?: string}[],
 *   vaultDocs?: any[],
 *   storedDocs?: import('../data/types').VaultDocument[]
 * }} sources
 * @returns {VaultItem[]}
 */
export function buildVaultInventory({ persona, cards = [], records = [], vaultDocs = [], storedDocs = [] } = {}) {
  /** @type {VaultItem[]} */
  const items = [];

  // The e-ID is a document in its own right — plenty of services take it as
  // photo ID.
  if (persona?.eidStatus === 'issued') {
    items.push(item({
      id: 'eid', title: 'e-ID', subtitle: 'Digital Identity Card Registry',
      storedType: 'EID', origin: 'card',
    }));
  }

  // Derived from the government record. These carry no stored type, so the
  // type comes from the name — which is why the classifier lives in the shared
  // contract rather than here.
  cards.forEach((c) => items.push(item({
    id: `card:${c.id}`, title: c.title, subtitle: c.sub || 'Held by government',
    storedType: null, origin: 'card',
  })));

  records.forEach((r) => items.push(item({
    id: `record:${r.id}`, title: r.title, subtitle: r.sub || 'Issued by government',
    storedType: null, origin: 'record',
  })));

  // Requested through the Vault screen. `typeId` is the old loose vocabulary,
  // so the label is the more reliable signal; resolveType prefers a recognised
  // stored type and otherwise reads the name.
  vaultDocs.forEach((d) => items.push(item({
    id: `requested:${d.id}`,
    title: d.label || d.typeLabel,
    subtitle: d.typeLabel ? `Requested · ${d.typeLabel}` : 'Requested from the issuing agency',
    storedType: d.type,
    origin: 'requested',
    fileName: d.fileName || null,
    addedAt: d.addedOn || null,
  })));

  // Filed by a service. These already carry a type and a real file.
  storedDocs.forEach((d) => items.push(item({
    id: `filed:${d.id}`,
    title: d.title,
    subtitle: d.subtitle || (d.issuedBy ? `Issued by ${d.issuedBy}` : 'In your Vault'),
    storedType: d.type,
    origin: 'filed',
    vaultDocId: d.id,
    sizeBytes: d.sizeBytes ?? null,
    fileName: d.fileName || null,
    addedAt: d.addedAt || null,
  })));

  return items;
}

/** Group the inventory the way the Vault screen shows it. */
export function groupBySection(inventory) {
  return {
    cards: (inventory || []).filter((i) => i.section === 'cards'),
    records: (inventory || []).filter((i) => i.section === 'records'),
  };
}

// A document that carries an actual file is preferred, because it can be
// previewed and re-attached; then the citizen's own requests; then what the
// government record implies.
const ORIGIN_RANK = { filed: 0, requested: 1, record: 2, card: 3 };

/**
 * Every Vault document a field will accept, best first.
 *
 * This is the ONLY way a form finds a document, and it filters on type alone —
 * a National ID slot returns National IDs and nothing else, whatever anything
 * happens to be named.
 *
 * @param {VaultItem[]} inventory
 * @param {import('../data/types').DocumentDef} field
 * @returns {VaultItem[]}
 */
export function candidatesFor(inventory, field) {
  if (!field || !inventory?.length) return [];
  return inventory
    .filter((i) => typeAccepted(field.accepts, i.type))
    .sort((a, b) => (ORIGIN_RANK[a.origin] ?? 9) - (ORIGIN_RANK[b.origin] ?? 9)
      || String(b.addedAt || '').localeCompare(String(a.addedAt || '')));
}

/**
 * The single best document for a field, or null. Where there is exactly one
 * candidate this is what gets attached without asking.
 * @param {VaultItem[]} inventory
 * @param {import('../data/types').DocumentDef} field
 */
export function matchRequirement(inventory, field) {
  return candidatesFor(inventory, field)[0] || null;
}

export { acceptedLabel, documentType, typeAccepted };
