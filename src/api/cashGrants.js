// Cash Grants endpoints (Ministry of Finance).
//
// Drafts, submission, document handling, tracking and the award calculation.
// Everything reads and writes the `cash_grant_applications` table; the timeline
// and the (single-agency) routing use the shared application machinery.

import { get, getAllBy, put, del } from '../data/db';
import { newId, now } from '../data/ids';
import { getService, listFees, listRoutes, getAgencyMap } from './catalog';
import {
  addEvent, listEvents, listReviews, createReviews, buildDocumentList,
  newDraft, assignReference, syncReviewProgress, isLive,
} from './applicationCommon';
import { validateFields, validateDocuments, visibleFields, ApiError } from './validate';

const STORE = 'cash_grant_applications';
export const CASH_GRANT_SERVICE_ID = 'svc_cash_grant';

/**
 * What each grant pays. The Ministry of Finance sets these rates; the award is
 * worked out at approval, not promised at application.
 */
export const GRANT_AWARDS = {
  'because-we-care': {
    label: 'Because We Care school grant',
    perChildGyd: 55000,
    describe: (n) => `$55,000 for each of ${n} ${n === 1 ? 'child' : 'children'} enrolled in school.`,
  },
  'public-assistance': {
    label: 'Public assistance',
    monthlyGyd: 22000,
    describe: () => '$22,000 a month while you remain eligible, reviewed annually.',
  },
  'one-off-relief': {
    label: 'One-off relief grant',
    flatGyd: 100000,
    describe: () => 'A single payment of $100,000.',
  },
};

/**
 * Work out what an approved application pays.
 * @param {Record<string, string>} fields
 * @returns {{amountGyd: number, basis: string}}
 */
export function calculateAward(fields) {
  const type = fields?.grantType;
  const award = GRANT_AWARDS[type];
  if (!award) return { amountGyd: 0, basis: 'No award rate is set for this grant type.' };

  if (type === 'because-we-care') {
    const children = Math.max(1, Number(fields.schoolChildren) || 1);
    return { amountGyd: award.perChildGyd * children, basis: award.describe(children) };
  }
  if (type === 'public-assistance') {
    return { amountGyd: award.monthlyGyd, basis: award.describe() };
  }
  return { amountGyd: award.flatGyd, basis: award.describe() };
}

/**
 * Every cash grant application belonging to one citizen, newest first.
 * @param {string} userId
 * @returns {Promise<import('../data/types').CashGrantApplication[]>}
 */
export async function listApplications(userId) {
  if (!userId) return [];
  const rows = await getAllBy(STORE, 'byUser', userId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * @param {string} id
 * @returns {Promise<import('../data/types').CashGrantApplication|null>}
 */
export function getApplication(id) {
  return get(STORE, id);
}

/**
 * The citizen's open draft, if they have one. Only one draft is kept — coming
 * back to the service resumes where they left off.
 * @param {string} userId
 */
export async function getDraft(userId) {
  const rows = await listApplications(userId);
  return rows.find((a) => a.status === 'draft') || null;
}

/**
 * Create or update the citizen's draft. Nothing is validated here — a draft is
 * allowed to be incomplete; that is the point of saving one.
 * @param {{
 *   userId: string,
 *   applicationId?: string,
 *   fields?: Record<string, string>,
 *   documents?: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>
 * }} args
 * @returns {Promise<import('../data/types').CashGrantApplication>}
 */
export async function saveDraft({ userId, applicationId, fields = {}, documents = {} }) {
  if (!userId) throw new ApiError('You need to be signed in to save an application.', 'unauthenticated');

  const service = await getService(CASH_GRANT_SERVICE_ID);
  if (!service) throw new ApiError('The cash grant service is not available.', 'notFound');

  const existing = applicationId ? await getApplication(applicationId) : await getDraft(userId);
  if (existing && existing.userId !== userId) {
    throw new ApiError('That application belongs to someone else.', 'forbidden');
  }
  if (existing && existing.status !== 'draft') {
    throw new ApiError('That application has already been submitted.', 'conflict');
  }

  const base = existing || newDraft({
    userId,
    service,
    refPrefix: 'CG',
    extra: {
      grantType: '',
      householdSize: null,
      bankAccountLast4: null,
      awardedAmountGyd: null,
      paidAt: null,
    },
  });

  const mergedFields = { ...base.fields, ...fields };
  const merged = {
    ...base,
    fields: mergedFields,
    documents: buildDocumentList(requiredDocumentsFor(service, mergedFields), documents),
    grantType: fields.grantType ?? base.grantType,
    householdSize: fields.householdSize ? Number(fields.householdSize) : base.householdSize,
    updatedAt: now(),
  };

  await put(STORE, merged);
  if (!existing) {
    await addEvent({ applicationId: merged.id, type: 'created', label: 'Draft started', note: 'Saved to your account — you can come back to it any time.' });
  }
  return merged;
}

/** Discard a draft. Submitted applications cannot be deleted. */
export async function discardDraft({ userId, applicationId }) {
  const existing = await getApplication(applicationId);
  if (!existing) return { deleted: false };
  if (existing.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (existing.status !== 'draft') throw new ApiError('A submitted application cannot be deleted.', 'conflict');
  await del(STORE, applicationId);
  return { deleted: true };
}

/**
 * Submit the application. Validates every visible field and every required
 * document, assigns the reference number, routes it to the Ministry of Finance
 * and writes the opening timeline entries.
 *
 * @param {{
 *   userId: string,
 *   applicationId?: string,
 *   fields: Record<string, string>,
 *   documents: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>
 * }} args
 * @returns {Promise<import('../data/types').CashGrantApplication>}
 */
export async function submitApplication({ userId, applicationId, fields, documents }) {
  if (!userId) throw new ApiError('You need to be signed in to apply.', 'unauthenticated');

  const service = await getService(CASH_GRANT_SERVICE_ID);
  if (!service) throw new ApiError('The cash grant service is not available.', 'notFound');

  const { ok, errors } = validateFields(service.fields, fields);
  if (!ok) throw new ApiError('Some answers still need attention.', 'validation', { errors });

  // Only enforce documents the citizen was actually asked for. The school
  // letter, for instance, is only required for the Because We Care grant.
  const requiredDocs = requiredDocumentsFor(service, fields);
  const docCheck = validateDocuments(requiredDocs, documents);
  if (!docCheck.ok) {
    throw new ApiError(
      `Still missing: ${docCheck.missing.join(', ')}.`,
      'validation',
      { missingDocuments: docCheck.missing }
    );
  }

  const draft = applicationId ? await getApplication(applicationId) : await getDraft(userId);
  if (draft && draft.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (draft && draft.status !== 'draft') throw new ApiError('That application has already been submitted.', 'conflict');

  // One grant per person per cycle. The eligibility gate says so before the
  // form opens, but the rule is enforced here too — a citizen who resumed an
  // old draft, or opened the flow twice, must not end up with two.
  const duplicate = (await listApplications(userId)).find((a) => a.id !== draft?.id && isLive(a));
  if (duplicate) {
    throw new ApiError(
      `You already have a cash grant application on file (${duplicate.ref}). One grant per person per cycle — track that one instead.`,
      'duplicate',
      { existingId: duplicate.id, existingRef: duplicate.ref, group: 'cashGrants' }
    );
  }

  const [fees, routes, agencies] = await Promise.all([
    listFees(service.id),
    listRoutes(service.id),
    getAgencyMap(),
  ]);
  const feeTotal = fees.filter((f) => f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0);

  const timestamp = now();
  const base = draft || newDraft({ userId, service, refPrefix: 'CG', extra: {} });
  const account = String(fields.bankAccount || '');

  /** @type {import('../data/types').CashGrantApplication} */
  const submitted = {
    ...base,
    ref: assignReference('MOF-CG'),
    userId,
    serviceId: service.id,
    group: 'cashGrants',
    agencyId: service.agencyId,
    title: service.name,
    status: 'submitted',
    fields: { ...fields },
    documents: buildDocumentList(requiredDocs, documents),
    feeTotalGyd: feeTotal,
    feeStatus: feeTotal === 0 ? 'waived' : 'unpaid',
    submittedAt: timestamp,
    createdAt: base.createdAt || timestamp,
    updatedAt: timestamp,
    decisionAt: null,
    decisionNote: null,
    grantType: fields.grantType || '',
    householdSize: fields.householdSize ? Number(fields.householdSize) : null,
    // Never store a full account number — the last four are enough to confirm
    // where a payment went.
    bankAccountLast4: account ? account.slice(-4) : null,
    awardedAmountGyd: null,
    paidAt: null,
  };

  await put(STORE, submitted);
  await createReviews({ applicationId: submitted.id, routes });
  await addEvent({
    applicationId: submitted.id,
    type: 'submitted',
    label: 'Application submitted',
    note: `Reference ${submitted.ref}. Nothing to pay — cash grant applications are free.`,
  });
  await addEvent({
    applicationId: submitted.id,
    type: 'routed',
    label: `With the ${agencies[service.agencyId]?.shortName || 'Ministry of Finance'}`,
    note: routes[0]?.purpose,
    agencyId: service.agencyId,
  });

  return submitted;
}

/**
 * The documents a given set of answers actually requires. Conditional documents
 * (the school enrolment letter) become required only for the grant that needs
 * them.
 * @param {import('../data/types').Service} service
 * @param {Record<string, string>} fields
 * @returns {import('../data/types').DocumentDef[]}
 */
export function requiredDocumentsFor(service, fields) {
  return (service.documents || []).map((doc) => {
    if (doc.id === 'schoolLetter') {
      return { ...doc, required: fields?.grantType === 'because-we-care' };
    }
    return doc;
  });
}

/**
 * Attach or replace one document on an application that is already in.
 *
 * `vaultDocId` is always set: an upload is filed in the citizen's Vault first
 * and attached from there, so the application points at a document the citizen
 * owns rather than at a file that exists nowhere else.
 * @param {{userId: string, applicationId: string, docId: string, fileName: string, size?: number, vaultDocId?: string, fromVault?: boolean}} args
 */
export async function attachDocument({ userId, applicationId, docId, fileName, size, vaultDocId, fromVault }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  const documents = application.documents.map((d) => (d.docId === docId
    ? { ...d, status: fromVault ? 'fromVault' : 'attached', fileName, size: size ?? null, vaultDocId: vaultDocId ?? null, attachedAt: now() }
    : d));
  const updated = { ...application, documents, updatedAt: now() };
  await put(STORE, updated);
  await addEvent({
    applicationId,
    type: 'documentAdded',
    label: `${documents.find((d) => d.docId === docId)?.label || 'Document'} added`,
    note: fromVault ? 'Taken from your Vault.' : `${fileName} — also saved to your Vault.`,
  });
  return updated;
}

/**
 * Record the Ministry's decision. Approving works out the award and schedules
 * the payment.
 * @param {{applicationId: string, decision: 'approved'|'rejected', note?: string}} args
 */
export async function recordDecision({ applicationId, decision, note }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');

  const timestamp = now();
  if (decision === 'rejected') {
    const updated = { ...application, status: 'rejected', decisionAt: timestamp, decisionNote: note ?? null, updatedAt: timestamp };
    await put(STORE, updated);
    await addEvent({ applicationId, type: 'rejected', label: 'Not approved', note });
    return updated;
  }

  const award = calculateAward(application.fields);
  const updated = {
    ...application,
    status: 'approved',
    awardedAmountGyd: award.amountGyd,
    decisionAt: timestamp,
    decisionNote: note || award.basis,
    updatedAt: timestamp,
  };
  await put(STORE, updated);
  await addEvent({ applicationId, type: 'approved', label: 'Grant approved', note: award.basis });
  return updated;
}

/**
 * Everything the tracker needs for one cash grant application. Reviews are
 * brought up to date against the Ministry's published timeframe first, and an
 * application that clears review has its award worked out at the same time.
 * @param {{userId: string, applicationId: string}} args
 */
export async function getApplicationDetail({ userId, applicationId }) {
  const agencies = await getAgencyMap();
  const names = Object.fromEntries(Object.values(agencies).map((a) => [a.id, a.shortName]));
  await syncReviewProgress({ applicationId, group: 'cashGrants', agencyNames: names });

  let application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  // Clearing the Ministry's review is what produces the award.
  if (application.status === 'approved' && application.awardedAmountGyd === null) {
    application = await recordDecision({ applicationId, decision: 'approved' });
  }

  const [service, reviews, events, fees] = await Promise.all([
    getService(application.serviceId),
    listReviews(applicationId),
    listEvents(applicationId),
    listFees(application.serviceId),
  ]);

  return {
    application,
    service,
    fees,
    reviews: reviews.map((r) => ({ ...r, agency: agencies[r.agencyId] || null })),
    events,
    award: application.status === 'approved' ? calculateAward(application.fields) : null,
  };
}

/**
 * The fields the citizen is being asked for right now, given their answers so
 * far — used by the review step so hidden questions never appear on it.
 */
export function askedFields(service, fields) {
  return visibleFields(service?.fields || [], fields);
}

/** A stable client-side id for an unsaved attachment. */
export function newAttachmentId() {
  return newId('att');
}
