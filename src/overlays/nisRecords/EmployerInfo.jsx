import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

// Local mock detail — the employer on file for the active NIS persona.
// Kept consistent with the employer name used in ContributionsHistory.
const EMPLOYER_INFO = {
  name: 'Demerara Distillers Limited',
  status: 'Active employer',
  tin: 'TIN 100-284-671',
  address: 'Plantation Diamond, East Bank Demerara',
  phone: '(592) 265-2201',
  since: 'Registered with NIS since June 2024',
  filing: 'Filings up to date through March 2026',
};

const DISPUTE_FIELDS = [
  { id: 'employer', icon: 'building-2', label: 'Employer name' },
  { id: 'contract', icon: 'file-text', label: 'Contract or employment terms' },
  { id: 'dates', icon: 'calendar', label: 'Start or end dates' },
  { id: 'other', icon: 'circle-dashed', label: 'Something else' },
];

const FIELD_ROWS = [
  { icon: 'hash', value: EMPLOYER_INFO.tin },
  { icon: 'map-pin', value: EMPLOYER_INFO.address },
  { icon: 'phone', value: EMPLOYER_INFO.phone },
  { icon: 'calendar-check', value: EMPLOYER_INFO.since },
  { icon: 'badge-check', value: EMPLOYER_INFO.filing },
];

export default function EmployerInfo() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('employerInfo');
  const [view, setView] = useState('info'); // 'info' | 'dispute'
  const [field, setField] = useState(null);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) { setView('info'); setField(null); setDetails(''); }
  }, [open]);

  const close = () => closeOverlay('employerInfo');

  const submitDispute = () => {
    closeOverlay('employerInfo');
    showToast('Sent to NIS for review');
  };

  if (view === 'dispute') {
    return (
      <PageOverlay open={open} onClose={close} title="What's wrong?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            Tell NIS which detail on your employer record is incorrect.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISPUTE_FIELDS.map((f) => {
              const active = field === f.id;
              return (
                <button
                  key={f.id}
                  className="press focus-ring"
                  onClick={() => setField(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '8px 14px',
                    borderRadius: 14, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Icon name={f.icon} size={17} color={active ? 'var(--agency-contrast)' : 'var(--agency-accent-strong)'} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: active ? 'var(--agency-contrast)' : 'var(--fg-1)' }}>{f.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="employer-dispute-details" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>What should it say instead?</label>
            <textarea
              id="employer-dispute-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Include the correct name, dates or details."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, lineHeight: 1.5, color: 'var(--fg-1)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <Button fullWidth disabled={!field} style={{ opacity: field ? 1 : 0.5 }} onClick={submitDispute}>Send to NIS</Button>
        </div>
      </PageOverlay>
    );
  }

  return (
    <PageOverlay open={open} onClose={close} title="Employer information">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="building-2" size={20} color="var(--agency-accent-strong)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>{EMPLOYER_INFO.name}</span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, fontWeight: 700, color: 'var(--status-success)' }}>{EMPLOYER_INFO.status}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FIELD_ROWS.map((row, i) => (
            <div key={row.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 4px', borderBottom: i < FIELD_ROWS.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}>
              <Icon name={row.icon} size={17} color="var(--fg-3)" />
              <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 4 }}>
          <Button variant="outline" fullWidth onClick={() => setView('dispute')} icon={<Icon name="flag" size={16} />}>
            This information looks wrong
          </Button>
        </div>
      </div>
    </PageOverlay>
  );
}
