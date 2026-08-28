// Single Window endpoints (CH&PA SWAS).
//
// One application, many agencies. Submission fans the application out across
// the seeded routing, and the tracker shows exactly which agency is holding it
// and what that agency is checking. Prerequisites — proof you hold the land,
// and outline planning permission — are enforced before anything is submitted.

import { get, getAllBy, put, del } from '../data/db';
import { now } from '../data/ids';
import { getService, listFees, listRoutes, getAgencyMap, listServices } from './catalog';
import {
  addEvent, listEvents, listReviews, createReviews, buildDocumentList,
  newDraft, assignReference, syncReviewProgress, recordAgencyDecision, isLive,
} from './applicationCommon';
import { validateFields, validateDocuments, validatePrerequisites, ApiError } from './validate';
import { assertAttachable } from './vault';
import { assertAttachmentsTyped } from './documentPolicy';

const STORE = 'single_window_applications';

/**
 * Every Single Window service, with its owning agency and reviewing agencies.
 * @returns {Promise<import('../data/types').Service[]>}
 */
export function listSingleWindowServices() {
  return listServices({ group: 'singleWindow' });
}

/**
 * Every Single Window application belonging to one citizen, newest first.
 * @param {string} userId
 * @returns {Promise<import('../data/types').SingleWindowApplication[]>}
 */
export async function listApplications(userId) {
  if (!userId) return [];
  const rows = await getAllBy(STORE, 'byUser', userId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * @param {string} id
 * @returns {Promise<import('../data/types').SingleWindowApplication|null>}
 */
export function getApplication(id) {
  return get(STORE, id);
}

/**
 * The citizen's open draft for one service, if any. Drafts are per service, so
 * a half-finished water connection does not block a permit application.
 * @param {string} userId
 * @param {string} serviceId
 */
export async function getDraft(userId, serviceId) {
  const rows = await listApplications(userId);
  return rows.find((a) => a.status === 'draft' && a.serviceId === serviceId) || null;
}

/**
 * Create or update a draft for one service. Drafts are allowed to be
 * incomplete; nothing is validated until submission.
 * @param {{
 *   userId: string,
 *   serviceId: string,
 *   applicationId?: string,
 *   fields?: Record<string, string>,
 *   documents?: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>,
 *   prerequisites?: Record<string, {confirmed: boolean, reference?: string}>
 * }} args
 * @returns {Promise<import('../data/types').SingleWindowApplication>}
 */
export async function saveDraft({ userId, serviceId, applicationId, fields = {}, documents = {}, prerequisites = {} }) {
  if (!userId) throw new ApiError('You need to be signed in to save an application.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service || service.group !== 'singleWindow') {
    throw new ApiError('That Single Window service is not available.', 'notFound', { serviceId });
  }

  const existing = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (existing && existing.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (existing && existing.status !== 'draft') throw new ApiError('That application has already been submitted.', 'conflict');

  const base = existing || newDraft({
    userId,
    service,
    refPrefix: 'SWAS',
    extra: {
      parcelId: '',
      parcelAddress: '',
      region: '',
      ownershipProofRef: '',
      outlinePermissionRef: null,
      plotStatus: 'empty',
      siteInvestigationRequired: false,
      currentSequence: 0,
      prerequisites: {},
    },
  });

  const mergedFields = { ...base.fields, ...fields };
  const mergedPrereqs = { ...base.prerequisites, ...prerequisites };

  const merged = {
    ...base,
    fields: mergedFields,
    prerequisites: mergedPrereqs,
    documents: buildDocumentList(requiredDocumentsFor(service, mergedFields), documents),
    parcelId: mergedFields.parcelId || base.parcelId,
    parcelAddress: mergedFields.parcelAddress || base.parcelAddress,
    region: mergedFields.region || base.region,
    ownershipProofRef: mergedPrereqs.proofOfLand?.reference || base.ownershipProofRef,
    outlinePermissionRef: mergedPrereqs.outlinePermission?.reference ?? base.outlinePermissionRef,
    plotStatus: mergedFields.plotStatus || base.plotStatus,
    siteInvestigationRequired: mergedFields.plotStatus === 'empty',
    updatedAt: now(),
  };

  await put(STORE, merged);
  if (!existing) {
    await addEvent({ applicationId: merged.id, type: 'created', label: 'Draft started', note: `${service.name} — saved to your account.` });
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
 * What this application will be charged, given the answers. The site
 * investigation is only charged on an empty plot, and the temporary utility
 * fees only for the supplies actually asked for.
 * @param {import('../data/types').ServiceFee[]} fees
 * @param {Record<string, string>} fields
 * @returns {{payableNow: import('../data/types').ServiceFee[], payableOnApproval: import('../data/types').ServiceFee[], totalNow: number, totalOnApproval: number}}
 */
export function priceApplication(fees, fields) {
  const applicable = (fees || []).filter((fee) => {
    if (fee.code === 'GWI-SITE') return fields?.plotStatus === 'empty';
    if (fee.code === 'GWI-TEMP') return ['water', 'both'].includes(fields?.utilitiesNeeded);
    if (fee.code === 'GPL-TEMP') return ['power', 'both'].includes(fields?.utilitiesNeeded);
    return true;
  });
  const payableNow = applicable.filter((f) => f.mandatory);
  const payableOnApproval = applicable.filter((f) => !f.mandatory);
  return {
    payableNow,
    payableOnApproval,
    totalNow: payableNow.reduce((s, f) => s + f.amountGyd, 0),
    totalOnApproval: payableOnApproval.reduce((s, f) => s + f.amountGyd, 0),
  };
}

/**
 * The routing this application will actually get, given the answers — the same
 * filter submission applies, so the View and review screens can show the
 * citizen exactly who will see it before they commit.
 * @param {import('../data/types').ServiceRoute[]} routes
 * @param {Record<string, string>} fields
 */
export function routeFor(routes, fields) {
  return (routes || [])
    .filter((r) => r.appliesWhen !== 'emptyPlot' || fields?.plotStatus === 'empty')
    .sort((a, b) => a.sequence - b.sequence)
    .map((r, i) => ({ ...r, sequence: i + 1 }));
}

/**
 * Submit a Single Window application: validate the prerequisites, the answers
 * and the documents, price it, assign the reference, and fan it out to every
 * reviewing agency.
 *
 * @param {{
 *   userId: string,
 *   serviceId: string,
 *   applicationId?: string,
 *   fields: Record<string, string>,
 *   documents: Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>,
 *   prerequisites: Record<string, {confirmed: boolean, reference?: string}>
 * }} args
 * @returns {Promise<import('../data/types').SingleWindowApplication>}
 */
export async function submitApplication({ userId, serviceId, applicationId, fields, documents, prerequisites }) {
  if (!userId) throw new ApiError('You need to be signed in to apply.', 'unauthenticated');

  const service = await getService(serviceId);
  if (!service || service.group !== 'singleWindow') {
    throw new ApiError('That Single Window service is not available.', 'notFound', { serviceId });
  }

  const prereqCheck = validatePrerequisites(service.prerequisites, prerequisites);
  if (!prereqCheck.ok) {
    throw new ApiError('Confirm what you already hold before this can be submitted.', 'validation', { prerequisiteErrors: prereqCheck.errors });
  }

  const { ok, errors } = validateFields(service.fields, fields);
  if (!ok) throw new ApiError('Some answers still need attention.', 'validation', { errors });

  const requiredDocs = requiredDocumentsFor(service, fields);
  // Every Vault-connected attachment must be of a type its slot accepts.
  await assertAttachmentsTyped({ userId, documents: requiredDocs, attached: documents });

  const docCheck = validateDocuments(requiredDocs, documents);
  if (!docCheck.ok) {
    throw new ApiError(`Still missing: ${docCheck.missing.join(', ')}.`, 'validation', { missingDocuments: docCheck.missing });
  }

  const draft = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (draft && draft.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');
  if (draft && draft.status !== 'draft') throw new ApiError('That application has already been submitted.', 'conflict');

  // The same approval cannot be sought twice for the same parcel while one is
  // still with the agencies — that is how duplicate permits and duplicate
  // connections get issued. A different parcel is a different application, and
  // a refused one may always be resubmitted.
  const duplicate = (await listApplications(userId)).find((a) => a.id !== draft?.id
    && a.serviceId === serviceId
    && isLive(a)
    && sameParcel(a.parcelId, fields.parcelId));
  if (duplicate) {
    throw new ApiError(
      `You already have a ${service.name.toLowerCase()} application in progress for parcel ${duplicate.parcelId} (${duplicate.ref}). `
      + 'Track that one instead, or apply for a different parcel.',
      'duplicate',
      { existingId: duplicate.id, existingRef: duplicate.ref, group: 'singleWindow' }
    );
  }

  const [fees, routes, agencies] = await Promise.all([
    listFees(serviceId),
    listRoutes(serviceId),
    getAgencyMap(),
  ]);
  const pricing = priceApplication(fees, fields);

  const timestamp = now();
  const base = draft || newDraft({ userId, service, refPrefix: 'SWAS', extra: {} });

  /** @type {import('../data/types').SingleWindowApplication} */
  const submitted = {
    ...base,
    ref: assignReference('SWAS'),
    userId,
    serviceId: service.id,
    group: 'singleWindow',
    agencyId: service.agencyId,
    title: service.name,
    status: 'submitted',
    fields: { ...fields },
    prerequisites: { ...prerequisites },
    documents: buildDocumentList(requiredDocs, documents),
    feeTotalGyd: pricing.totalNow,
    feeStatus: pricing.totalNow === 0 ? 'waived' : 'unpaid',
    submittedAt: timestamp,
    createdAt: base.createdAt || timestamp,
    updatedAt: timestamp,
    decisionAt: null,
    decisionNote: null,
    parcelId: fields.parcelId || '',
    parcelAddress: fields.parcelAddress || '',
    region: fields.region || '',
    ownershipProofRef: prerequisites.proofOfLand?.reference || '',
    outlinePermissionRef: prerequisites.outlinePermission?.reference
      || prerequisites.landApproval?.reference
      || prerequisites.buildingApproval?.reference
      || null,
    plotStatus: fields.plotStatus === 'developed' ? 'developed' : 'empty',
    siteInvestigationRequired: fields.plotStatus === 'empty',
    currentSequence: 1,
  };

  await put(STORE, submitted);
  const reviews = await createReviews({
    applicationId: submitted.id,
    routes,
    context: { plotStatus: submitted.plotStatus },
  });

  await addEvent({
    applicationId: submitted.id,
    type: 'submitted',
    label: 'Application submitted through the Single Window',
    note: `Reference ${submitted.ref}. It goes to ${reviews.length} ${reviews.length === 1 ? 'agency' : 'agencies'} — you do not need to contact them yourself.`,
  });

  const first = reviews[0];
  if (first) {
    await addEvent({
      applicationId: submitted.id,
      type: 'routed',
      label: `With ${agencies[first.agencyId]?.shortName || first.agencyId}`,
      note: first.purpose,
      agencyId: first.agencyId,
    });
  }
  if (submitted.siteInvestigationRequired && submitted.serviceId === 'svc_sw_water_connection') {
    await addEvent({
      applicationId: submitted.id,
      type: 'routed',
      label: 'Site investigation required',
      note: 'The plot is empty, so GWI will visit to measure the run to the nearest main and quote the connection before you are asked to pay.',
      agencyId: 'gwi',
    });
  }

  return submitted;
}

/** Parcel numbers are typed by hand, so compare them loosely. */
function sameParcel(a, b) {
  const norm = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const left = norm(a);
  return !!left && left === norm(b);
}

/**
 * The documents a given set of answers actually requires. A letter of authority
 * is only needed from an agent; structural certification only above two storeys.
 * @param {import('../data/types').Service} service
 * @param {Record<string, string>} fields
 * @returns {import('../data/types').DocumentDef[]}
 */
export function requiredDocumentsFor(service, fields) {
  return (service.documents || []).map((doc) => {
    if (doc.id === 'authorityLetter') return { ...doc, required: fields?.applyingAs === 'agent' };
    if (doc.id === 'structuralCert') return { ...doc, required: Number(fields?.storeys) > 2 };
    return doc;
  });
}

/**
 * Attach or replace one document on a submitted application.
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

  // A document connected from the Vault must be of a type this slot accepts.
  // The picker already filters by type; this is the authority that says so.
  if (fromVault && vaultDocId) {
    const service = await getService(application.serviceId);
    const field = requiredDocumentsFor(service, application.fields).find((d) => d.id === docId);
    await assertAttachable({ userId, documentId: vaultDocId, field });
  }

  const documents = application.documents.map((d) => (d.docId === docId
    ? { ...d, status: fromVault ? 'fromVault' : 'attached', fileName, size: size ?? null, vaultDocId: vaultDocId ?? null, attachedAt: now() }
    : d));
  const updated = {
    ...application,
    documents,
    // Supplying what an agency asked for puts the application back in its hands.
    status: application.status === 'actionNeeded' ? 'inReview' : application.status,
    updatedAt: now(),
  };
  await put(STORE, updated);
  await addEvent({
    applicationId,
    type: 'documentAdded',
    label: `${documents.find((d) => d.docId === docId)?.label || 'Document'} added`,
    note: fromVault ? 'Taken from your Vault.' : `${fileName} — also saved to your Vault.`,
  });
  return updated;
}

/** Record the fee payment against an application. */
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
 * Everything the tracker needs for one Single Window application: the routing
 * with agency detail, the timeline, and the fee position. Reviews are brought
 * up to date against each agency's published target first.
 * @param {{userId: string, applicationId: string}} args
 */
export async function getApplicationDetail({ userId, applicationId }) {
  const agencies = await getAgencyMap();
  const names = Object.fromEntries(Object.values(agencies).map((a) => [a.id, a.shortName]));
  await syncReviewProgress({ applicationId, group: 'singleWindow', agencyNames: names });

  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  const [service, reviews, events, fees] = await Promise.all([
    getService(application.serviceId),
    listReviews(applicationId),
    listEvents(applicationId),
    listFees(application.serviceId),
  ]);

  const pricing = priceApplication(fees, application.fields);
  const decided = reviews.filter((r) => r.status === 'approved').length;

  return {
    application,
    service,
    fees,
    pricing,
    reviews: reviews.map((r) => ({ ...r, agency: agencies[r.agencyId] || null })),
    events,
    progress: { decided, total: reviews.length },
    currentAgency: agencies[reviews.find((r) => r.status === 'inReview')?.agencyId] || null,
  };
}

export { recordAgencyDecision };
