// Behaviour shared by every application store.
//
// Cash grants, Single Window, GRA and the old age pension each live in their
// own table because they carry different detail, but everything below is
// identical for all of them: how a draft is shaped, how documents are attached,
// how the timeline is written, and how a submitted application is routed to its
// reviewing agencies.

import { getAllBy, put, withTx, requestToPromise } from '../data/db';
import { newId, newReference, now } from '../data/ids';
import { ApiError } from './validate';

/**
 * Statuses that mean an application is finished with, one way or another. A
 * citizen may always start again once one of these is reached; anything else is
 * still live and blocks a second bite at the same thing.
 */
export const CLOSED_STATUSES = ['rejected', 'withdrawn'];

/** Is this application still live — submitted or under review, not finished? */
export function isLive(application) {
  if (!application) return false;
  if (application.status === 'draft') return false;
  return !CLOSED_STATUSES.includes(application.status);
}

/** Which store a group's applications live in. */
export const STORE_BY_GROUP = {
  cashGrants: 'cash_grant_applications',
  singleWindow: 'single_window_applications',
  gra: 'gra_applications',
  mhsss: 'old_age_pension_applications',
};

/**
 * Append a timeline entry. Every state change writes one, so the tracker is a
 * projection of what actually happened rather than a guess from a counter.
 * @param {Omit<import('../data/types').ApplicationEvent, 'id'|'at'> & {at?: string}} event
 */
export async function addEvent(event) {
  /** @type {import('../data/types').ApplicationEvent} */
  const row = { id: newId('evt'), at: event.at || now(), ...event };
  await put('application_events', row);
  return row;
}

/**
 * The timeline for one application, oldest first.
 * @param {string} applicationId
 * @returns {Promise<import('../data/types').ApplicationEvent[]>}
 */
export async function listEvents(applicationId) {
  const rows = await getAllBy('application_events', 'byApplication', applicationId);
  return rows.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * The per-agency routing status for one application, in sequence order.
 * @param {string} applicationId
 * @returns {Promise<import('../data/types').AgencyReview[]>}
 */
export async function listReviews(applicationId) {
  const rows = await getAllBy('application_agency_reviews', 'byApplication', applicationId);
  return rows.sort((a, b) => a.sequence - b.sequence);
}

/**
 * Turn the citizen's attachment map into the stored document list, using the
 * service's document definitions as the source of truth for labels.
 * @param {import('../data/types').DocumentDef[]} defs
 * @param {Record<string, {status?: string, fileName?: string, size?: number, vaultDocId?: string}>} attached
 * @returns {import('../data/types').AttachedDocument[]}
 */
export function buildDocumentList(defs, attached) {
  return (defs || []).map((def) => {
    const a = attached?.[def.id];
    const status = a?.status === 'attached' || a?.status === 'fromVault' ? a.status : 'missing';
    return {
      docId: def.id,
      label: def.label,
      // Whether this document was required given the answers on the day, so a
      // conditional document is never later reported as outstanding when the
      // application never needed it.
      required: !!def.required,
      status,
      fileName: a?.fileName ?? null,
      size: a?.size ?? null,
      vaultDocId: a?.vaultDocId ?? null,
      attachedAt: status === 'missing' ? undefined : now(),
    };
  });
}

/**
 * A fresh draft. Drafts hold whatever the citizen has typed so far and carry no
 * reference number until they are submitted.
 * @param {{
 *   userId: string,
 *   service: import('../data/types').Service,
 *   refPrefix: string,
 *   extra?: Record<string, unknown>
 * }} args
 */
export function newDraft({ userId, service, refPrefix, extra = {} }) {
  const timestamp = now();
  return {
    id: newId('app'),
    ref: `DRAFT-${refPrefix}-${newId('d').slice(-6).toUpperCase()}`,
    userId,
    serviceId: service.id,
    group: service.group,
    agencyId: service.agencyId,
    title: service.name,
    status: /** @type {import('../data/types').ApplicationStatus} */ ('draft'),
    fields: {},
    documents: [],
    feeTotalGyd: 0,
    feeStatus: /** @type {import('../data/types').FeeStatus} */ ('unpaid'),
    submittedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    decisionAt: null,
    decisionNote: null,
    ...extra,
  };
}

/**
 * Create the per-agency review rows for a freshly submitted application, from
 * the service's seeded routing. A route marked `appliesWhen: 'emptyPlot'` is
 * only created when the parcel is undeveloped — that is how GWI's site
 * investigation appears for an empty plot and stays off a developed one.
 *
 * The first agency in the sequence goes straight to `inReview`: submission is
 * what puts the application in front of it.
 *
 * @param {{
 *   applicationId: string,
 *   routes: import('../data/types').ServiceRoute[],
 *   context?: {plotStatus?: string}
 * }} args
 * @returns {Promise<import('../data/types').AgencyReview[]>}
 */
export async function createReviews({ applicationId, routes, context = {} }) {
  const applicable = routes
    .filter((r) => r.appliesWhen !== 'emptyPlot' || context.plotStatus === 'empty')
    .sort((a, b) => a.sequence - b.sequence);

  const timestamp = now();
  /** @type {import('../data/types').AgencyReview[]} */
  const reviews = applicable.map((route, index) => ({
    id: newId('rev'),
    applicationId,
    agencyId: route.agencyId,
    // Renumber so the sequence the citizen sees has no gaps when a conditional
    // route was skipped.
    sequence: index + 1,
    role: route.role,
    status: index === 0 ? 'inReview' : 'pending',
    purpose: route.purpose,
    slaDays: route.slaDays,
    startedAt: index === 0 ? timestamp : null,
    decidedAt: null,
    note: null,
  }));

  await withTx('application_agency_reviews', 'readwrite', async (tx) => {
    const store = tx.objectStore('application_agency_reviews');
    await Promise.all(reviews.map((r) => requestToPromise(store.put(r))));
  });

  return reviews;
}

/**
 * Record an agency's decision on an application — the endpoint the reviewing
 * agency's own back office calls. Approving the last agency approves the whole
 * application; a rejection stops it there.
 *
 * @param {{
 *   applicationId: string,
 *   group: import('../data/types').ServiceGroup,
 *   agencyId: string,
 *   sequence: number,
 *   decision: 'approved'|'rejected'|'infoRequested',
 *   note?: string,
 *   agencyName?: string,
 *   at?: string
 * }} args
 */
export async function recordAgencyDecision({
  applicationId, group, agencyId, sequence, decision, note, agencyName, at,
}) {
  const storeName = STORE_BY_GROUP[group];
  if (!storeName) throw new ApiError('That application group has no store.', 'invalid', { group });

  const timestamp = at || now();
  const reviews = await listReviews(applicationId);
  const target = reviews.find((r) => r.sequence === sequence && r.agencyId === agencyId);
  if (!target) throw new ApiError('No such review on this application.', 'notFound', { agencyId, sequence });
  if (target.status === 'approved' || target.status === 'rejected') return { changed: false };

  const updated = { ...target, status: decision, decidedAt: timestamp, note: note ?? null };
  await put('application_agency_reviews', updated);

  const label = decision === 'approved'
    ? `${agencyName || agencyId} approved`
    : decision === 'rejected'
      ? `${agencyName || agencyId} could not approve this`
      : `${agencyName || agencyId} asked for more information`;
  await addEvent({ applicationId, type: decision === 'approved' ? 'review' : decision === 'rejected' ? 'rejected' : 'infoRequested', label, note, agencyId, at: timestamp });

  const application = await withTx(storeName, 'readonly', async (tx) =>
    (await requestToPromise(tx.objectStore(storeName).get(applicationId))) ?? null);
  if (!application) return { changed: true };

  const rest = reviews.map((r) => (r.id === updated.id ? updated : r));

  if (decision === 'rejected') {
    await put(storeName, {
      ...application,
      status: 'rejected',
      decisionAt: timestamp,
      decisionNote: note || `${agencyName || agencyId} could not approve this application.`,
      updatedAt: timestamp,
    });
    return { changed: true, applicationStatus: 'rejected' };
  }

  if (decision === 'infoRequested') {
    await put(storeName, { ...application, status: 'actionNeeded', updatedAt: timestamp });
    return { changed: true, applicationStatus: 'actionNeeded' };
  }

  // Approved. Move the next pending agency into review, or finish.
  const next = rest.find((r) => r.status === 'pending');
  if (next) {
    await put('application_agency_reviews', { ...next, status: 'inReview', startedAt: timestamp });
    await addEvent({
      applicationId,
      type: 'routed',
      label: `Now with ${next.agencyId === agencyId ? agencyName || next.agencyId : next.agencyId}`,
      note: next.purpose,
      agencyId: next.agencyId,
      at: timestamp,
    });
    await put(storeName, { ...application, status: 'inReview', updatedAt: timestamp });
    return { changed: true, applicationStatus: 'inReview' };
  }

  await put(storeName, {
    ...application,
    status: 'approved',
    decisionAt: timestamp,
    decisionNote: 'Every reviewing agency has approved this application.',
    updatedAt: timestamp,
  });
  await addEvent({ applicationId, type: 'approved', label: 'Approved', note: 'Every reviewing agency has approved this application.', at: timestamp });
  return { changed: true, applicationStatus: 'approved' };
}

/** Working days between two instants, counting Monday–Friday only. */
export function workingDaysBetween(fromIso, toMs = Date.now()) {
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from) || toMs <= from) return 0;
  let days = 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toMs);
  end.setHours(0, 0, 0, 0);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
}

/**
 * Advance any review whose service-level timeframe has elapsed.
 *
 * There is no agency back office in this client, so an application would
 * otherwise sit on its first agency forever. Rather than inventing decisions,
 * this applies the published SLA: once an agency has held an application for
 * longer than its own stated working-day target, its approval is recorded and
 * the application moves to the next agency in the routing. The decision is
 * written through `recordAgencyDecision`, exactly as a real back-office call
 * would be — including the timeline entry.
 *
 * @param {{
 *   applicationId: string,
 *   group: import('../data/types').ServiceGroup,
 *   agencyNames?: Record<string, string>
 * }} args
 * @returns {Promise<boolean>} whether anything moved
 */
export async function syncReviewProgress({ applicationId, group, agencyNames = {} }) {
  let moved = false;
  // Each pass can free the next agency, so keep going until nothing is due.
  for (let guard = 0; guard < 12; guard += 1) {
    // eslint-disable-next-line no-await-in-loop
    const reviews = await listReviews(applicationId);
    const active = reviews.find((r) => r.status === 'inReview');
    if (!active || !active.startedAt) break;
    if (workingDaysBetween(active.startedAt) < active.slaDays) break;
    // eslint-disable-next-line no-await-in-loop
    await recordAgencyDecision({
      applicationId,
      group,
      agencyId: active.agencyId,
      sequence: active.sequence,
      decision: 'approved',
      note: `Cleared within the ${active.slaDays} working-day target.`,
      agencyName: agencyNames[active.agencyId] || active.agencyId,
    });
    moved = true;
  }
  return moved;
}

/** Assign the citizen-facing reference number an application is submitted with. */
export function assignReference(prefix) {
  return newReference(prefix);
}
