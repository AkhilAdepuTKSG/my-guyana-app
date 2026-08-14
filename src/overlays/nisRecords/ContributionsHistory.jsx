import { useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';

// Local mock rows — a monthly contribution ledger for the connected employer.
const CONTRIB_ROWS = [
  { id: 'apr26', month: 'April 2026', employer: 'Demerara Distillers Limited', amount: 'G$ 9,600', status: 'Not filed', year: '2026', paid: false },
  { id: 'mar26', month: 'March 2026', employer: 'Demerara Distillers Limited', amount: 'G$ 9,600', status: 'Paid', year: '2026', paid: true },
  { id: 'feb26', month: 'February 2026', employer: 'Demerara Distillers Limited', amount: 'G$ 9,600', status: 'Paid', year: '2026', paid: true },
  { id: 'jan26', month: 'January 2026', employer: 'Demerara Distillers Limited', amount: 'G$ 9,300', status: 'Paid', year: '2026', paid: true },
  { id: 'dec25', month: 'December 2025', employer: 'Demerara Distillers Limited', amount: 'G$ 9,300', status: 'Paid', year: '2025', paid: true },
  { id: 'nov25', month: 'November 2025', employer: 'Demerara Distillers Limited', amount: 'G$ 9,300', status: 'Paid', year: '2025', paid: true },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: 'gaps', label: 'Gaps only' },
];

const CONTRIB_MADE = 8;
const CONTRIB_TARGET = 12;
const RING_CIRC = 282.7;

export default function ContributionsHistory() {
  const { isOpen, closeOverlay, openOverlay } = useAppState();
  const open = isOpen('contribHistory');
  const [filter, setFilter] = useState('all');

  const rows = CONTRIB_ROWS.filter((r) => filter === 'all' || (filter === 'gaps' ? !r.paid : r.year === filter));
  const ringOffset = RING_CIRC * (1 - CONTRIB_MADE / CONTRIB_TARGET);

  const reportIssue = () => {
    closeOverlay('contribHistory');
    openOverlay('contribReview');
  };

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('contribHistory')} title="Your contributions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
          <div aria-hidden="true" style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
            <svg viewBox="0 0 104 104" style={{ width: 76, height: 76, transform: 'rotate(-90deg)' }}>
              <circle cx="52" cy="52" r="45" fill="none" stroke="var(--surface-4)" strokeWidth="12" />
              <circle cx="52" cy="52" r="45" fill="none" stroke="var(--agency-accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={RING_CIRC} strokeDashoffset={ringOffset} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>{CONTRIB_MADE}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.35 }}>{CONTRIB_MADE} of {CONTRIB_TARGET} filed this year</div>
            <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>62 contributions on record since you joined NIS.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 12, background: 'var(--agency-accent-soft)' }}>
          <Icon name="lightbulb" size={15} color="var(--agency-accent-strong)" />
          <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-1)' }}>You're on track — one more contribution completes 2026.</span>
        </div>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '8px 8px', background: 'var(--surface-2)', borderRadius: 14 }}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                className="press focus-ring"
                onClick={() => setFilter(f.id)}
                style={{
                  flexShrink: 0, minHeight: 34, padding: '0 14px', borderRadius: 999, border: 'none',
                  background: active ? 'var(--agency-accent)' : 'var(--surface-1)', color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {rows.map((m) => (
          <div key={m.id} style={{ border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: m.paid ? 'var(--status-success)' : 'var(--status-warning)' }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{m.month}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-2)' }}>{m.employer}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{m.amount}</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 11, fontWeight: 700, color: m.paid ? 'var(--fg-3)' : 'var(--status-warning)' }}>{m.status}</span>
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-3)' }}>No contributions match this filter.</div>
        )}
      </div>

      <button
        className="press focus-ring"
        onClick={reportIssue}
        style={{ width: '100%', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
      >
        <Icon name="flag" size={16} />Report an issue with your record
      </button>
    </PageOverlay>
  );
}
