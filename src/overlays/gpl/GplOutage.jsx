import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { GPL_ADDRESS } from './gplShared';

const OUTAGE_TYPES = [
  { id: 'blackout', icon: 'zap-off', label: 'No power at my address', sub: 'Everything is off' },
  { id: 'partial', icon: 'activity', label: 'Partial power or low voltage', sub: 'Lights dim or flickering' },
  { id: 'line', icon: 'triangle-alert', label: 'Damaged line or pole', sub: 'A safety hazard' },
  { id: 'street', icon: 'lamp-ceiling', label: 'Street light out', sub: 'Public lighting' },
];

export default function GplOutage() {
  const { isOpen, closeOverlay, openOverlay, persona, showToast } = useAppState();
  const open = isOpen('gplOutage');
  const gpl = persona.gpl;

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [type, setType] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setStep('form');
      setType('');
      setNote('');
    }
  }, [open]);

  if (!gpl) {
    return (
      <PageOverlay open={open} onClose={() => closeOverlay('gplOutage')} title="Report an outage" agency="gpl">
        <div className="ds-body">No GPL account is linked yet.</div>
      </PageOverlay>
    );
  }

  function handleClose() {
    closeOverlay('gplOutage');
  }

  function submit() {
    if (!type) return;
    showToast?.('Outage report sent to GPL');
    setStep('success');
  }

  function seeClaims() {
    closeOverlay('gplOutage');
    openOverlay('gplClaims');
  }

  return (
    <PageOverlay
      open={open}
      onClose={handleClose}
      agency="gpl"
      title="Report an outage"
      subtitle={step === 'success' ? undefined : GPL_ADDRESS}
    >
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>What is happening</h3>
            {OUTAGE_TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  className="press focus-ring"
                  onClick={() => setType(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60,
                    padding: '12px 14px', borderRadius: 14,
                    border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent-soft)' : 'var(--surface-1)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={t.icon} size={16} color={active ? 'var(--agency-accent-strong)' : 'var(--fg-3)'} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{t.label}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>{t.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="gpl-outage-note" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>
              Anything else GPL should know
            </label>
            <textarea
              id="gpl-outage-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional — when it started, what you noticed"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 96, padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 14,
                fontFamily: 'inherit', color: 'var(--fg-1)', resize: 'none',
              }}
            />
          </div>

          <button
            className="press focus-ring"
            onClick={submit}
            disabled={!type}
            style={{
              width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
              color: 'var(--fg-on-accent)', fontSize: 14.5, fontWeight: 700,
              cursor: type ? 'pointer' : 'not-allowed', opacity: type ? 1 : 0.5,
            }}
          >
            Send report
          </button>
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '24px 0', justifyContent: 'center' }}>
          <span style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--agency-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'successIconPop 0.5s var(--ease-spring) both',
          }}>
            <Icon name="truck" size={30} color="var(--agency-accent-strong)" />
          </span>
          <div style={{ animation: 'successFadeUp 0.4s var(--ease-out) 0.1s both' }}>
            <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>Report sent — crew dispatched</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              GPL has your report for {GPL_ADDRESS}. You can follow it under claims and reports.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', paddingTop: 6 }}>
            <button
              className="press focus-ring"
              onClick={seeClaims}
              style={{
                width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
                color: 'var(--fg-on-accent)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Track this report
            </button>
            <button
              className="press focus-ring"
              onClick={handleClose}
              style={{
                width: '100%', minHeight: 50, border: '1px solid var(--surface-border)', borderRadius: 14,
                background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Back to Electricity
            </button>
          </div>
        </div>
      )}
    </PageOverlay>
  );
}
