import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import Surface from '../components/ui/Surface';
import StatusPill from '../components/ui/StatusPill';
import StepProgress from '../components/ui/StepProgress';
import Button from '../components/ui/Button';
import { useApi, useUserId } from '../hooks/useApi';
import { listAll, partitionByProgress } from '../api/applications';
import { LoadingState, ErrorState } from '../components/service/ServicePieces';
import DocumentProgress from '../components/service/DocumentProgress';
import { formatDate, formatRelativeDate } from '../lib/format';

// Everything the citizen has applied for, across all three services, read
// through the one unified endpoint — the screen never has to know which table a
// row came from.

export default function Applications() {
  const { navigate, openOverlay } = useAppState();
  const userId = useUserId();
  const { data, loading, error, reload } = useApi(() => listAll(userId), [userId], { enabled: !!userId, initial: [] });
  const applications = data || [];
  // Live applications lead; finished ones drop into History below, so the
  // screen answers "what is waiting on me" before "what have I ever done".
  const { active, history } = partitionByProgress(applications);

  const openApplication = (app) => {
    if (app.status === 'draft') {
      openOverlay('serviceApply', { serviceId: app.serviceId, applicationId: app.id });
      return;
    }
    if (app.group === 'gro' && app.status === 'approved') {
      openOverlay('groCertificate', { requestId: app.id });
      return;
    }
    openOverlay('serviceTrack', { group: app.group, id: app.id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="press focus-ring"
          onClick={() => navigate('home')}
          aria-label="Back"
          style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Icon name="chevron-left" size={18} color="var(--fg-1)" />
        </button>
        <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--fg-1)' }}>My Applications</h1>
        {applications.length > 0 && (
          <button
            className="press focus-ring"
            onClick={reload}
            aria-label="Refresh"
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon name="refresh-cw" size={16} color="var(--fg-2)" />
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading your applications…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} title="We could not load your applications" />
      ) : applications.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', padding: '44px 24px' }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            <Icon name="folder-open" size={21} color="currentColor" />
          </span>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>No applications yet</p>
          <p style={{ margin: 0, fontSize: 'var(--text-2xs)', lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 270 }}>
            Anything you apply for — a cash grant, a building permit, a certificate — appears here so you can follow it end to end.
          </p>
          <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => navigate('services')}>
            Browse services
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {active.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <GroupHeading label="In progress" count={active.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {active.map((app) => (
                  <ApplicationCard key={app.id} app={app} onOpen={() => openApplication(app)} />
                ))}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <GroupHeading label="History" count={history.length} />
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>
                Applications that have been decided. Everything you submitted, and what came of it — you can still open
                any of them and download anything they produced.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {history.map((app) => (
                  <ApplicationCard key={app.id} app={app} onOpen={() => openApplication(app)} history />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** Group label with a count — "In progress · 2", "History · 3". */
function GroupHeading({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h2 style={{
        margin: 0, flex: 1, minWidth: 0,
        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)',
      }}>
        {label}
      </h2>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--fg-4)' }}>{count}</span>
    </div>
  );
}

/**
 * One application. A decided one is shown a little quieter and leads with its
 * outcome and date rather than with progress, because there is nothing left to
 * follow — but it stays openable, since the certificate or award lives inside.
 */
function ApplicationCard({ app, onOpen, history }) {
  return (
    <Surface
      interactive
      onClick={onOpen}
      style={{
        padding: 16, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer',
        background: history ? 'var(--surface-2)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span aria-hidden="true" style={{
          width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--radius-md)',
          background: `color-mix(in oklch, ${app.agencyMark} 14%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={app.icon} size={17} color={app.agencyMark} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--fg-1)' }}>{app.title}</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--fg-3)' }}>
            {app.agencyShortName}
            {app.status === 'draft'
              ? ' · Draft, not submitted'
              : app.submittedAt ? ` · Submitted ${formatDate(app.submittedAt)}` : ''}
          </span>
          {app.subtitle && (
            <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-4)' }}>{app.subtitle}</span>
          )}
        </span>
        <StatusPill tone={app.tone}>{app.statusLabel}</StatusPill>
      </div>

      {!history && <StepProgress step={app.step} total={app.totalSteps} color={app.agencyMark} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>
          {app.status === 'draft' ? 'Not yet submitted' : app.ref}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: app.agencyMark }}>
          {app.actionLabel}
          <Icon name="chevron-right" size={14} color="currentColor" />
        </span>
      </div>

      {/* Documents by name, so an outstanding one is readable here rather than
          only after opening the application. */}
      {app.documentSummary && !history && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Documents · {app.documentSummary.done} of {app.documentSummary.total}
          </span>
          <DocumentProgress documents={app.documents} compact />
          {app.documentSummary.outstanding.length > 0 && (
            <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--status-warning)', fontWeight: 700 }}>
              Still needed: {app.documentSummary.outstanding.join(', ')}
            </span>
          )}
        </div>
      )}

      {app.status === 'actionNeeded' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--status-warning-bg)' }}>
          <Icon name="triangle-alert" size={14} color="var(--status-warning)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)' }}>An agency needs something from you</span>
        </div>
      )}

      {app.hasCertificate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--status-success-bg)' }}>
          <Icon name="file-badge" size={14} color="var(--status-success)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)' }}>Your certificate is ready to view and download</span>
        </div>
      )}

      <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>
        {history ? 'Decided' : 'Updated'} {formatRelativeDate(app.updatedAt)}
      </span>
    </Surface>
  );
}
