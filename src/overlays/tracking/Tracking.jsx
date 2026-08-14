import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, ONGOING_APPLICATIONS, APPOINTMENTS } from '../../state/mockData';

// Loose status -> tone mapping, same keyword approach the Applications list
// uses (mock statuses are free-form strings, not a fixed enum).
function toneFor(status = '') {
  const s = status.toLowerCase();
  if (s.includes('action') || s.includes('missing')) return 'warning';
  if (s.includes('approv') || s.includes('issued') || s.includes('complete')) return 'success';
  if (s.includes('reject') || s.includes('disallow') || s.includes('denied')) return 'error';
  return 'info';
}

const TONE = {
  success: { color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  warning: { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  error: { color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
  info: { color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
};

// Per-document status badge -> tone. "On file" gets its own neutral/agency
// treatment rather than a status color, matching the source design.
const DOC_TONE = { Missing: 'warning', Requested: 'info', Uploaded: 'success' };
const DOC_ACTIONABLE = new Set(['Missing', 'Requested']);

function formatDate(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Extra display-only metadata the mock ONGOING_APPLICATIONS records don't
// carry (reference numbers, a fuller timeline, whether this is the
// special-cased MoPS e-ID flow). Anything not listed here falls back to a
// generic timeline built from step/totalSteps.
const TRACK_META = {
  'app-eid-1': {
    ref: 'MOPS-EID-2026-40218',
    isMopsEid: true,
    timeline: [
      { label: 'Application submitted', note: 'Aug 2, 2026', state: 'done' },
      { label: 'Service Centre visit', note: 'Booked — attend to continue', state: 'current' },
      { label: 'Identity verified', note: '', state: 'todo' },
      { label: 'e-ID issued', note: '', state: 'todo' },
    ],
    // Not present in the shared mock (its pendingActions is []) — this is
    // the "special-cased copy for a MoPS e-ID item" the source design has,
    // synthesized here since it's specific to this flow, not generic data.
    extraPendingActions: [{
      title: 'Attend your enrolment visit',
      desc: 'Bring your original documents to your appointment. Your photo and fingerprints are captured there.',
      tone: 'info', icon: 'calendar-check', kind: 'appt',
    }],
  },
  'app-nis-1': {
    ref: 'NIS-RG-2026-00214',
    isMopsEid: false,
    timeline: [
      { label: 'Registration submitted', note: 'Aug 9, 2026', state: 'done' },
      { label: 'Employer / document check', note: 'Waiting on a document from you', state: 'current' },
      { label: 'NIS number issued', note: '', state: 'todo' },
    ],
  },
};

function genericTimeline(app) {
  const base = ['Submitted', 'In review', 'Decision', 'Completed'];
  const labels = base.slice(0, Math.max(app.totalSteps, 1));
  while (labels.length < app.totalSteps) labels.push(`Step ${labels.length + 1}`);
  return labels.map((label, i) => {
    const n = i + 1;
    const state = n < app.step ? 'done' : n === app.step ? 'current' : 'todo';
    let note = '';
    if (n === 1) note = app.submittedOn ? `Submitted ${formatDate(app.submittedOn)}` : '';
    else if (state === 'current' && app.eta) note = `Expected ${app.eta}`;
    return { label, note, state };
  });
}

// getPayload('track') carries whatever the caller passed — normally
// { id: 'app-eid-1' } (see screens/Applications.jsx), but a future flow
// (e.g. a freshly-submitted benefit claim not in the shared mock list)
// could hand over a full application-shaped object directly.
function resolveApp(payload) {
  if (payload && typeof payload === 'object') {
    if (payload.id) {
      const found = ONGOING_APPLICATIONS.find((a) => a.id === payload.id);
      if (found) return found;
    }
    if (payload.title) return payload;
  }
  return ONGOING_APPLICATIONS[0];
}

export default function Tracking() {
  const { isOpen, closeOverlay, openOverlay, navigate, showToast, getPayload } = useAppState();
  const open = isOpen('track');

  const [docOverrides, setDocOverrides] = useState({});
  const [uploadTarget, setUploadTarget] = useState(null); // document name, or null

  useEffect(() => {
    if (open) {
      setDocOverrides({});
      setUploadTarget(null);
    }
  }, [open]);

  const app = resolveApp(getPayload('track'));
  const meta = TRACK_META[app.id] || {};
  const agency = AGENCIES[app.agency] || {};
  const tone = toneFor(app.status);
  const toneColors = TONE[tone] || TONE.info;
  const isMopsEid = meta.isMopsEid ?? app.type === 'eid';
  const approved = tone === 'success';

  const documents = (app.documents || []).map((doc) => ({ ...doc, status: docOverrides[doc.name] || doc.status }));
  const hasDocs = documents.length > 0;
  const outstandingDoc = documents.find((d) => DOC_ACTIONABLE.has(d.status));

  const pendingActions = [
    ...(app.pendingActions || []).map((pa) => ({
      title: pa.label,
      desc: `${app.title} is waiting on this to continue.`,
      tone: 'warning',
      icon: /upload|document|proof/i.test(pa.label) ? 'upload' : 'triangle-alert',
      actionLabel: /upload/i.test(pa.label) ? 'Upload' : 'Resolve',
      run: () => {
        const match = documents.find((d) => pa.label.toLowerCase().includes(d.name.toLowerCase()));
        if (match) setUploadTarget(match.name);
        else showToast(pa.label);
      },
    })),
    ...((!approved && meta.extraPendingActions) || []).map((pa) => ({
      title: pa.title, desc: pa.desc, tone: pa.tone, icon: pa.icon, actionLabel: 'View appointment',
      run: () => {
        if (pa.kind !== 'appt') return;
        const appt = APPOINTMENTS.find((a) => a.agency === app.agency) || APPOINTMENTS[0];
        if (appt) openOverlay('apptDetail', { id: appt.id });
      },
    })),
  ];

  const timeline = meta.timeline || genericTimeline(app);

  let actionLabel;
  let doAction;
  if (outstandingDoc) {
    actionLabel = `Provide ${outstandingDoc.name}`;
    doAction = () => setUploadTarget(outstandingDoc.name);
  } else if (isMopsEid) {
    if (approved) {
      actionLabel = 'View e-ID in Wallet';
      doAction = () => { closeOverlay('track'); navigate('wallet'); openOverlay('eidCard'); };
    } else {
      actionLabel = 'View appointment details';
      doAction = () => {
        const appt = APPOINTMENTS.find((a) => a.agency === app.agency) || APPOINTMENTS[0];
        if (appt) openOverlay('apptDetail', { id: appt.id });
      };
    }
  } else if (app.type === 'nisReg' && approved) {
    actionLabel = 'View NIS card';
    doAction = () => { closeOverlay('track'); navigate('wallet'); openOverlay('nisCard'); };
  } else {
    actionLabel = 'View details';
    doAction = () => showToast('More details coming soon');
  }

  function confirmUpload() {
    if (!uploadTarget) return;
    setDocOverrides((prev) => ({ ...prev, [uploadTarget]: 'Uploaded' }));
    showToast(`Uploaded ${uploadTarget}`);
    setUploadTarget(null);
  }

  return (
    <>
      <PageOverlay
        open={open}
        onClose={() => closeOverlay('track')}
        title="Track application"
        headerRight={(
          <button
            className="press focus-ring"
            onClick={() => openOverlay('support')}
            aria-label="Support"
            style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon name="sparkles" size={17} color="#fff" />
          </button>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{
              width: 44, height: 44, borderRadius: 'var(--radius-lg)', flexShrink: 0,
              background: `${agency.mark || 'var(--agency-accent)'}1f`, color: agency.mark || 'var(--agency-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={agency.icon || 'file-text'} size={21} color="currentColor" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-3)' }}>
                {agency.shortName || app.agency} · {meta.ref || app.id.toUpperCase()}
              </span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 18, fontWeight: 800, color: 'var(--fg-1)' }}>{app.title}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, background: toneColors.bg }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>{app.status}</span>
            {app.eta && <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--fg-2)' }}>Expected {app.eta}</span>}
          </div>

          {pendingActions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0 }}>Pending actions</h3>
              {pendingActions.map((pa, i) => {
                const t = TONE[pa.tone] || TONE.warning;
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14,
                    background: t.bg, border: `1px solid color-mix(in oklch, ${t.color} 35%, transparent)`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Icon name={pa.icon} size={17} color={t.color} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{pa.title}</span>
                        <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{pa.desc}</span>
                      </div>
                    </div>
                    <button
                      className="press focus-ring"
                      onClick={pa.run}
                      style={{
                        alignSelf: 'flex-start', minHeight: 38, padding: '0 14px', borderRadius: 10,
                        border: `1px solid color-mix(in oklch, ${t.color} 45%, transparent)`, background: 'var(--surface-1)',
                        color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {pa.actionLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>Timeline</h3>
            <div className="surface" style={{ padding: '18px 16px', borderRadius: 18 }}>
              {timeline.map((st, i) => {
                const dotColor = st.state === 'done' ? (agency.mark || 'var(--agency-accent)') : st.state === 'current' ? 'var(--status-warning)' : 'var(--surface-4)';
                const lineColor = st.state === 'todo' ? 'var(--surface-4)' : 'var(--agency-accent-ring)';
                const hasLine = i < timeline.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                      <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 999, flexShrink: 0, background: dotColor }} />
                      {hasLine && <span aria-hidden="true" style={{ flex: 1, width: 2, minHeight: 20, background: lineColor }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 18 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: st.state === 'todo' ? 'var(--fg-3)' : 'var(--fg-1)' }}>{st.label}</span>
                      {st.note && <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>{st.note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasDocs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0 }}>Documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                {documents.map((doc, i) => {
                  const neutral = doc.status === 'On file';
                  const docTone = TONE[DOC_TONE[doc.status]] || TONE.info;
                  const actionable = DOC_ACTIONABLE.has(doc.status);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{doc.name}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, flexShrink: 0,
                          background: neutral ? 'var(--agency-accent-soft)' : docTone.bg,
                          color: neutral ? 'var(--agency-accent-strong)' : docTone.color,
                        }}>
                          {doc.status}
                        </span>
                      </div>
                      {actionable && (
                        <button
                          className="press focus-ring"
                          onClick={() => setUploadTarget(doc.name)}
                          style={{
                            alignSelf: 'flex-start', minHeight: 36, padding: '0 14px', borderRadius: 10,
                            border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
                            color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Provide this document
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button variant="outline" fullWidth onClick={doAction}>{actionLabel}</Button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--surface-hairline)' }}>
          <Button variant="outline" fullWidth icon={<Icon name="sparkles" size={16} />} onClick={() => openOverlay('askGov')}>
            Ask Gov
          </Button>
          <Button variant="outline" fullWidth icon={<Icon name="flag" size={16} />} onClick={() => showToast("Issue reported — we'll follow up.")}>
            Report issue
          </Button>
        </div>
      </PageOverlay>

      <Sheet open={!!uploadTarget} onClose={() => setUploadTarget(null)} title={uploadTarget ? `Provide ${uploadTarget}` : ''}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="press focus-ring"
            onClick={confirmUpload}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: 12,
              borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="camera" size={18} color="var(--agency-accent-strong)" />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Take a picture</span>
          </button>
          <button
            className="press focus-ring"
            onClick={confirmUpload}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: 12,
              borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="upload" size={18} color="var(--agency-accent-strong)" />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Upload a document</span>
          </button>
        </div>
      </Sheet>
    </>
  );
}
