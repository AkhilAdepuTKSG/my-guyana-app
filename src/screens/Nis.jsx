import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import HubHeader from '../components/shell/HubHeader';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import StatusPill from '../components/ui/StatusPill';
import { NIS_BENEFITS, NIS_ACTIVITY } from '../state/mockData';

// Local mock detail not carried on the shared persona object — invented
// placeholder numbers for the record-management + pension visuals.
const PENDING_STEPS = [
  { label: 'Submitted', note: '29 July 2026', state: 'done' },
  { label: 'Under review', note: 'NIS is checking your documents', state: 'current' },
  { label: 'Decision', note: 'Expected 1 August 2026', state: 'todo' },
  { label: 'Number issued', note: 'Emailed with a first-time PIN', state: 'todo' },
];

const NIS_YEAR = { label: '2026', done: 49, target: 50 };
const PENSION_SPLIT = { empPct: 40, firmPct: 60, empAmount: '$980,000', firmAmount: '$1,470,000', total: '$2,450,000' };
const PROJECTED_TOTAL = '$8,200,000';
const PROJECTION_POINTS = '4,80 78,72 152,76 226,42 296,16';
const PROJECTION_LABELS = ['Today', '5 yr', '10 yr', '15 yr', '20 yr'];

const RECORD_ACTIONS = [
  { id: 'contrib', icon: 'chart-column', label: 'View contributions', hint: 'Your full history', key: 'contribHistory' },
  { id: 'employer', icon: 'building-2', label: "View employer's information", hint: 'Your current employer on file', key: 'employerInfo' },
  { id: 'refund', icon: 'banknote', label: 'Request a refund', hint: 'If you paid too much', key: 'refund' },
  { id: 'appeal', icon: 'gavel', label: 'File an appeal', hint: 'Challenge a decision', key: 'appeal' },
];

function fmtGYD(n) {
  return '$' + n.toLocaleString();
}

export default function Nis() {
  const { persona, openOverlay, showToast } = useAppState();
  const [tab, setTab] = useState('overview');
  const [alertDismissed, setAlertDismissed] = useState(false);

  const status = persona.nisAccountState; // none | pending | active
  const isEmployerNotice = status === 'none' && persona.id === 'aaliyah';
  const weeks = persona.contributions?.weeks ?? 0;
  const weeksTarget = persona.contributions?.requiredWeeks ?? 750;
  const weeksPct = Math.max(0, Math.min(100, Math.round((weeks / weeksTarget) * 100)));
  const yearPct = Math.round((NIS_YEAR.done / NIS_YEAR.target) * 100);

  return (
    <div data-agency="nis" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <HubHeader
        title="NIS"
        subtitle={status === 'active' ? `Guyana NIS · ${persona.nisNumber}` : status === 'pending' ? 'Guyana NIS · Registration under review' : 'Guyana NIS · Not connected yet'}
        tab={status === 'active' ? tab : undefined}
        onTabChange={setTab}
      />

      {isEmployerNotice && (
        <button
          className="press focus-ring"
          onClick={() => openOverlay('empReg')}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid color-mix(in oklch, var(--status-warning) 38%, transparent)',
            borderRadius: 16, background: 'var(--status-warning-bg)', padding: 15, display: 'flex', alignItems: 'flex-start', gap: 12,
          }}
        >
          <span aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="building-2" size={17} color="var(--status-warning)" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>Your employer registered you with NIS</span>
            <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>Review the details and confirm they're correct.</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
              Review and confirm <Icon name="arrow-right" size={14} color="var(--fg-1)" />
            </span>
          </span>
        </button>
      )}

      {status === 'none' && (
        <div className="surface" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="link" size={21} color="var(--agency-accent-strong)" />
          </span>
          <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>Connect your NIS</h2>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
            NIS records the contributions that pay for sickness, maternity and pension benefits. Once it's connected, everything shows up here.
          </p>
          <Button fullWidth onClick={() => openOverlay('nisReg')}>Do you already have an NIS number?</Button>
        </div>
      )}

      {status === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: 'var(--status-warning-bg)', border: '1px solid color-mix(in oklch, var(--status-warning) 38%, transparent)' }}>
            <span aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="clock" size={17} color="var(--status-warning)" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Under review</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>Your registration is with NIS. Nothing else is needed from you right now.</span>
            </span>
          </div>
          <div className="surface" style={{ padding: 16, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row label="Reference" value="NIS-RG-2026-04482" />
            <div style={{ height: 1, background: 'var(--surface-hairline)' }} />
            <Row label="Decision expected" value="1 August 2026 · 48 to 72 hours" />
          </div>
          <div className="surface" style={{ padding: '18px 16px', borderRadius: 18 }}>
            {PENDING_STEPS.map((st, i) => (
              <div key={st.label} style={{ display: 'flex', gap: 13 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                  <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 999, flexShrink: 0, background: st.state === 'todo' ? 'var(--surface-4)' : 'var(--agency-accent)' }} />
                  {i < PENDING_STEPS.length - 1 && (
                    <span aria-hidden="true" style={{ flex: 1, width: 2, minHeight: 20, background: st.state === 'done' ? 'var(--agency-accent)' : 'var(--surface-4)' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: st.state === 'todo' ? 'var(--fg-3)' : 'var(--fg-1)' }}>{st.label}</div>
                  <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>{st.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}>
            <Icon name="mail" size={17} color="var(--fg-2)" />
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>We'll email your NIS number and a first-time PIN as soon as it's issued, and tell you here.</span>
          </div>
        </div>
      )}

      {status === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!alertDismissed && (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, padding: '13px 40px 13px 14px', borderRadius: 16, background: 'var(--status-error-bg)', border: '1px solid color-mix(in oklch, var(--status-error) 34%, transparent)' }}>
              <button className="press focus-ring" onClick={() => setAlertDismissed(true)} aria-label="Dismiss" style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="x" size={14} color="var(--fg-2)" />
              </button>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <span aria-hidden="true" style={{ width: 9, height: 9, flexShrink: 0, borderRadius: 999, background: 'var(--status-error)', marginTop: 4 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)' }}>Active · 1 contribution missing</span>
                  <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>Last contribution March 2026 · April has not been filed</span>
                </span>
              </div>
              <button className="press focus-ring" onClick={() => openOverlay('contribReview')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 14px', borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Review issue <Icon name="arrow-right" size={15} color="var(--fg-2)" />
              </button>
            </div>
          )}

          {tab === 'overview' && (
            <>
              <div className="surface" style={{ padding: '18px 16px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>Contributions this year</h2>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--agency-accent-strong)' }}>{NIS_YEAR.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div aria-hidden="true" style={{ position: 'relative', width: 96, height: 96, flexShrink: 0, borderRadius: 999, background: `conic-gradient(var(--agency-accent-strong) ${yearPct}%, #dde7e2 0)` }}>
                    <div style={{ position: 'absolute', inset: 11, borderRadius: 999, background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <span style={{ fontSize: 25, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1 }}>{NIS_YEAR.done}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>of {NIS_YEAR.target}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 16.5, fontWeight: 800, color: 'var(--agency-accent-strong)', lineHeight: 1.25 }}>One more to go</span>
                    <span style={{ display: 'block', marginTop: 5, fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)' }}>One contribution left to complete 2026. Everything else is on record.</span>
                  </div>
                </div>
              </div>

              <div className="surface" style={{ padding: '18px 16px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>Towards your pension</h2>
                  <span style={{ flexShrink: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--agency-accent-strong)' }}>{weeks} of {weeksTarget}</span>
                </div>
                <div aria-hidden="true" style={{ position: 'relative', height: 10, borderRadius: 999, background: '#dde7e2', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(90deg, var(--agency-accent) 0%, var(--agency-accent-strong) 100%)', width: `${weeksPct}%` }} />
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                  {weeks >= weeksTarget ? 'You have the contributions needed for the old age pension.' : `${weeksTarget - weeks} more contributions until you qualify for the old age pension.`}
                </span>
              </div>

              <div className="surface" style={{ padding: '18px 16px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>Pension breakdown</h2>
                  <Icon name="chart-pie" size={18} color="var(--agency-accent-strong)" />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Total contributed to date</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 31, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1 }}>{PENSION_SPLIT.total}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-2)' }}>GYD</span>
                  </span>
                </div>
                <div aria-hidden="true" style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#dde7e2' }}>
                  <span style={{ width: `${PENSION_SPLIT.empPct}%`, background: 'var(--agency-accent-strong)' }} />
                  <span style={{ flex: 1, background: 'var(--agency-accent)' }} />
                </div>
                <div style={{ display: 'flex', gap: 22 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>
                      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--agency-accent-strong)', flexShrink: 0 }} />You ({PENSION_SPLIT.empPct}%)
                    </span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 14, color: 'var(--fg-2)' }}>{PENSION_SPLIT.empAmount}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>
                      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--agency-accent)', flexShrink: 0 }} />Employers ({PENSION_SPLIT.firmPct}%)
                    </span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 14, color: 'var(--fg-2)' }}>{PENSION_SPLIT.firmAmount}</span>
                  </div>
                </div>
              </div>

              <div className="surface" style={{ padding: '18px 16px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>Projected pension value</h2>
                <div>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 31, fontWeight: 800, color: 'var(--agency-accent-strong)', lineHeight: 1 }}>{PROJECTED_TOTAL}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--agency-accent-strong)' }}>GYD</span>
                  </span>
                  <span style={{ display: 'block', marginTop: 5, fontSize: 14, color: 'var(--fg-2)' }}>At your current contribution rate</span>
                </div>
                <div aria-hidden="true" style={{ position: 'relative', height: 96 }}>
                  <svg viewBox="0 0 300 96" preserveAspectRatio="none" style={{ width: '100%', height: 96, display: 'block' }}>
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#e4eae7" strokeWidth="1" strokeDasharray="4 5" />
                    <line x1="0" y1="52" x2="300" y2="52" stroke="#e4eae7" strokeWidth="1" strokeDasharray="4 5" />
                    <line x1="0" y1="84" x2="300" y2="84" stroke="#e4eae7" strokeWidth="1" strokeDasharray="4 5" />
                    <polyline points={PROJECTION_POINTS} fill="none" stroke="#009b67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  {PROJECTION_LABELS.map((label) => (
                    <span key={label} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)' }}>{label}</span>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--surface-hairline)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: 13, borderRadius: 14, background: 'var(--agency-accent-soft)' }}>
                  <span aria-hidden="true" style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 999, background: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="lightbulb" size={16} color="var(--agency-accent-strong)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg-1)' }}>Adding $5,000 a month in voluntary contributions could raise your pension by about 35%.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 10.5, color: 'var(--fg-3)' }}>Recent activity</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {NIS_ACTIVITY.map((a) => (
                    <div key={a.id} className="surface" style={{ padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="receipt" size={19} color="var(--agency-accent-strong)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.title}</span>
                        <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-3)' }}>{a.subtitle}</span>
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{fmtGYD(a.amount)}</span>
                    </div>
                  ))}
                  <button
                    className="press focus-ring"
                    onClick={() => openOverlay('contribHistory')}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--agency-accent-strong)', padding: '6px 2px' }}
                  >
                    View full history →
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'services' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 10.5, color: 'var(--fg-3)' }}>Apply for a benefit</h2>
                <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
                  {NIS_BENEFITS.map((b, i) => (
                    <button
                      key={b.id}
                      className="press focus-ring"
                      onClick={() => openOverlay('benefit', { type: b.key })}
                      style={{
                        width: '100%', minHeight: 58, textAlign: 'left', cursor: 'pointer', border: 'none',
                        borderBottom: i < NIS_BENEFITS.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                        background: 'none', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <span aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={b.icon} size={17} color="var(--agency-accent-strong)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{b.name}</span>
                      <Icon name="chevron-right" size={17} color="var(--fg-3)" />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 10.5, color: 'var(--fg-3)' }}>Manage your record</h2>
                <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
                  {RECORD_ACTIONS.map((a, i) => (
                    <button
                      key={a.id}
                      className="press focus-ring"
                      onClick={() => openOverlay(a.key)}
                      style={{
                        width: '100%', minHeight: 58, textAlign: 'left', cursor: 'pointer', border: 'none',
                        borderBottom: i < RECORD_ACTIONS.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                        background: 'none', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <span aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={a.icon} size={17} color="var(--agency-accent-strong)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.label}</span>
                        <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-2)' }}>{a.hint}</span>
                      </span>
                      <Icon name="chevron-right" size={17} color="var(--fg-3)" />
                    </button>
                  ))}
                  <button
                    className="press focus-ring"
                    onClick={() => showToast('My NIS documents — coming soon')}
                    style={{ width: '100%', minHeight: 58, textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <span aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="folder-open" size={17} color="var(--agency-accent-strong)" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>My NIS documents</span>
                      <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-2)' }}>Card, statements, certificates</span>
                    </span>
                    <StatusPill tone="neutral">Soon</StatusPill>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{value}</span>
    </div>
  );
}
