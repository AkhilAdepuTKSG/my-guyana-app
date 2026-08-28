// Vault endpoints.
//
// Every row in `vault_documents` carries the id of the citizen it belongs to,
// and every read here is filtered by that id. There is no endpoint that returns
// another citizen's documents — a certificate filed for one person is invisible
// to everyone else, including on a shared device.
//
// Every row also carries a `type` from the shared contract in
// src/data/documentTypes.js. The type decides which Vault section a document
// appears in and which form fields will accept it, so it is resolved on write
// and re-resolved on read for rows written before types existed.

import { getAllBy, get, put, del } from '../data/db';
import { newId, now, today } from '../data/ids';
import {
  DOCUMENT_TYPES, documentType, resolveType, sectionForType, typeAccepted, acceptedLabel, isUniqueType,
} from '../data/documentTypes';
import { ApiError } from './validate';

const STORE = 'vault_documents';

/**
 * Bring a stored row up to the current contract: give it a resolved type, and
 * derive its presentation from that type rather than from whatever was saved
 * alongside it. Rows written before migration 6 come back typed.
 * @param {any} row
 * @returns {import('../data/types').VaultDocument}
 */
function hydrate(row) {
  if (!row) return row;
  const type = resolveType(row.type, row.title);
  const def = documentType(type);
  return {
    ...row,
    type,
    // Icon and section follow the type, so a document cannot be filed under one
    // type and presented as another.
    icon: def.icon,
    section: sectionForType(type),
    typeLabel: def.label,
    needsTypeBackfill: undefined,
  };
}

/**
 * Everything in one citizen's Vault, newest first, every row typed.
 * @param {string} userId
 * @returns {Promise<import('../data/types').VaultDocument[]>}
 */
export async function listDocuments(userId) {
  if (!userId) return [];
  const rows = await getAllBy(STORE, 'byUser', userId);
  return rows.map(hydrate).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/**
 * A citizen's documents of one type — the query the typed pickers run.
 * @param {string} userId
 * @param {string} typeId
 */
export async function listDocumentsOfType(userId, typeId) {
  const rows = await listDocuments(userId);
  return rows.filter((d) => d.type === typeId);
}

/**
 * The documents in a citizen's Vault that a given field will accept.
 *
 * The picker and the endpoints both come through here, which is what makes the
 * UI incapable of offering something the API would refuse.
 *
 * @param {string} userId
 * @param {{accepts?: string[]}} field
 */
export async function listAcceptableDocuments(userId, field) {
  const rows = await listDocuments(userId);
  return rows.filter((d) => typeAccepted(field?.accepts, d.type));
}

/**
 * One document, but only if it belongs to the citizen asking for it.
 * @param {{userId: string, documentId: string}} args
 * @returns {Promise<import('../data/types').VaultDocument>}
 */
export async function getDocument({ userId, documentId }) {
  const row = await get(STORE, documentId);
  if (!row) throw new ApiError('That document is not in your Vault.', 'notFound');
  if (row.userId !== userId) throw new ApiError('That document is not in your Vault.', 'notFound');
  return hydrate(row);
}

/**
 * File a document in a citizen's Vault.
 *
 * If no type is given it is resolved from the title: an untyped row could not
 * be placed in a section or offered to a field, so there is no such thing.
 *
 * @param {{
 *   userId: string,
 *   type?: string,
 *   title?: string,
 *   subtitle?: string,
 *   source?: 'citizen'|'government',
 *   issuedBy?: string,
 *   refNo?: string,
 *   fileName?: string,
 *   mimeType?: string,
 *   blob?: Blob|null,
 *   content?: {generator: string, args: Record<string, unknown>}|null
 * }} args
 * @returns {Promise<import('../data/types').VaultDocument>}
 */
export async function addDocument({
  userId, type, title, subtitle, source = 'citizen', issuedBy, refNo, fileName, mimeType,
  blob = null, content = null,
}) {
  if (!userId) throw new ApiError('You need to be signed in to use your Vault.', 'unauthenticated');

  const resolved = resolveType(type, title);
  const def = documentType(resolved);

  // A citizen holds one National ID, one passport, one birth certificate. A
  // newer copy of a unique document is the same document, so it replaces the
  // row already on file instead of creating a second one. Anything genuinely
  // repeatable — a pay slip, a site plan, a lease — is appended as usual.
  const existing = isUniqueType(resolved)
    ? (await listDocuments(userId)).find((d) => d.type === resolved)
    : null;

  /** @type {import('../data/types').VaultDocument} */
  const row = {
    id: existing?.id || newId('vdoc'),
    userId,
    type: resolved,
    title: title || def.label,
    subtitle: subtitle || def.label,
    icon: def.icon,
    source,
    issuedBy: issuedBy ?? def.issuer ?? null,
    refNo: refNo ?? null,
    fileName: fileName ?? null,
    mimeType: mimeType ?? blob?.type ?? null,
    // The file itself. IndexedDB stores Blobs, so the Vault holds the real
    // document rather than just a note that one exists.
    blob: blob ?? null,
    sizeBytes: blob?.size ?? null,
    content,
    // Replacing a unique document keeps the date it first entered the Vault and
    // records when the copy was refreshed.
    addedAt: existing?.addedAt || now(),
    updatedAt: existing ? now() : null,
  };
  await put(STORE, row);
  return hydrate(row);
}

/**
 * File a document the citizen uploaded while filling in an application.
 *
 * The requirement decides the type: a file chosen for the National ID slot is
 * filed as a National ID, so it lands in Cards & IDs and is offered back only
 * where a National ID is accepted.
 *
 * @param {{
 *   userId: string,
 *   file: File,
 *   doc: import('../data/types').DocumentDef,
 *   serviceName?: string
 * }} args
 * @returns {Promise<import('../data/types').VaultDocument>}
 */
export async function fileUploadedDocument({ userId, file, doc, serviceName }) {
  // A slot that accepts exactly one type says what the upload is. A slot that
  // accepts several cannot, so fall back to reading the requirement's label.
  const type = doc?.accepts?.length === 1 ? doc.accepts[0] : resolveType(null, doc?.label);
  return addDocument({
    userId,
    type,
    title: documentType(type).label,
    subtitle: serviceName ? `Uploaded for ${serviceName}` : (doc?.issuer || 'Uploaded'),
    source: 'citizen',
    issuedBy: doc?.issuer || null,
    fileName: file.name,
    mimeType: file.type || null,
    blob: file,
  });
}

/**
 * File a government-issued document, but only once per reference number. Used
 * when an approved certificate or permit is filed automatically — reopening the
 * same certificate must not stack up duplicates.
 * @param {Parameters<typeof addDocument>[0] & {refNo: string}} args
 * @returns {Promise<{document: import('../data/types').VaultDocument, created: boolean}>}
 */
export async function fileIssuedDocument(args) {
  const existing = await listDocuments(args.userId);
  const already = existing.find((d) => d.refNo && d.refNo === args.refNo && d.type === args.type);
  if (already) return { document: already, created: false };
  const document = await addDocument({ ...args, source: 'government' });
  return { document, created: true };
}

/**
 * Remove a document from a citizen's own Vault. Government-issued documents can
 * be removed too — the citizen can always collect the certificate again.
 * @param {{userId: string, documentId: string}} args
 */
export async function removeDocument({ userId, documentId }) {
  await getDocument({ userId, documentId }); // throws unless it is theirs
  await del(STORE, documentId);
  return { deleted: true };
}

/**
 * Assert that a Vault document may be attached to a field — the check every
 * endpoint runs before anything is saved.
 *
 * @param {{userId: string, documentId: string, field: import('../data/types').DocumentDef}} args
 * @returns {Promise<import('../data/types').VaultDocument>} the document, if it is allowed
 */
export async function assertAttachable({ userId, documentId, field }) {
  const doc = await getDocument({ userId, documentId });
  if (!typeAccepted(field?.accepts, doc.type)) {
    throw new ApiError(
      `${field?.label || 'This slot'}: a ${documentType(doc.type).label} cannot go here — it only takes ${acceptedLabel(field?.accepts)}.`,
      'documentType',
      { documentType: doc.type, accepts: field?.accepts ?? [], field: field?.id }
    );
  }
  return doc;
}

/** Display date for a Vault row, matching how the existing screens format. */
export function vaultDateLabel(iso) {
  const value = (iso || today()).slice(0, 10);
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export { DOCUMENT_TYPES, documentType, sectionForType, typeAccepted, acceptedLabel };
