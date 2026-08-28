// GRA endpoints (Guyana Revenue Authority) — TIN, driver's licence, business
// tax registration and property tax returns. Drafts, submission, document
// handling, fees and tracking, mirroring the Single Window module: the group
// carries several services, so every read and write is keyed by user AND
// service, and everything lives in the `gra_applications` table.

import { get, getAllBy, put, del } from '../data/db';
import { newId, now } from '../data/ids';
import { getService, listFees, listRoutes, getAgencyMap } from './catalog';
import {
  addEvent, listEvents, listReviews, createReviews, buildDocumentList,
  newDraft, assignReference, syncReviewProgress, isLive,
} from './applicationCommon';
import { validateFields, validateDocuments, visibleFields, ApiError } from './validate';
import { assertAttachable } from './vault';
import { assertAttachmentsTyped } from './documentPolicy';

const STORE = 'gra_applications';

/** Citizen-facing reference prefixes, per service. */
const REF_PREFIX = {
  svc_gra_tin: 'GRA-TIN',
  svc_gra_drivers_licence: 'GRA-DL',
  svc_gra_business: 'GRA-BTX',
  svc_gra_property_tax: 'GRA-PTX',
};

/**
 * Property tax as the Act charges it: the first G$40M is free, the next G$20M
 * is taxed at 0.5%, and everything above G$60M at 0.75%.
 * @param {number} netValueGyd
 */
export function calculatePropertyTax(netValueGyd) {
  const value = Number(netValueGyd) || 0;
  const band1 = Math.max(0, Math.min(value, 60_000_000) - 40_000_000) * 0.005;
  const band2 = Math.max(0, value - 60_000_000) * 0.0075;
  return Math.round(band1 + band2);
}

/**
 * Every GRA application belonging to one citizen, newest first.
 * @param {string} userId
 */
export async function listApplications(userId) {
  if (!userId) return [];
  const rows = await getAllBy(STORE, 'byUser', userId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** @param {string} id */
export function getApplication(id) {
  return get(STORE, id);
}

/** The citizen's open draft for one GRA service, if they have one. */
export async function getDraft(userId, serviceId) {
  const rows = await listApplications(userId);
  return rows.find((a) => a.status === 'draft' && a.serviceId === serviceId) || null;
}

/**
 * Create or update a draft. Nothing is validated here — a draft is allowed to
 * be incomplete; that is the point of saving one.
 * @param {{
 *   userId: string,
 *   serviceId: string,
 *   applicationId?: string,
 *   fields?: Record<string, string>,
 *   documents?: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>,
 *   prerequisites?: Record<string, unknown>
 * }} args
 */
export async function saveDraft({ userId, serviceId, applicationId, fields = {}, documents = {}, prerequisites = {} }) {
  if (!userId) throw new ApiError('You need to be signed in to save an application.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service) throw new ApiError('That GRA service is not available.', 'notFound');

  const existing = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (existing && existing.userId !== userId) {
    throw new ApiError('That application belongs to someone else.', 'forbidden');
  }
  if (existing && existing.status !== 'draft') {
    throw new ApiError('That application has already been submitted.', 'conflict');
  }

  const base = existing || newDraft({
    userId,
    service,
    refPrefix: 'GRA',
    extra: {
      applicationType: '',
      assessedTaxGyd: null,
    },
  });

  const mergedFields = { ...base.fields, ...fields };
  const merged = {
    ...base,
    fields: mergedFields,
    prerequisites: { ...base.prerequisites, ...prerequisites },
    documents: buildDocumentList(requiredDocumentsFor(service, mergedFields), documents),
    applicationType: mergedFields.applicationType || base.applicationType,
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
 * document, assigns the reference, routes it to GRA and writes the opening
 * timeline entries.
 * @param {{
 *   userId: string,
 *   serviceId: string,
 *   applicationId?: string,
 *   fields: Record<string, string>,
 *   documents: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>,
 *   prerequisites?: Record<string, unknown>
 * }} args
 */
export async function submitApplication({ userId, serviceId, applicationId, fields, documents, prerequisites = {} }) {
  if (!userId) throw new ApiError('You need to be signed in to apply.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service) throw new ApiError('That GRA service is not available.', 'notFound');

  const { ok, errors } = validateFields(service.fields, fields);
  if (!ok) throw new ApiError('Some answers still need attention.', 'validation', { errors });

  const requiredDocs = requiredDocumentsFor(service, fields);
  await assertAttachmentsTyped({ userId, documents: requiredDocs, attached: documents });

  const docCheck = validateDocuments(requiredDocs, documents);
  if (!docCheck.ok) {
    throw new ApiError(
      `Still missing: ${docCheck.missing.join(', ')}.`,
      'validation',
      { missingDocuments: docCheck.missing }
    );
  }

  const draft = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (draft && draft.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (draft && draft.status !== 'draft') throw new ApiError('That application has already been submitted.', 'conflict');

  // One live application per GRA service — a second TIN application while the
  // first is still moving would just split the same request across two desks.
  const duplicate = (await listApplications(userId))
    .find((a) => a.id !== draft?.id && a.serviceId === serviceId && isLive(a));
  if (duplicate) {
    throw new ApiError(
      `You already have a live ${service.name} application (${duplicate.ref}). Track that one instead.`,
      'duplicate',
      { existingId: duplicate.id, existingRef: duplicate.ref, group: 'gra' }
    );
  }

  const [fees, routes, agencies] = await Promise.all([
    listFees(service.id),
    listRoutes(service.id),
    getAgencyMap(),
  ]);
  const feeTotal = fees.filter((f) => f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0);

  const timestamp = now();
  const base = draft || newDraft({ userId, service, refPrefix: 'GRA', extra: {} });

  const submitted = {
    ...base,
    ref: assignReference(REF_PREFIX[service.id] || 'GRA'),
    userId,
    serviceId: service.id,
    group: 'gra',
    agencyId: service.agencyId,
    title: service.name,
    status: 'submitted',
    fields: { ...fields },
    prerequisites: { ...prerequisites },
    documents: buildDocumentList(requiredDocs, documents),
    feeTotalGyd: feeTotal,
    feeStatus: feeTotal === 0 ? 'waived' : 'unpaid',
    submittedAt: timestamp,
    createdAt: base.createdAt || timestamp,
    updatedAt: timestamp,
    decisionAt: null,
    decisionNote: null,
    applicationType: fields.applicationType || '',
    assessedTaxGyd: null,
  };

  await put(STORE, submitted);
  await createReviews({ applicationId: submitted.id, routes });
  await addEvent({
    applicationId: submitted.id,
    type: 'submitted',
    label: 'Application submitted',
    note: feeTotal > 0
      ? `Reference ${submitted.ref}. The ${service.name.toLowerCase()} fee of $${feeTotal.toLocaleString('en-GY')} GYD is outstanding.`
      : `Reference ${submitted.ref}. Nothing to pay — this service is free of charge.`,
  });
  await addEvent({
    applicationId: submitted.id,
    type: 'routed',
    label: `With ${agencies[service.agencyId]?.shortName || 'GRA'}`,
    note: routes[0]?.purpose,
    agencyId: service.agencyId,
  });

  return submitted;
}

/**
 * The documents a given set of answers actually requires. The seed marks the
 * conditional ones optional; this flips them to required when the chosen
 * application type actually needs them.
 * @param {import('../data/types').Service} service
 * @param {Record<string, string>} fields
 */
export function requiredDocumentsFor(service, fields) {
  const type = fields?.applicationType;
  return (service.documents || []).map((doc) => {
    // Driver's licence: a renewal or replacement is verified against the card
    // you hold; a first licence needs the photo instead.
    if (doc.id === 'oldLicence') return { ...doc, required: type === 'renewal' || type === 'change' };
    if (doc.id === 'photo' && service.id === 'svc_gra_drivers_licence') return { ...doc, required: type === 'new' };
    // TIN update: the change has to be evidenced.
    if (doc.id === 'supportingDoc' && service.id === 'svc_gra_tin') return { ...doc, required: type === 'change' };
    return doc;
  });
}

/**
 * Attach or replace one document on an application that is already in.
 * @param {{userId: string, applicationId: string, docId: string, fileName: string, size?: number, vaultDocId?: string, fromVault?: boolean}} args
 */
export async function attachDocument({ userId, applicationId, docId, fileName, size, vaultDocId, fromVault }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  if (fromVault && vaultDocId) {
    const service = await getService(application.serviceId);
    const field = requiredDocumentsFor(service, application.fields).find((d) => d.id === docId);
    await assertAttachable({ userId, documentId: vaultDocId, field });
  }

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
 * Take payment for the outstanding fee (demo: always succeeds).
 * @param {{userId: string, applicationId: string, method?: string}} args
 */
export async function payFees({ userId, applicationId, method = 'card' }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (application.feeStatus === 'paid') return application;

  const timestamp = now();
  const updated = { ...application, feeStatus: 'paid', updatedAt: timestamp };
  await put(STORE, updated);
  await addEvent({
    applicationId,
    type: 'feePaid',
    label: 'Fee paid',
    note: `$${application.feeTotalGyd.toLocaleString('en-GY')} GYD received (${method}).`,
    at: timestamp,
  });
  return updated;
}

/**
 * Record GRA's decision. Approving a property tax return raises the
 * assessment; everything else closes clean.
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

  const assessed = application.serviceId === 'svc_gra_property_tax'
    ? calculatePropertyTax(application.fields?.netPropertyValue)
    : null;
  const closeNote = note || decisionNoteFor(application, assessed);

  const updated = {
    ...application,
    status: 'approved',
    assessedTaxGyd: assessed,
    decisionAt: timestamp,
    decisionNote: closeNote,
    updatedAt: timestamp,
  };
  await put(STORE, updated);
  await addEvent({ applicationId, type: 'approved', label: approvedLabelFor(application), note: closeNote });
  return updated;
}

function approvedLabelFor(application) {
  switch (application.serviceId) {
    case 'svc_gra_tin': return 'TIN issued';
    case 'svc_gra_drivers_licence': return 'Licence ready';
    case 'svc_gra_business': return 'Registration complete';
    case 'svc_gra_property_tax': return 'Return assessed';
    default: return 'Approved';
  }
}

function decisionNoteFor(application, assessedTaxGyd) {
  switch (application.serviceId) {
    case 'svc_gra_tin':
      return application.applicationType === 'change'
        ? 'Your TIN record has been updated.'
        : 'Your TIN certificate has been issued.';
    case 'svc_gra_drivers_licence':
      return 'Collect your licence at the Licence Revenue Office or any GRA regional branch — bring this reference.';
    case 'svc_gra_business':
      return 'The tax accounts are set up against your TIN. Filing obligations start from your first period.';
    case 'svc_gra_property_tax':
      return assessedTaxGyd > 0
        ? `Assessment: $${assessedTaxGyd.toLocaleString('en-GY')} GYD, due by April 30.`
        : 'Assessment: no property tax due — net property is within the tax-free threshold.';
    default:
      return null;
  }
}

/**
 * Everything the tracker needs for one GRA application.
 * @param {{userId: string, applicationId: string}} args
 */
export async function getApplicationDetail({ userId, applicationId }) {
  const agencies = await getAgencyMap();
  const names = Object.fromEntries(Object.values(agencies).map((a) => [a.id, a.shortName]));
  await syncReviewProgress({ applicationId, group: 'gra', agencyNames: names });

  let application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  // Clearing GRA's review is the decision — close out the outcome fields.
  if (application.status === 'approved' && !application.decisionAt) {
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
    award: application.status === 'approved' && application.assessedTaxGyd !== null
      ? {
        amountGyd: application.assessedTaxGyd,
        basis: application.assessedTaxGyd > 0
          ? 'Property tax assessed on the declared net value — due by April 30.'
          : 'No property tax due — net property is within the G$40,000,000 tax-free threshold.',
      }
      : null,
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
