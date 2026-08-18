import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

// Local mock list of decisions a user might want to appeal — not modeled
// in the shared mock data, since it's specific to this one form.
const APPEAL_OPTIONS = [
  { value: 'nis-registration', label: 'NIS Registration (NIS-RG-2026-04482)' },
  { value: 'sickness-benefit', label: 'Sickness Benefit claim (NIS-SB-2025-1187)' },
  { value: 'contribution-record', label: 'Contribution record correction' },
];

const APPEAL_TIMELINE = [
  { label: 'Received', when: 'You get a reference number within 2 days' },
  { label: 'Investigation', when: 'NIS re-checks your record — about 3 weeks' },
  { label: 'Decision', when: "You'll be notified in the app" },
];

export default function AppealForm() {
  const { isOpen, closeOverlay, showToast, requireOtp } = useAppState();
  const open = isOpen('appeal');
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');

  useEffect(() => {
    if (open) { setWhat(''); setWhy(''); }
  }, [open]);

  const canSubmit = what.trim().length > 0 && why.trim().length > 0;

  const submit = () => {
    closeOverlay('appeal');
    showToast('Appeal submitted');
  };

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('appeal')} title="File an appeal">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {what && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'var(--status-warning-bg)', border: '1px solid color-mix(in oklch, var(--status-warning) 38%, transparent)' }}>
            <Icon name="hourglass" size={17} color="var(--status-warning)" />
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, fontWeight: 600, color: 'var(--fg-1)' }}>22 days left to appeal the decision of 2 December 2025.</span>
          </div>
        )}
        <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>Fill form to appeal</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          One form covers every kind of appeal. Tell us what you're appealing and why — you can add documents later.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="appeal-what" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>What are you appealing?</label>
          <select
            id="appeal-what"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            style={{ width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          >
            <option value="">Select an application</option>
            {APPEAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="appeal-why" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Why do you think it's wrong?</label>
          <textarea
            id="appeal-why"
            rows={5}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="Include dates, names and anything else that helps."
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, lineHeight: 1.5, color: 'var(--fg-1)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ds-eyebrow" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>What happens next</div>
          {APPEAL_TIMELINE.map((t) => (
            <div key={t.label} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--surface-border)', marginTop: 5, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{t.when}</span>
              </span>
            </div>
          ))}
        </div>
        <Button fullWidth disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.5 }} onClick={() => requireOtp({ title: 'Submit your appeal', confirmLabel: 'Submit appeal', onConfirm: submit })}>Submit appeal</Button>
      </div>
    </PageOverlay>
  );
}
