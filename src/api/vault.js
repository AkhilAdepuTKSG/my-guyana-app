// Vault endpoints.
//
// Every row in `vault_documents` carries the id of the citizen it belongs to,
// and every read here is filtered by that id. There is no endpoint that returns
// another citizen's documents — a certificate filed for one person is invisible
// to everyone else, including on a shared device.

import { getAllBy, get, put, del } from '../data/db';
import { newId, now, today } from '../data/ids';
import { ApiError } from './validate';

const STORE = 'vault_documents';

/** Document kinds the Vault recognises, with the icon each is shown with. */
export const VAULT_KINDS = {
  'national-id': { label: 'National ID', icon: 'id-card' },
  passport: { label: 'Passport', icon: 'book-user' },
  licence: { label: "Driver's licence", icon: 'car' },
  'birth-certificate': { label: 'Birth certificate', icon: 'baby' },
  'death-certificate': { label: 'Death certificate', icon: 'file-text' },
  'marriage-certificate': { label: 'Marriage certificate', icon: 'heart-handshake' },
  certificate: { label: 'Certificate', icon: 'file-badge' },
  permit: { label: 'Permit or approval', icon: 'stamp' },
  'proof-of-address': { label: 'Proof of address', icon: 'map-pin' },
  'proof-of-income': { label: 'Proof of income', icon: 'receipt' },
  plan: { label: 'Plan or drawing', icon: 'ruler' },
  other: { label: 'Other document', icon: 'file' },
};

/**
 * Everything in one citizen's Vault, newest first.
 * @param {string} userId
 * @returns {Promise<import('../data/types').VaultDocument[]>}
 */
export async function listDocuments(userId) {
  if (!userId) return [];
  const rows = await getAllBy(STORE, 'byUser', userId);
  return rows.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
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
  return row;
}

/**
 * File a document in a citizen's Vault.
 * @param {{
 *   userId: string,
 *   kind: string,
 *   title: string,
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
  userId, kind, title, subtitle, source = 'citizen', issuedBy, refNo, fileName, mimeType,
  blob = null, content = null,
}) {
  if (!userId) throw new ApiError('You need to be signed in to use your Vault.', 'unauthenticated');
  const known = VAULT_KINDS[kind] ? kind : 'other';

  /** @type {import('../data/types').VaultDocument} */
  const row = {
    id: newId('vdoc'),
    userId,
    kind: known,
    title: title || VAULT_KINDS[known].label,
    subtitle: subtitle || VAULT_KINDS[known].label,
    icon: VAULT_KINDS[known].icon,
    source,
    issuedBy: issuedBy ?? null,
    refNo: refNo ?? null,
    fileName: fileName ?? null,
    mimeType: mimeType ?? blob?.type ?? null,
    // The file itself. IndexedDB stores Blobs, so the Vault holds the real
    // document rather than just a note that one exists — which is what makes
    // "attach it from my Vault" work without asking for the file again.
    blob: blob ?? null,
    sizeBytes: blob?.size ?? null,
    content,
    addedAt: now(),
  };
  await put(STORE, row);
  return row;
}

/**
 * File a document the citizen uploaded while filling in an application.
 *
 * Every upload lands in the Vault first and is then attached to the application
 * from there, so nothing a citizen hands to government is asked for twice — the
 * next service that needs the same document offers it straight from the Vault.
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
  return addDocument({
    userId,
    kind: doc.vaultKind || 'other',
    title: doc.label,
    subtitle: serviceName ? `Uploaded for ${serviceName}` : (doc.issuer || 'Uploaded'),
    source: 'citizen',
    issuedBy: doc.issuer || null,
    fileName: file.name,
    mimeType: file.type || null,
    blob: file,
  });
}

/**
 * The one Vault document that satisfies a given requirement, or null.
 *
 * "From Vault" attaches straight away rather than opening a chooser, so this
 * has to decide on the citizen's behalf. It matches the way the requirement is
 * named — the document's own title against the requirement's label — and falls
 * back to the kind the requirement is filed under. Newest wins a tie, because a
 * re-uploaded document is the one they meant.
 *
 * Returns null when nothing matches, which is the signal to ask for an upload
 * instead of silently attaching the wrong paper.
 *
 * @param {import('../data/types').VaultDocument[]} documents
 * @param {import('../data/types').DocumentDef} doc
 * @returns {import('../data/types').VaultDocument|null}
 */
export function findForRequirement(documents, doc) {
  if (!doc) return null;
  const rows = [...(documents || [])].sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  const wanted = normaliseName(doc.label);

  const byName = rows.find((d) => normaliseName(d.title) === wanted);
  if (byName) return byName;

  if (doc.vaultKind) {
    const byKind = rows.find((d) => d.kind === doc.vaultKind);
    if (byKind) return byKind;
  }
  return null;
}

/** Loose name comparison, so "National ID" and "national id" are the same thing. */
function normaliseName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
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
  const already = existing.find((d) => d.refNo && d.refNo === args.refNo && d.kind === args.kind);
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

/** Display date for a Vault row, matching how the existing screens format. */
export function vaultDateLabel(iso) {
  const value = (iso || today()).slice(0, 10);
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
