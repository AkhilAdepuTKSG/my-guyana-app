// Old age pension endpoints (Ministry of Human Services & Social Security).
//
// Drafts, submission, documents, tracking and the award, in the shape the other
// application modules use — so the generic apply engine, the tracker and the My
// Applications list need no special case for the pension.
//
// What is particular to this service, and enforced here rather than trusted
// from the screen:
//   • the age test — computed from the date of birth on the application, not
//     from anything the citizen ticks, and re-run at submit;
//   • the apply window — six weeks before the qualifying birthday, so an
//     application cannot be lodged years early;
//   • the residency thresholds — ten years, two of them active;
//   • the immigration report — required of a first-time applicant at or over
//     the configured age, and of nobody else;
//   • one live pension per citizen.
//
// Every threshold and amount above is a `service_config` row read off the
// service record (see src/api/catalog.js), never a constant in this file.

import { get, getAllBy, put, del } from '../data/db';
import { newId, now } from '../data/ids';
import { getService, listFees, listRoutes, getAgencyMap } from './catalog';
import {
  addEvent, listEvents, listReviews, createReviews, buildDocumentList,
  newDraft, assignReference, syncReviewProgress, isLive,
} from './applicationCommon';
import { validateFields, validateDocuments, visibleFields, ApiError } from './validate';
import { assertAttachable, fileIssuedDocument } from './vault';
import { assertAttachmentsTyped } from './documentPolicy';
import { assessPension, pensionAward, pensionConfig, isoDate, formatLongDate } from '../lib/pension';

const STORE = 'old_age_pension_applications';

/** The citizen-facing reference prefix MHSSS quotes at a counter. */
const REF_PREFIX = 'MHSSS-OAP';

/**
 * Every old age pension application belonging to one citizen, newest first.
 * @param {string} userId
 * @returns {Promise<import('../data/types').OldAgePensionApplication[]>}
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

/** The citizen's open draft for this service, if they have one. */
export async function getDraft(userId, serviceId) {
  const rows = await listApplications(userId);
  return rows.find((a) => a.status === 'draft' && (!serviceId || a.serviceId === serviceId)) || null;
}

/**
 * The documents a given set of answers actually requires.
 *
 * The immigration report is seeded optional and turned on here, for a
 * first-time applicant at or over the configured age. The age comes from the
 * date of birth on the form, and the threshold from the service's config — so
 * the slot appears for exactly the people the Ministry asks it of.
 *
 * @param {import('../data/types').Service} service
 * @param {Record<string, string>} fields
 * @returns {import('../data/types').DocumentDef[]}
 */
export function requiredDocumentsFor(service, fields) {
  const check = assessPension({ service, fields });
  return (service.documents || []).map((doc) => {
    if (doc.id === 'immigrationReport') {
      return { ...doc, required: check.requiresImmigrationReport };
    }
    return doc;
  });
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
  if (!service) throw new ApiError('That service is not available.', 'notFound');

  const existing = applicationId ? await getApplication(applicationId) : await getDraft(userId, serviceId);
  if (existing && existing.userId !== userId) {
    throw new ApiError('That application belongs to someone else.', 'forbidden');
  }
  if (existing && existing.status !== 'draft') {
    throw new ApiError('That application has already been submitted.', 'conflict');
  }

  const base = existing || newDraft({ userId, service, refPrefix: 'OAP', extra: emptyPensionFields() });

  const mergedFields = { ...base.fields, ...fields };
  const merged = {
    ...base,
    fields: mergedFields,
    prerequisites: { ...base.prerequisites, ...prerequisites },
    documents: buildDocumentList(requiredDocumentsFor(service, mergedFields), documents),
    dateOfBirth: mergedFields.dob || base.dateOfBirth,
    updatedAt: now(),
  };

  await put(STORE, merged);
  if (!existing) {
    await addEvent({
      applicationId: merged.id,
      type: 'created',
      label: 'Draft started',
      note: 'Saved to your account — you can come back to it any time.',
    });
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
 * The eligibility check the endpoint runs, whatever the screen believed.
 *
 * Kept separate so it can be called on its own — the apply screen shows the
 * citizen the same assessment before they start, and this is what actually
 * decides whether an application is accepted.
 *
 * @param {{service: import('../data/types').Service, fields: Record<string, string>, at?: Date}} args
 * @returns {ReturnType<typeof assessPension>}
 */
export function checkEligibility({ service, fields, at }) {
  return assessPension({ service, fields, at });
}

/** Throw the citizen-facing refusal when an application does not qualify. */
function assertEligible({ service, fields }) {
  const check = checkEligibility({ service, fields });
  if (check.ok) return check;

  if (!check.ageOk) {
    throw new ApiError(
      check.reasons[0] || 'You are not yet old enough to claim the old age pension.',
      'eligibility',
      {
        rule: 'pensionAgeWindow',
        age: check.age,
        qualifiesOn: check.qualifiesOn,
        opensOn: check.opensOn,
        reasons: check.reasons,
      }
    );
  }
  throw new ApiError(
    check.reasons[0] || 'Your answers do not meet the residency requirement for the old age pension.',
    'eligibility',
    { rule: 'pensionResidency', reasons: check.reasons }
  );
}

/**
 * Submit the application. Validates every visible field, re-runs the age,
 * apply-window and residency checks, enforces the typed document rules,
 * assigns the reference, routes it to MHSSS and opens the timeline.
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
  if (!service) throw new ApiError('That service is not available.', 'notFound');

  const { ok, errors } = validateFields(service.fields, fields);
  if (!ok) throw new ApiError('Some answers still need attention.', 'validation', { errors });

  // The scheme's own rules, applied to what was actually submitted.
  const check = assertEligible({ service, fields });

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

  // One pension per person. A second application while the first is still
  // moving would only split the same claim across two desks.
  const duplicate = (await listApplications(userId))
    .find((a) => a.id !== draft?.id && isLive(a));
  if (duplicate) {
    throw new ApiError(
      `You already have a live old age pension application (${duplicate.ref}). Track that one instead.`,
      'duplicate',
      { existingId: duplicate.id, existingRef: duplicate.ref, group: 'mhsss' }
    );
  }

  const [fees, routes, agencies] = await Promise.all([
    listFees(service.id),
    listRoutes(service.id),
    getAgencyMap(),
  ]);
  const feeTotal = fees.filter((f) => f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0);

  const timestamp = now();
  const base = draft || newDraft({ userId, service, refPrefix: 'OAP', extra: emptyPensionFields() });
  const award = pensionAward(service);

  /** @type {import('../data/types').OldAgePensionApplication} */
  const submitted = {
    ...base,
    ref: assignReference(REF_PREFIX),
    userId,
    serviceId: service.id,
    group: 'mhsss',
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

    // The basis of the award, kept on the row: what was checked has to survive
    // on the application rather than being recomputed from a config that may
    // since have moved.
    dateOfBirth: fields.dob || null,
    ageAtApplication: check.age,
    citizenship: fields.citizenship || null,
    yearsInGuyana: toNumber(fields.yearsInGuyana),
    activeResidentYears: toNumber(fields.activeResidentYears),
    firstTimeApplicant: fields.firstTimeApplicant === 'yes',
    disbursementMethod: fields.disbursementMethod || null,
    disbursementDetail: disbursementFrom(fields),
    monthlyBenefitGyd: award.monthlyGyd,
    transportGrantGyd: award.transportGrantGyd,
    // The pension runs from the qualifying birthday, or from submission for
    // somebody who applies after it.
    awardStartsOn: laterOf(check.qualifiesOn, isoDate(new Date())),
    awardDocumentId: null,
  };

  await put(STORE, submitted);
  await createReviews({ applicationId: submitted.id, routes });
  await addEvent({
    applicationId: submitted.id,
    type: 'submitted',
    label: 'Application submitted',
    note: `Reference ${submitted.ref}. Nothing to pay — the old age pension is free to apply for.`,
  });
  await addEvent({
    applicationId: submitted.id,
    type: 'routed',
    label: `With ${agencies[service.agencyId]?.shortName || 'MHSSS'}`,
    note: routes[0]?.purpose,
    agencyId: service.agencyId,
  });

  return submitted;
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
 * Record the Ministry's decision.
 *
 * Approving issues the award: the pension book letter is generated and filed in
 * the citizen's own Vault, where only they can see it.
 * @param {{userId?: string, applicationId: string, decision: 'approved'|'rejected', note?: string}} args
 */
export async function recordDecision({ userId, applicationId, decision, note }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');

  const timestamp = now();

  if (decision === 'rejected') {
    const updated = {
      ...application,
      status: 'rejected',
      decisionAt: timestamp,
      decisionNote: note ?? null,
      updatedAt: timestamp,
    };
    await put(STORE, updated);
    await addEvent({ applicationId, type: 'rejected', label: 'Not approved', note });
    return updated;
  }

  const service = await getService(application.serviceId);
  const award = pensionAward(service);
  const startsOn = application.awardStartsOn || isoDate(new Date());
  // The award in the citizen's own terms. A note the routing path already
  // wrote ("Every reviewing agency has approved this application") says nothing
  // about what they will be paid, so the pension states it plainly.
  const closeNote = note
    || `Your old age pension of $${award.monthlyGyd.toLocaleString('en-GY')} GYD a month is awarded from ${formatLongDate(startsOn)}, `
    + `with the $${award.transportGrantGyd.toLocaleString('en-GY')} GYD transportation grant each year.`;

  const approved = {
    ...application,
    status: 'approved',
    monthlyBenefitGyd: award.monthlyGyd,
    transportGrantGyd: award.transportGrantGyd,
    awardStartsOn: startsOn,
    decisionAt: timestamp,
    decisionNote: closeNote,
    updatedAt: timestamp,
  };
  await put(STORE, approved);
  await addEvent({ applicationId, type: 'approved', label: 'Pension awarded', note: closeNote });

  const filed = await fileAward({ userId: userId || application.userId, application: approved, service });
  if (filed) {
    await put(STORE, { ...approved, awardDocumentId: filed.document.id });
    if (filed.created) {
      await addEvent({
        applicationId,
        type: 'issued',
        label: 'Award letter filed in your Vault',
        note: 'Only you can see it there.',
        agencyId: application.agencyId,
      });
    }
    return { ...approved, awardDocumentId: filed.document.id };
  }
  return approved;
}

/**
 * File the award letter in the citizen's Vault.
 *
 * Like the GRO certificate, the Vault stores the recipe rather than the bytes:
 * the letter is redrawn from the application whenever it is opened, so what
 * downloads is always the current document.
 */
async function fileAward({ userId, application, service }) {
  if (!userId) return null;
  const cfg = pensionConfig(service);
  return fileIssuedDocument({
    userId,
    type: 'PENSION_BOOK',
    title: 'Old age pension award',
    subtitle: `${application.fields?.applicantName || 'Awarded'} · $${cfg.monthlyBenefitGyd.toLocaleString('en-GY')} a month`,
    issuedBy: 'Ministry of Human Services & Social Security',
    refNo: application.ref,
    fileName: `old-age-pension-award-${application.ref.replace(/[^A-Za-z0-9]/g, '-')}.pdf`,
    mimeType: 'application/pdf',
    content: { generator: 'pensionAward', args: { applicationId: application.id } },
  });
}

/**
 * Everything the tracker needs for one pension application.
 * @param {{userId: string, applicationId: string}} args
 */
export async function getApplicationDetail({ userId, applicationId }) {
  const agencies = await getAgencyMap();
  const names = Object.fromEntries(Object.values(agencies).map((a) => [a.id, a.shortName]));
  await syncReviewProgress({ applicationId, group: 'mhsss', agencyNames: names });

  let application = await getApplication(applicationId);
  if (!application) throw new ApiError('That application no longer exists.', 'notFound');
  if (application.userId !== userId) throw new ApiError('That application belongs to someone else.', 'forbidden');

  // Clearing the Ministry's review is the decision — issue the award and file
  // the letter, exactly as recording the decision by hand would.
  //
  // The test is whether the award has been issued, not whether a decision was
  // stamped: the shared routing path (recordAgencyDecision) approves the
  // application and stamps `decisionAt` itself, so keying off that left an
  // approved pension with no award letter in the citizen's Vault.
  if (application.status === 'approved' && !application.awardDocumentId) {
    application = await recordDecision({ userId, applicationId, decision: 'approved' });
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
    award: application.status === 'approved'
      ? {
        amountGyd: application.monthlyBenefitGyd,
        transportGrantGyd: application.transportGrantGyd,
        startsOn: application.awardStartsOn,
        documentId: application.awardDocumentId,
        basis: application.decisionNote,
      }
      : null,
  };
}

/**
 * Rebuild the data an award letter is drawn from, for a Vault document whose
 * content is a `pensionAward` generator.
 * @param {{applicationId: string}} args
 */
export async function loadAwardForVault({ applicationId }) {
  const application = await getApplication(applicationId);
  if (!application) throw new ApiError('That pension application no longer exists.', 'notFound');
  const service = await getService(application.serviceId);
  return { application, service };
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

/** The pension-specific columns, empty, for a fresh draft. */
function emptyPensionFields() {
  return {
    dateOfBirth: null,
    ageAtApplication: null,
    citizenship: null,
    yearsInGuyana: null,
    activeResidentYears: null,
    firstTimeApplicant: false,
    disbursementMethod: null,
    disbursementDetail: null,
    monthlyBenefitGyd: null,
    transportGrantGyd: null,
    awardStartsOn: null,
    awardDocumentId: null,
  };
}

/**
 * How the citizen is to be paid, with the account or wallet number reduced to
 * its last four digits — enough to recognise, not enough to use.
 */
function disbursementFrom(fields) {
  const method = fields.disbursementMethod;
  if (method !== 'bank' && method !== 'mmg') return null;
  const raw = method === 'bank' ? fields.bankAccount : fields.mmgWallet;
  const digits = String(raw || '').replace(/\D/g, '');
  return {
    provider: (method === 'bank' ? fields.bankName : fields.mmgProvider) || null,
    branch: method === 'bank' ? fields.bankBranch || null : null,
    last4: digits ? digits.slice(-4) : null,
    holder: fields.accountHolder || null,
  };
}

function toNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** The later of two ISO dates, either of which may be missing. */
function laterOf(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a > b ? a : b;
}

export { assessPension, pensionAward, pensionConfig };
