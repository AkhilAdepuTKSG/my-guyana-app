import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

// Refunds can only go back five years by law — the "out"/"checked" branches
// below are a simple copy-only stand-in for that window rule (no date math).
const REFUND_SITUATIONS = [
  { id: 'over60', label: 'I paid contributions after I turned 60', when: 'Payments in 2023–2024', out: false },
  { id: 'double', label: 'My employer and I both paid for the same period', when: 'Payments in 2024', out: false },
  { id: 'wrongclass', label: 'I was placed in the wrong contribution class', when: 'Payments in 2022–2023', out: false },
  { id: 'old', label: 'I paid too much a long time ago', when: 'Payments in 2017', out: true },
];

const REFUND_DOCS = ['Bank statement showing the payment', 'NIS contribution card or receipt'];

export default function RefundRequest() {
  const { isOpen, closeOverlay, openOverlay, showToast } = useAppState();
  const open = isOpen('refund');
  const [phase, setPhase] = useState('pick'); // pick | out | checked
  const [account, setAccount] = useState('');

  useEffect(() => {
    if (open) { setPhase('pick'); setAccount(''); }
  }, [open]);

  const close = () => closeOverlay('refund');

  const pick = (situation) => setPhase(situation.out ? 'out' : 'checked');

  const submit = () => {
    closeOverlay('refund');
    showToast('Refund request sent to NIS');
  };

  const appealInstead = () => {
    closeOverlay('refund');
    openOverlay('appeal');
  };

  return (
    <PageOverlay open={open} onClose={close} title="Request a refund">
      {phase === 'pick' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <h2 className="ds-h3" style={{ margin: 0, fontSize: 19 }}>Which of these happened?</h2>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            Refunds can only go back five years, so we check the dates before you fill anything in.
          </p>
          {REFUND_SITUATIONS.map((r) => (
            <button
              key={r.id}
              className="press focus-ring"
              onClick={() => pick(r)}
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', padding: 15, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--fg-1)' }}>{r.label}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>{r.when}</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--fg-3)" />
            </button>
          ))}
        </div>
      )}

      {phase === 'out' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ border: '1px solid color-mix(in oklch, var(--status-error) 38%, transparent)', borderRadius: 16, background: 'var(--status-error-bg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>This one is outside the five-year window</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
              The payments you described were made in 2017. By law NIS can only refund contributions paid in the last five years, so there's no form to fill in for this.
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>If you think this is wrong</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
              You can appeal the five-year rule if NIS delayed your original request. An office can also check the dates on your record with you.
            </div>
            <button
              className="press focus-ring"
              onClick={appealInstead}
              style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 16px', border: 'none', borderRadius: 999, background: 'var(--fg-1)', color: 'var(--surface-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Appeal this
            </button>
          </div>
          <button className="press focus-ring" onClick={() => setPhase('pick')} style={{ alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', minHeight: 44 }}>
            Pick a different situation
          </button>
        </div>
      )}

      {phase === 'checked' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ border: '1px solid color-mix(in oklch, var(--status-success) 38%, transparent)', borderRadius: 16, background: 'var(--status-success-bg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Inside the five-year window</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>The payments you described were made recently, so NIS can refund them.</div>
          </div>
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div className="ds-eyebrow" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>Documents for this refund</div>
            {REFUND_DOCS.map((d) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="paperclip" size={15} color="var(--fg-3)" />
                <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <label htmlFor="refund-acct" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>Where should we send the money?</label>
            <input
              id="refund-acct"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Bank account number"
              style={{ width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <Button fullWidth onClick={submit}>Send refund request</Button>
        </div>
      )}
    </PageOverlay>
  );
}
