import { useEffect, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';

// The guided tour has one fixed script (matching the source design's copy for
// the NIS record view) — callers just open the `tour` overlay key.
const STEPS = [
  { icon: 'chart-no-axes-combined', title: 'Your NIS record', body: 'The green card shows weeks credited, and what they already unlock — pension, grants, maternity and more.' },
  { icon: 'triangle-alert', title: 'Fix issues fast', body: 'A missing contribution or a claim needing action shows up as an alert you can act on right away.' },
  { icon: 'file-plus-2', title: 'Apply anytime', body: 'Benefits, refunds, appeals and statements all start from "What you can do" below.' },
];

export default function TourSheet() {
  const { isOpen, closeOverlay } = useAppState();
  const open = isOpen('tour');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const close = () => closeOverlay('tour');
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const primaryAction = () => {
    if (isLast) close();
    else setStep((s) => s + 1);
  };

  return (
    <Sheet open={open} onClose={close}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STEPS.map((_, i) => (
            <span key={i} style={{ width: 22, height: 4, borderRadius: 999, background: i === step ? 'var(--agency-accent)' : 'var(--surface-4)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '8px 4px 4px' }}>
          <span style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 16, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={current.icon} size={26} color="var(--agency-accent-strong)" />
          </span>
          <div>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <h2 className="ds-h3" style={{ margin: '6px 0 0', fontSize: 19 }}>{current.title}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{current.body}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isFirst ? (
            <button className="press focus-ring" onClick={close} style={{ flex: 1, minHeight: 50, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Skip
            </button>
          ) : (
            <button className="press focus-ring" onClick={() => setStep((s) => s - 1)} style={{ flex: 1, minHeight: 50, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back
            </button>
          )}
          <button className="press focus-ring" onClick={primaryAction} style={{ flex: 2, minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
