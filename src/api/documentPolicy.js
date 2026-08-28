// The rule that a document attached to a field must be of a type that field
// accepts, applied to a whole application at once.
//
// The picker filters by the same contract, so a citizen using the UI can never
// produce a mismatch. This exists because that is not a guarantee: a resumed
// draft, a changed answer that swaps which documents are required, or anything
// reaching the endpoints directly must all be refused here rather than saved.

import { typeAccepted, documentType, acceptedLabel } from '../data/documentTypes';
import { getDocument } from './vault';
import { ApiError } from './validate';

/**
 * Check every Vault-connected attachment against the slot it is going into.
 *
 * Uploads are not checked against a type — the citizen chose a file for that
 * slot and it is filed as that slot's type. Only documents that came *from* the
 * Vault carry a type of their own that could disagree.
 *
 * @param {{
 *   userId: string,
 *   documents: import('../data/types').DocumentDef[],
 *   attached: Record<string, {status?: string, vaultDocId?: string|null}>
 * }} args
 * @returns {Promise<void>} rejects with an ApiError listing every mismatch
 */
export async function assertAttachmentsTyped({ userId, documents, attached }) {
  const connected = (documents || [])
    .map((field) => ({ field, a: attached?.[field.id] }))
    .filter(({ a }) => a?.status === 'fromVault' && a.vaultDocId);

  if (!connected.length) return;

  const checked = await Promise.all(connected.map(async ({ field, a }) => {
    const doc = await getDocument({ userId, documentId: a.vaultDocId }).catch(() => null);
    if (!doc) {
      return { field, problem: `${field.label} is no longer in your Vault.` };
    }
    if (!typeAccepted(field.accepts, doc.type)) {
      return {
        field,
        problem: `${field.label}: a ${documentType(doc.type).label} was attached, but this slot only takes ${acceptedLabel(field.accepts)}.`,
      };
    }
    return null;
  }));

  const problems = checked.filter(Boolean);
  if (problems.length) {
    throw new ApiError(
      problems.map((p) => p.problem).join(' '),
      'documentType',
      { fields: problems.map((p) => p.field.id) }
    );
  }
}
