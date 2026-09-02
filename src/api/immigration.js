// Immigration Department endpoints — the Guyana passport. Drafts, submission,
// document handling, the Passport Office visit, fees and tracking, mirroring
// the GRA module: reads and writes are keyed by user AND service, and
// everything lives in the `immigration_applications` table.
//
// The one thing this group has that the others do not is an appointment. A
// passport cannot be finished online — the photo, signature and fingerprints
// are captured across a counter — so the slot the citizen picks while applying
// is stored on the application and the ten working days run from it.

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

const STORE = 'immigration_applications';

/** Citizen-facing reference prefixes, per service. */
const REF_PREFIX = {
  svc_immigration_passport: 'IMM-PP',
};

/**
 * Every Immigration application belonging to one citizen, newest first.
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

/** The citizen's open draft for one Immigration service, if they have one. */
export async function getDraft(userId, serviceId) {
  const rows = await listApplications(userId);
  return rows.find((a) => a.status === 'draft' && a.serviceId === serviceId) || null;
}

/**
 * Is a booking complete enough to submit against?
 * @param {{office?: string, date?: string, time?: string}|null|undefined} appointment
 */
export function appointmentComplete(appointment) {
  return !!(appointment && appointment.office && appointment.date && appointment.time);
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
 *   prerequisites?: Record<string, unknown>,
 *   appointment?: {office?: string, date?: string, time?: string}|null
 * }} args
 */
export async function saveDraft({
  userId, serviceId, applicationId, fields = {}, documents = {}, prerequisites = {}, appointment = null,
}) {
  if (!userId) throw new ApiError('You need to be signed in to save an application.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service) throw new ApiError('That Immigration service is not available.', 'notFound');

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
    refPrefix: 'IMM',
    extra: {
      applicationType: '',
      appointment: null,
    },
  });

  const mergedFields = { ...base.fields, ...fields };
  const merged = {
    ...base,
    fields: mergedFields,
    prerequisites: { ...base.prerequisites, ...prerequisites },
    documents: buildDocumentList(requiredDocumentsFor(service, mergedFields), documents),
    applicationType: mergedFields.applicationType || base.applicationType,
    appointment: appointment || base.appointment || null,
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
 * Submit the application. Validates every visible field, every required
 * document and the Passport Office booking, assigns the reference, routes it to
 * Immigration and writes the opening timeline entries.
 * @param {{
 *   userId: string,
 *   serviceId: string,
 *   applicationId?: string,
 *   fields: Record<string, string>,
 *   documents: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>,
 *   prerequisites?: Record<string, unknown>,
 *   appointment?: {office?: string, date?: string, time?: string}|null
 * }} args
 */
export async function submitApplication({
  userId, serviceId, applicationId, fields, documents, prerequisites = {}, appointment = null,
}) {
  if (!userId) throw new ApiError('You need to be signed in to apply.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service) throw new ApiError('That Immigration service is not available.', 'notFound');

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

  // The visit is not a nicety — it is where the originals are checked and the
  // biometrics are taken, so an application without one cannot be processed.
  if (service.appointment && !appointmentComplete(appointment)) {
    throw new ApiError(
      'Pick an office, a date and a time for your Passport Office visit before submitting.',
      'validation',
      { missingAppointment: true }
    );
  }

  const draft = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (draft && draft.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (draft && draft.status !== 'draft') throw new ApiError('That application has already been submitted.', 'conflict');

  // One live passport application at a time — a second one while the first is
  // still moving would just split the same request across two desks.
  const duplicate = (await listApplications(userId))
    .find((a) => a.id !== draft?.id && a.serviceId === serviceId && isLive(a));
  if (duplicate) {
    throw new ApiError(
      `You already have a live ${service.name} application (${duplicate.ref}). Track that one instead.`,
      'duplicate',
      { existingId: duplicate.id, existingRef: duplicate.ref, group: 'immigration' }
    );
  }

  const [fees, routes, agencies] = await Promise.all([
    listFees(service.id),
    listRoutes(service.id),
    getAgencyMap(),
  ]);
  const feeTotal = fees.filter((f) => f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0);

  const timestamp = now();
  const base = draft || newDraft({ userId, service, refPrefix: 'IMM', extra: {} });

  const submitted = {
    ...base,
    ref: assignReference(REF_PREFIX[service.id] || 'IMM'),
    userId,
    serviceId: service.id,
    group: 'immigration',
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
    appointment: appointment ? { ...appointment } : null,
  };

  await put(STORE, submitted);
  await createReviews({ applicationId: submitted.id, routes });
  await addEvent({
    applicationId: submitted.id,
    type: 'submitted',
    label: 'Application submitted',
    note: feeTotal > 0
      ? `Reference ${submitted.ref}. The passport fee of $${feeTotal.toLocaleString('en-GY')} GYD is outstanding.`
      : `Reference ${submitted.ref}.`,
  });
  if (submitted.appointment) {
    await addEvent({
      applicationId: submitted.id,
      type: 'appointmentBooked',
      label: 'Passport Office visit booked',
      note: `${submitted.appointment.office} — ${submitted.appointment.date} at ${submitted.appointment.time}. Bring the originals of everything you connected.`,
      agencyId: service.agencyId,
    });
  }
  await addEvent({
    applicationId: submitted.id,
    type: 'routed',
    label: `With ${agencies[service.agencyId]?.shortName || 'Immigration'}`,
    note: routes[0]?.purpose,
    agencyId: service.agencyId,
  });

  return submitted;
}

/**
 * The documents a given set of answers actually requires.
 *
 * Every passport asks for the same four, whichever kind it is: the birth
 * certificate proves citizenship, the ID proves the name, the clearance is the
 * Police Force's, and the photograph is the citizen's own. The proof of address
 * stays optional — it is only wanted from someone who has moved. Nothing here
 * turns on the application type, but the hook is the same one every other group
 * has, so the apply engine and the tracker ask this rather than reading the
 * seed directly.
 * @param {import('../data/types').Service} service
 * @param {Record<string, string>} _fields
 */
export function requiredDocumentsFor(service, _fields) {
  return service.documents || [];
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
 * Record Immigration's decision.
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

  const closeNote = note
    || `Collect your passport at ${application.appointment?.office || 'the Passport Office you visited'} — bring this reference and your National ID.`;

  const updated = {
    ...application,
    status: 'approved',
    decisionAt: timestamp,
    decisionNote: closeNote,
    updatedAt: timestamp,
  };
  await put(STORE, updated);
  await addEvent({ applicationId, type: 'approved', label: 'Passport ready', note: closeNote });
  return updated;
}

/**
 * Everything the tracker needs for one Immigration application.
 * @param {{userId: string, applicationId: string}} args
 */
export async function getApplicationDetail({ userId, applicationId }) {
  const agencies = await getAgencyMap();
  const names = Object.fromEntries(Object.values(agencies).map((a) => [a.id, a.shortName]));
  await syncReviewProgress({ applicationId, group: 'immigration', agencyNames: names });

  let application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  // Clearing Immigration's review is the decision — close out the outcome fields.
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
    award: null,
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
