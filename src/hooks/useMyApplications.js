import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useApi, useUserId } from './useApi';
import { listAll, statusTone } from '../api/applications';
import { AGENCIES } from '../state/mockData';

// ONE list of everything the citizen has applied for.
//
// The newer services (cash grants, Single Window, GRO certificates) live in the
// api layer and are read through listAll(); the e-ID enrolment booked at
// sign-up and the passport application still live in the app context. Every
// screen that shows "my applications" — the Applications tab, Home, Ask Gov —
// reads this merge, so an application can never go missing because of which
// store it was written to.

const LEGACY_ICONS = { eid: 'fingerprint', passport: 'plane', cashGrant: 'banknote' };

// The older flows store a free-text status ("Appointment booked", "Approved —
// card ready…"); fold it onto the api layer's status enum so grouping, tones
// and Ask Gov's phrasing work the same for every row.
function normaliseStatus(s = '') {
  const t = String(s).toLowerCase();
  if (t.includes('approv') || t.includes('issued') || t.includes('ready') || t.includes('complete')) return 'approved';
  if (t.includes('reject') || t.includes('denied') || t.includes('disallow')) return 'rejected';
  if (t.includes('action') || t.includes('missing') || t.includes('waiting on')) return 'actionNeeded';
  if (t.includes('review')) return 'inReview';
  return 'submitted';
}

function legacyDocuments(docs = []) {
  return docs.map((d, i) => {
    const s = String(d.status || '').toLowerCase();
    const required = s !== 'optional';
    let status = 'missing';
    if (s === 'uploaded' || s === 'applied for') status = /vault/i.test(d.file || '') ? 'fromVault' : 'attached';
    else if (!required) status = 'optional';
    return { docId: d.id || `doc-${i}`, label: d.name, required, status };
  });
}

function summarise(documents) {
  if (!documents.length) return null;
  const required = documents.filter((d) => d.required);
  const isIn = (d) => d.status === 'attached' || d.status === 'fromVault';
  return {
    done: required.filter(isIn).length,
    total: required.length,
    outstanding: required.filter((d) => !isIn(d)).map((d) => d.label),
    extras: 0,
  };
}

/** A context application (e-ID, passport) in the api layer's ApplicationSummary shape. */
export function toSummary(a) {
  const agency = AGENCIES[a.agency] || {};
  const status = normaliseStatus(a.status);
  const documents = legacyDocuments(a.documents);
  const key = a.serviceId || a.type || a.id;
  return {
    id: a.id,
    ref: a.ref || `MG-${String(a.id).toUpperCase()}`,
    group: 'legacy',
    serviceId: key,
    type: a.type,
    title: a.title,
    agencyId: a.agency,
    agencyShortName: agency.shortName || String(a.agency || '').toUpperCase(),
    agencyMark: agency.mark || 'var(--brand-600)',
    icon: LEGACY_ICONS[key] || agency.icon || 'file-text',
    status,
    statusLabel: a.status || 'Submitted', // keep the flow's own wording
    tone: statusTone(status),
    submittedAt: a.submittedOn || null,
    updatedAt: a.updatedAt || a.submittedOn || '',
    step: a.step || 1,
    totalSteps: a.totalSteps || 3,
    subtitle: a.eta ? `Expected ${a.eta}` : null,
    hasCertificate: false,
    certificateId: null,
    actionLabel: 'Track',
    documents,
    documentSummary: summarise(documents),
    legacy: a, // the original record — what the legacy tracking page renders
  };
}

/** Where opening this row should land, whichever store it came from. */
export function openTargetFor(app) {
  if (app.group === 'legacy') return { overlay: 'track', payload: app.legacy };
  if (app.status === 'draft') return { overlay: 'serviceApply', payload: { serviceId: app.serviceId, applicationId: app.id } };
  if (app.group === 'gro' && app.status === 'approved') return { overlay: 'groCertificate', payload: { requestId: app.id } };
  return { overlay: 'serviceTrack', payload: { group: app.group, id: app.id } };
}

/**
 * @param {boolean} [active] re-read whenever this turns true
 */
export function useMyApplications(active = true) {
  const { applications: legacy } = useAppState();
  const userId = useUserId();
  // `active` is a dependency on purpose. The screens that read this are mounted
  // for the life of the app and only render when their overlay opens, so a
  // fetch that ran once at start-up would never see an application submitted
  // afterwards — and the service screen would go on offering "Apply".
  const api = useApi(() => listAll(userId), [userId, active], { enabled: !!userId && active, initial: [] });
  const applications = useMemo(() => {
    const rows = [...(api.data || []), ...(legacy || []).map(toSummary)];
    return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [api.data, legacy]);
  return { applications, loading: api.loading, error: api.error, reload: api.reload };
}
