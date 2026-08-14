import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';
import { GPL_TICKETS } from '../../state/mockData';

// GPL_TICKETS only carries { id, title, status, date } — everything else
// here (reference number, detail copy, step timeline) is derived/invented
// locally so the claim card has something to show.
function enrichTicket(t) {
  const resolved = t.status === 'Resolved';
  const icon = /outage|power/i.test(t.title) ? 'zap-off' : 'clipboard-list';
  const ref = `GPL-CLM-${t.id.replace(/\D/g, '') || '0001'}`;
  const steps = resolved
    ? [
        { label: 'Report received', note: t.date, state: 'done' },
        { label: 'Site assessment', note: 'Technician visit completed', state: 'done' },
        { label: 'Resolved', note: t.date, state: 'done' },
      ]
    : [
        { label: 'Report received', note: t.date, state: 'done' },
        { label: 'Crew dispatched', note: 'In progress', state: 'current' },
        { label: 'Power restored', note: '', state: 'todo' },
      ];
  return {
    ...t,
    icon,
    ref,
    resolved,
    detail: resolved
      ? `Resolved by GPL. ${t.title} has been closed out — no further action needed.`
      : `GPL is working on ${t.title.toLowerCase()}. You'll see updates here as the crew makes progress.`,
    steps,
  };
}

export default function GplClaims() {
  const { isOpen, closeOverlay, openOverlay } = useAppState();
  const open = isOpen('gplClaims');
  const tickets = GPL_TICKETS.map(enrichTicket);

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('gplClaims')}
      agency="gpl"
      title="Claims and reports"
      subtitle={`${tickets.filter((t) => !t.resolved).length} open with GPL`}
    >
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 8px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--agency-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Icon name="clipboard-list" size={24} color="var(--agency-accent-strong)" />
          </div>
          <div className="ds-h3" style={{ marginBottom: 6 }}>No claims or reports yet</div>
          <p className="ds-body" style={{ color: 'var(--fg-3)', marginBottom: 18 }}>
            Anything you report to GPL will show up here so you can follow along.
          </p>
          <Button onClick={() => { closeOverlay('gplClaims'); openOverlay('gplOutage'); }}>
            Report an outage
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tickets.map((t) => (
            <div key={t.id} style={{
              border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)',
              padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  width: 38, height: 38, flexShrink: 0, borderRadius: 12,
                  background: t.resolved ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={t.icon} size={18} color={t.resolved ? 'var(--status-success)' : 'var(--status-info)'} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>{t.title}</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--fg-3)' }}>{t.ref} · {t.date}</span>
                </span>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 999,
                  background: t.resolved ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                  color: t.resolved ? 'var(--status-success)' : 'var(--status-info)',
                }}>
                  {t.status}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{t.detail}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 2 }}>
                {t.steps.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span aria-hidden="true" style={{
                      width: 12, height: 12, flexShrink: 0, marginTop: 3, borderRadius: 999,
                      background: st.state === 'done' ? 'var(--agency-accent)' : st.state === 'current' ? 'var(--surface-1)' : 'var(--surface-4)',
                      border: st.state === 'current' ? '2px solid var(--agency-accent)' : '2px solid transparent',
                    }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: st.state === 'todo' ? 'var(--fg-4)' : 'var(--fg-1)' }}>{st.label}</span>
                      {st.note && <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-3)' }}>{st.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageOverlay>
  );
}
