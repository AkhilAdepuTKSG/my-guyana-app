// The unified view over everything a citizen has applied for.
//
// Cash grants, Single Window applications, GRO certificate requests, GRA
// applications and the old age pension live in five different tables with five
// different shapes. Every screen that lists "my applications" — the
// Applications tab, the My Applications section in the profile — reads the one
// flattened shape produced here, so none of them has to know which table a row
// came from.

import { getAgencyMap, getService, listServices } from './catalog';
import * as cashGrants from './cashGrants';
import * as singleWindow from './singleWindow';
import * as gro from './gro';
import * as gra from './gra';
import * as oldAgePension from './oldAgePension';
import { listEvents, listReviews, syncReviewProgress } from './applicationCommon';
import { ApiError } from './validate';

/**
 * A row in the unified list.
 * @typedef {Object} ApplicationSummary
 * @property {string} id
 * @property {string} ref
 * @property {import('../data/types').ServiceGroup} group
 * @property {string} serviceId
 * @property {string} title
 * @property {string} agencyId
 * @property {string} agencyShortName
 * @property {string} agencyMark
 * @property {string} icon
 * @property {import('../data/types').ApplicationStatus} status
 * @property {string} statusLabel
 * @property {'success'|'warning'|'error'|'info'|'neutral'} tone
 * @property {string|null} submittedAt
 * @property {string} updatedAt
 * @property {number} step
 * @property {number} totalSteps
 * @property {string|null} subtitle
 * @property {boolean} hasCertificate
 * @property {string|null} certificateId
 * @property {string|null} actionLabel
 * @property {import('../data/types').AttachedDocument[]} documents
 * @property {{done: number, total: number, outstanding: string[]}|null} documentSummary
 */

/** Citizen-facing wording for each status. */
export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  inReview: 'In review',
  actionNeeded: 'Action needed',
  approved: 'Approved',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
};

/** Which pill tone each status gets. */
export const STATUS_TONES = {
  draft: 'neutral',
  submitted: 'info',
  inReview: 'info',
  actionNeeded: 'warning',
  approved: 'success',
  rejected: 'error',
  withdrawn: 'neutral',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || 'In progress';
}

export function statusTone(status) {
  return STATUS_TONES[status] || 'info';
}

/**
 * Is this application finished with? Approved, refused and withdrawn ones are
 * history — the citizen may still open them, but they are not waiting on
 * anything, so they belong below the live ones rather than among them.
 * @param {ApplicationSummary} app
 */
export function isHistory(app) {
  return ['approved', 'rejected', 'withdrawn'].includes(app?.status);
}

/**
 * Split a citizen's applications into what is still moving and what is done.
 * @param {ApplicationSummary[]} rows
 * @returns {{active: ApplicationSummary[], history: ApplicationSummary[]}}
 */
export function partitionByProgress(rows) {
  const all = rows || [];
  return {
    active: all.filter((a) => !isHistory(a)),
    history: all.filter(isHistory),
  };
}

/**
 * Everything one citizen has applied for, newest first.
 * @param {string} userId
 * @returns {Promise<ApplicationSummary[]>}
 */
export async function listAll(userId) {
  if (!userId) return [];

  const [agencies, services, grants, sw, requests, revenue, pensions] = await Promise.all([
    getAgencyMap(),
    listServices(),
    cashGrants.listApplications(userId),
    singleWindow.listApplications(userId),
    gro.listRequests(userId),
    gra.listApplications(userId),
    oldAgePension.listApplications(userId),
  ]);
  const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));

  /** @param {string} agencyId */
  const agencyBits = (agencyId) => ({
    agencyId,
    agencyShortName: agencies[agencyId]?.shortName || agencyId,
    agencyMark: agencies[agencyId]?.mark || 'var(--brand-600)',
  });

  /** @type {ApplicationSummary[]} */
  const rows = [];

  grants.forEach((a) => {
    rows.push({
      id: a.id,
      ref: a.ref,
      group: 'cashGrants',
      serviceId: a.serviceId,
      title: a.title,
      ...agencyBits(a.agencyId),
      icon: serviceById[a.serviceId]?.icon || 'banknote',
      status: a.status,
      statusLabel: statusLabel(a.status),
      tone: statusTone(a.status),
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      step: stepFor(a.status),
      totalSteps: 4,
      subtitle: a.awardedAmountGyd
        ? `Awarded $${a.awardedAmountGyd.toLocaleString('en-GY')}`
        : (cashGrants.GRANT_AWARDS[a.grantType]?.label || null),
      hasCertificate: false,
      certificateId: null,
      actionLabel: a.status === 'draft' ? 'Resume' : 'Track',
      documents: a.documents || [],
      documentSummary: summariseDocuments(a.documents),
    });
  });

  sw.forEach((a) => {
    rows.push({
      id: a.id,
      ref: a.ref,
      group: 'singleWindow',
      serviceId: a.serviceId,
      title: a.title,
      ...agencyBits(a.agencyId),
      icon: serviceById[a.serviceId]?.icon || 'building-2',
      status: a.status,
      statusLabel: statusLabel(a.status),
      tone: statusTone(a.status),
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      step: stepFor(a.status),
      totalSteps: 4,
      subtitle: a.parcelId ? `Parcel ${a.parcelId}` : null,
      hasCertificate: false,
      certificateId: null,
      actionLabel: a.status === 'draft' ? 'Resume' : 'Track',
      documents: a.documents || [],
      documentSummary: summariseDocuments(a.documents),
    });
  });

  requests.forEach((r) => {
    const serviceId = r.type ? `svc_gro_${r.type}` : '';
    rows.push({
      id: r.id,
      ref: r.ref,
      group: 'gro',
      serviceId,
      title: `${gro.certificateTypeLabel(r.type)} certificate`,
      ...agencyBits('gro'),
      icon: serviceById[serviceId]?.icon || 'book-open',
      status: r.status,
      statusLabel: r.status === 'approved' && r.certificateId ? 'Certificate ready' : statusLabel(r.status),
      tone: statusTone(r.status),
      submittedAt: r.createdAt,
      updatedAt: r.updatedAt,
      step: stepFor(r.status),
      totalSteps: 4,
      subtitle: `Registration ${r.regNo}`,
      hasCertificate: r.status === 'approved',
      certificateId: r.certificateId,
      actionLabel: r.status === 'approved' ? 'View certificate' : 'Track',
      // A GRO request asks for no documents — the register entry is the record.
      documents: [],
      documentSummary: null,
    });
  });

  revenue.forEach((a) => {
    rows.push({
      id: a.id,
      ref: a.ref,
      group: 'gra',
      serviceId: a.serviceId,
      title: a.title,
      ...agencyBits(a.agencyId),
      icon: serviceById[a.serviceId]?.icon || 'receipt',
      status: a.status,
      statusLabel: statusLabel(a.status),
      tone: statusTone(a.status),
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      step: stepFor(a.status),
      totalSteps: 4,
      subtitle: graSubtitle(a),
      hasCertificate: false,
      certificateId: null,
      actionLabel: a.status === 'draft' ? 'Resume' : 'Track',
      documents: a.documents || [],
      documentSummary: summariseDocuments(a.documents),
    });
  });

  pensions.forEach((a) => {
    rows.push({
      id: a.id,
      ref: a.ref,
      group: 'mhsss',
      serviceId: a.serviceId,
      title: a.title,
      ...agencyBits(a.agencyId),
      icon: serviceById[a.serviceId]?.icon || 'hand-heart',
      status: a.status,
      statusLabel: statusLabel(a.status),
      tone: statusTone(a.status),
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      step: stepFor(a.status),
      totalSteps: 4,
      subtitle: pensionSubtitle(a),
      // The award letter is a Vault document rather than a certificate screen,
      // so the row points at the tracker and the Vault holds the paper.
      hasCertificate: false,
      certificateId: null,
      actionLabel: a.status === 'draft' ? 'Resume' : 'Track',
      documents: a.documents || [],
      documentSummary: summariseDocuments(a.documents),
    });
  });

  return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/** One line saying where a pension application stands, for the list rows. */
function pensionSubtitle(a) {
  if (a.status === 'approved' && a.monthlyBenefitGyd) {
    return `$${a.monthlyBenefitGyd.toLocaleString('en-GY')} a month`;
  }
  if (a.disbursementMethod === 'mmg') return 'Paid to mobile money';
  if (a.disbursementMethod === 'bank') return 'Paid to your bank account';
  return null;
}

/** One line saying what a GRA application is about, for the list rows. */
function graSubtitle(a) {
  const type = a.applicationType || a.fields?.applicationType;
  const typeLabel = { new: 'New', renewal: 'Renewal', change: 'Update', return: 'Annual return' }[type];
  switch (a.serviceId) {
    case 'svc_gra_drivers_licence':
      return [typeLabel, a.fields?.licenceNumber ? 'licence ' + a.fields.licenceNumber : null].filter(Boolean).join(' · ') || null;
    case 'svc_gra_business':
      return a.fields?.businessName || typeLabel || null;
    case 'svc_gra_property_tax':
      return a.fields?.taxYear ? 'Year of assessment ' + a.fields.taxYear : typeLabel || null;
    default:
      return typeLabel || null;
  }
}

/**
 * How the documents on an application stand, by name. The list screens show the
 * outstanding ones rather than a single "complete" tick, so a citizen can see
 * what is missing without opening the application.
 * @param {import('../data/types').AttachedDocument[]} documents
 */
function summariseDocuments(documents) {
  const all = documents || [];
  if (!all.length) return null;
  const isIn = (d) => ['attached', 'fromVault'].includes(d.status);
  // Older rows predate the stored `required` flag; treat those as required.
  const required = all.filter((d) => d.required !== false);
  const outstanding = required.filter((d) => !isIn(d));
  return {
    done: required.filter(isIn).length,
    total: required.length,
    outstanding: outstanding.map((d) => d.label),
    // Optional extras the citizen chose to attach still count as on file.
    extras: all.filter((d) => d.required === false && isIn(d)).length,
  };
}

/** Rough position through the four-step arc, for the progress bar. */
function stepFor(status) {
  switch (status) {
    case 'draft': return 1;
    case 'submitted': return 2;
    case 'inReview':
    case 'actionNeeded': return 3;
    case 'approved':
    case 'rejected': return 4;
    default: return 2;
  }
}

/**
 * The detail for one application, whichever table it came from. The tracker
 * calls this and renders whatever comes back.
 * @param {{userId: string, group: import('../data/types').ServiceGroup, id: string}} args
 */
export async function getDetail({ userId, group, id }) {
  if (group === 'cashGrants') {
    const detail = await cashGrants.getApplicationDetail({ userId, applicationId: id });
    return { kind: 'application', ...detail };
  }
  if (group === 'singleWindow') {
    const detail = await singleWindow.getApplicationDetail({ userId, applicationId: id });
    return { kind: 'application', ...detail };
  }
  if (group === 'gra') {
    const detail = await gra.getApplicationDetail({ userId, applicationId: id });
    return { kind: 'application', ...detail };
  }
  if (group === 'mhsss') {
    const detail = await oldAgePension.getApplicationDetail({ userId, applicationId: id });
    return { kind: 'application', ...detail };
  }
  if (group === 'gro') {
    const detail = await gro.getRequestDetail({ userId, requestId: id });
    return { kind: 'gro', ...detail };
  }
  throw new ApiError('That kind of application is not tracked here.', 'invalid', { group });
}

/**
 * How many applications need the citizen's attention — drives the badge on the
 * My Applications section.
 * @param {ApplicationSummary[]} rows
 */
export function countNeedingAction(rows) {
  return rows.filter((r) => r.status === 'actionNeeded' || r.status === 'draft').length;
}

export { getService, listEvents, listReviews, syncReviewProgress };
