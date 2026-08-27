import Icon from '../ui/Icon';
import StatusPill from '../ui/StatusPill';
import { useAppState } from '../../state/AppStateContext';
import { useMyApplications, openTargetFor } from '../../hooks/useMyApplications';
import { Card, LoadingState, EmptyState } from './ServicePieces';
import DocumentProgress from './DocumentProgress';
import { formatDate, formatRelativeDate } from '../../lib/format';

// A compact list of everything the signed-in citizen has applied for, with the
// action that matters for each row — resume a draft, track a live application,
// or open a certificate that is ready.
//
// Used in the profile sheet, above Your documents; the Applications tab shows
// the same data in full.

/**
 * @param {{
 *   limit?: number,
 *   onNavigate?: () => void   called before an overlay opens, so a host sheet can close itself
 * }} props
 */
export default function MyApplicationsList({ limit, onNavigate }) {
  const { openOverlay, navigate } = useAppState();
  const { applications: all, loading } = useMyApplications();
  const rows = limit ? all.slice(0, limit) : all;

  const go = (fn) => { onNavigate?.(); fn(); };

  const openApplication = (app) => {
    const target = openTargetFor(app);
    go(() => openOverlay(target.overlay, target.payload));
  };

  if (loading) return <LoadingState label="Loading your applications…" />;

  if (all.length === 0) {
    return (
      <EmptyState
        icon="folder-open"
        title="No applications yet"
        body="Anything you apply for — a grant, a permit, a certificate — appears here so you can follow it and collect what it produces."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Card>
        {rows.map((app, i) => (
          <div
            key={app.id}
            style={{
              display: 'flex', flexDirection: 'column', gap: 10, padding: '13px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
            }}
          >
            <button
              className="press focus-ring"
              onClick={() => openApplication(app)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
                border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span aria-hidden="true" style={{
                width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)',
                background: `color-mix(in oklch, ${app.agencyMark} 14%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={app.icon} size={16} color={app.agencyMark} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, lineHeight: 1.35, color: 'var(--fg-1)' }}>
                  {app.title}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>
                  {app.agencyShortName}
                  {app.status === 'draft' ? ' · Draft' : app.submittedAt ? ` · ${formatDate(app.submittedAt)}` : ''}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-4)' }}>
                  {app.status === 'draft' ? 'Not yet submitted' : app.ref}
                </span>
              </span>
              <StatusPill tone={app.tone}>{app.statusLabel}</StatusPill>
            </button>

            {/* Documents by name, so what is still outstanding is visible here */}
            {app.documentSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
                  Documents · {app.documentSummary.done} of {app.documentSummary.total}
                </span>
                <DocumentProgress documents={app.documents} compact />
              </div>
            )}

            {/* The actions available on this row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <RowAction
                icon={app.status === 'draft' ? 'pen-line' : 'eye'}
                label={app.status === 'draft' ? 'Resume' : 'View'}
                accent={app.agencyMark}
                onClick={() => openApplication(app)}
              />
              {app.status !== 'draft' && (
                <RowAction
                  icon="route"
                  label="Track"
                  onClick={() => { const t = openTargetFor(app); go(() => openOverlay(t.overlay, t.payload)); }}
                />
              )}
              {app.hasCertificate && (
                <RowAction
                  icon="download"
                  label="Certificate"
                  accent="var(--status-success)"
                  onClick={() => go(() => openOverlay('groCertificate', { requestId: app.id }))}
                />
              )}
            </div>

            <span style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>Updated {formatRelativeDate(app.updatedAt)}</span>
          </div>
        ))}
      </Card>

      {limit && all.length > limit && (
        <button
          className="press focus-ring"
          onClick={() => go(() => navigate('applications'))}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', minHeight: 44,
            border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', background: 'var(--surface-1)',
            color: 'var(--fg-1)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          See all {all.length} applications
          <Icon name="chevron-right" size={15} color="var(--fg-3)" />
        </button>
      )}
    </div>
  );
}

function RowAction({ icon, label, accent, onClick }) {
  const color = accent || 'var(--fg-2)';
  return (
    <button
      className="press focus-ring"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 34, padding: '0 12px',
        border: '1px solid var(--surface-border)', borderRadius: 999, background: 'var(--surface-1)',
        color, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <Icon name={icon} size={13} color={color} />
      {label}
    </button>
  );
}
