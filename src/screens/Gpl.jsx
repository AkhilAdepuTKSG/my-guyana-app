import { useState } from 'react';
import HubHeader from '../components/shell/HubHeader';
import ListRow from '../components/ui/ListRow';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useAppState } from '../state/AppStateContext';
import { GPL_TICKETS } from '../state/mockData';
import { GPL_METER, GPL_ADDRESS, formatGyd, formatDue, billPeriodLabel } from '../overlays/gpl/gplShared';

const GPL_ACTIONS = [
  { id: 'pay', icon: 'receipt', label: 'Pay a bill', hint: 'Card, bank or mobile money', key: 'gplPay' },
  { id: 'usage', icon: 'gauge', label: 'Track consumption', hint: 'Your monthly kWh and trend', key: 'gplUsage' },
  { id: 'outage', icon: 'zap-off', label: 'Report an outage', hint: 'No power, low voltage or a damaged line', key: 'gplOutage' },
  { id: 'claims', icon: 'clipboard-list', label: 'Track claims and reports', hint: 'Where each report stands', key: 'gplClaims' },
];

export default function Gpl() {
  const { persona, openOverlay, navigate } = useAppState();
  const [tab, setTab] = useState('overview');
  const gpl = persona.gpl;

  if (!gpl) {
    return (
      <div data-agency="gpl">
        <HubHeader title="GPL" subtitle="Guyana Power & Light" />
        <div style={{ textAlign: 'center', padding: '54px 10px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--agency-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
          }}>
            <Icon name="zap-off" size={28} color="var(--agency-accent-strong)" />
          </div>
          <div className="ds-h3" style={{ marginBottom: 8 }}>No GPL account linked</div>
          <p className="ds-body" style={{ color: 'var(--fg-3)', marginBottom: 22 }}>
            Add your electricity account to pay bills, track usage and report outages, all from here.
          </p>
          <Button fullWidth onClick={() => openOverlay('onboard', { agency: 'gpl', intent: 'new' })}>
            Add GPL account
          </Button>
        </div>
      </div>
    );
  }

  const paid = gpl.status === 'paid';
  const period = billPeriodLabel(gpl.dueDate);
  const kwhUsed = gpl.usageKwh?.[gpl.usageKwh.length - 1];
  const tickets = GPL_TICKETS;

  return (
    <div data-agency="gpl">
      <HubHeader title="GPL" subtitle={`GPL · ${gpl.account}`} tab={tab} onTabChange={setTab} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {tab === 'overview' && (
          <div style={{
            borderRadius: 20, padding: 20, color: '#fff', display: 'flex', flexDirection: 'column', gap: 18,
            background: 'linear-gradient(160deg, #2d2e67 0%, #404293 60%, #2d2e67 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="zap" size={18} color="#fff" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                  {paid ? `Paid · ${period}` : `Current bill · ${period}`}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: '#fff' }}>
                  {formatGyd(gpl.balance)}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  {paid ? `Paid today · nothing due for ${period}` : `Due ${formatDue(gpl.dueDate)} · ${kwhUsed} kWh used`}
                </p>
              </div>
            </div>

            {!paid ? (
              <button
                className="press focus-ring"
                onClick={() => openOverlay('gplPay')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 50,
                  border: 'none', borderRadius: 14, background: '#fff', color: '#2d2e67', padding: '0 16px',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>Pay this bill</span>
                <Icon name="arrow-right" size={18} color="#2d2e67" />
              </button>
            ) : (
              <button
                className="press focus-ring"
                onClick={() => navigate('wallet')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 50,
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 14, background: 'rgba(255,255,255,0.12)',
                  color: '#fff', padding: '0 16px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                }}
              >
                <Icon name="check-circle-2" size={18} color="#fff" />
                <span style={{ flex: 1, textAlign: 'left' }}>See your receipt</span>
                <Icon name="arrow-right" size={18} color="#fff" />
              </button>
            )}

            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              <span>{GPL_METER}</span>
              <span aria-hidden="true">·</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{GPL_ADDRESS}</span>
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 className="ds-eyebrow" style={{ margin: 0 }}>What you can do</h2>
            <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
              {GPL_ACTIONS.map((a) => (
                <ListRow
                  key={a.id}
                  icon={a.icon}
                  title={a.label}
                  subtitle={a.hint}
                  onClick={() => openOverlay(a.key)}
                  style={{ padding: '13px 14px', borderBottom: '1px solid var(--surface-hairline)' }}
                />
              ))}
            </div>
          </div>
        )}

        {tickets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 className="ds-eyebrow" style={{ margin: 0 }}>Open reports and claims</h2>
            {tickets.map((t) => {
              const resolved = t.status === 'Resolved';
              return (
                <button
                  key={t.id}
                  className="press focus-ring"
                  onClick={() => openOverlay('gplClaims')}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--surface-border)',
                    borderRadius: 18, background: 'var(--surface-1)', padding: 15, display: 'flex',
                    alignItems: 'center', gap: 12,
                  }}
                >
                  <span style={{
                    width: 38, height: 38, flexShrink: 0, borderRadius: 12,
                    background: resolved ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={resolved ? 'check-circle-2' : 'zap-off'} size={18} color={resolved ? 'var(--status-success)' : 'var(--status-info)'} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{t.title}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-3)' }}>{t.status} · {t.date}</span>
                  </span>
                  <Icon name="chevron-right" size={17} color="var(--fg-3)" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
