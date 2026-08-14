import { useAppState } from '../state/AppStateContext';
import { AGENCIES, ONGOING_APPLICATIONS } from '../state/mockData';
import Icon from '../components/ui/Icon';
import Surface from '../components/ui/Surface';
import StatusPill from '../components/ui/StatusPill';
import StepProgress from '../components/ui/StepProgress';
import Button from '../components/ui/Button';

// Loose status → pill tone mapping. Ongoing applications in mock data use
// free-form labels ("In review", "Action needed", ...) rather than a fixed
// enum, so this matches on keywords the way the source design's tone map did.
function toneFor(status = '') {
  const s = status.toLowerCase();
  if (s.includes('action') || s.includes('missing')) return 'warning';
  if (s.includes('approv') || s.includes('issued') || s.includes('complete')) return 'success';
  if (s.includes('reject') || s.includes('disallow') || s.includes('denied')) return 'error';
  return 'info';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Applications() {
  const { navigate, openOverlay } = useAppState();
  const applications = ONGOING_APPLICATIONS;

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
      </div>

      {applications.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', padding: '44px 24px' }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            <Icon name="folder-open" size={21} color="currentColor" />
          </span>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>No applications yet</p>
          <p style={{ margin: 0, fontSize: 'var(--text-2xs)', lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 260 }}>
            Anything you apply for — a benefit, a document, your e-ID — will appear here so you can follow it end to end.
          </p>
          <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => navigate('services')}>
            Browse services
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {applications.map((app) => {
            const agency = AGENCIES[app.agency];
            const tone = toneFor(app.status);
            return (
              <Surface
                key={app.id}
                interactive
                onClick={() => openOverlay('track', { id: app.id })}
                style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>{app.title}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--fg-3)' }}>
                      {agency?.shortName || app.agency} · Submitted {formatDate(app.submittedOn)}
                    </span>
                  </span>
                  <StatusPill tone={tone}>{app.status}</StatusPill>
                </div>
                <StepProgress step={app.step} total={app.totalSteps} color={agency?.mark || 'var(--agency-accent)'} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    Step {app.step} of {app.totalSteps}
                  </span>
                  {app.eta && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)' }}>Expected {app.eta}</span>
                  )}
                </div>
                {app.pendingActions?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--status-warning-bg)' }}>
                    <Icon name="triangle-alert" size={14} color="var(--status-warning)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>{app.pendingActions[0].label}</span>
                  </div>
                )}
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
