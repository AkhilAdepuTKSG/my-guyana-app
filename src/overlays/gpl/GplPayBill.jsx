import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { formatGyd, formatDue, billPeriodLabel } from './gplShared';

const PAY_METHODS = [
  { id: 'card', icon: 'credit-card', label: 'Debit or credit card', sub: 'Visa ending 4417' },
  { id: 'bank', icon: 'landmark', label: 'Bank transfer', sub: 'Republic Bank · ****2210' },
  { id: 'mobile', icon: 'smartphone', label: 'Mobile money', sub: '592 611 4820' },
];

export default function GplPayBill() {
  const { isOpen, closeOverlay, persona, navigate, showToast, requireOtp } = useAppState();
  const open = isOpen('gplPay');
  const gpl = persona.gpl;

  const [step, setStep] = useState(1); // 1 | 2 | 'success'
  const [choice, setChoice] = useState('full');
  const [method, setMethod] = useState('card');

  useEffect(() => {
    if (open) {
      setStep(1);
      setChoice('full');
      setMethod('card');
    }
  }, [open]);

  if (!gpl) {
    return (
      <PageOverlay open={open} onClose={() => closeOverlay('gplPay')} title="Pay your bill" agency="gpl">
        <div className="ds-body">No GPL account is linked yet.</div>
      </PageOverlay>
    );
  }

  const period = billPeriodLabel(gpl.dueDate);
  const partialAmount = Math.round(gpl.balance / 2);
  const amountLabel = choice === 'full' ? formatGyd(gpl.balance) : formatGyd(partialAmount);
  const activeMethod = PAY_METHODS.find((m) => m.id === method) || PAY_METHODS[0];
  const methodLabel = `${activeMethod.label} · ${activeMethod.sub}`;

  function handleClose() {
    closeOverlay('gplPay');
  }

  function confirmPay() {
    showToast?.(`${amountLabel} paid to GPL`);
    setStep('success');
  }

  function goWalletFromPay() {
    closeOverlay('gplPay');
    navigate('wallet');
  }

  return (
    <PageOverlay
      open={open}
      onClose={handleClose}
      agency="gpl"
      title="Pay your bill"
      subtitle={step === 'success' ? undefined : `${period} · due ${formatDue(gpl.dueDate)}`}
    >
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>How much</h3>
            {[
              { id: 'full', label: 'Pay the full balance', sub: `${formatGyd(gpl.balance)} · clears ${period}` },
              { id: 'part', label: 'Pay part of it', sub: `${formatGyd(partialAmount)} · the rest stays due` },
            ].map((c) => {
              const active = choice === c.id;
              return (
                <button
                  key={c.id}
                  className="press focus-ring"
                  onClick={() => setChoice(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60,
                    padding: '12px 14px', borderRadius: 14,
                    border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent-soft)' : 'var(--surface-1)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{c.label}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>{c.sub}</span>
                  </span>
                  <Icon name="check" size={17} color="var(--agency-accent-strong)" style={{ opacity: active ? 1 : 0 }} />
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>Pay with</h3>
            {PAY_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  className="press focus-ring"
                  onClick={() => setMethod(m.id)}
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
                    <Icon name={m.icon} size={16} color="var(--fg-2)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{m.label}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>{m.sub}</span>
                  </span>
                  <Icon name="check" size={17} color="var(--agency-accent-strong)" style={{ opacity: active ? 1 : 0 }} />
                </button>
              );
            })}
          </div>

          <button
            className="press focus-ring"
            onClick={() => setStep(2)}
            style={{
              width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
              color: 'var(--fg-on-accent)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', marginTop: 4,
            }}
          >
            Review payment
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            borderRadius: 18, padding: 20, color: '#fff',
            background: 'linear-gradient(160deg, #2d2e67 0%, #404293 60%, #2d2e67 100%)',
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Paying now</p>
            <p style={{ margin: '6px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{amountLabel}</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{methodLabel}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 14, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>Account</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{gpl.account}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>Billing period</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{period}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>Balance</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{formatGyd(gpl.balance)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
            <Icon name="receipt" size={16} color="var(--agency-accent-strong)" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
              Your receipt is saved to your Wallet the moment the payment clears.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="press focus-ring"
              onClick={() => setStep(1)}
              style={{
                flex: 1, minHeight: 50, border: '1px solid var(--surface-border)', borderRadius: 14,
                background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              className="press focus-ring"
              onClick={() => requireOtp({ title: 'Confirm your payment', message: `Enter the one-time code we sent you to pay ${amountLabel}.`, confirmLabel: `Pay ${amountLabel}`, onConfirm: confirmPay })}
              style={{
                flex: 2, minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
                color: 'var(--fg-on-accent)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Pay {amountLabel}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '24px 0', justifyContent: 'center' }}>
          <span style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'successIconPop 0.5s var(--ease-spring) both',
          }}>
            <Icon name="check-circle-2" size={32} color="var(--status-success)" />
          </span>
          <div style={{ animation: 'successFadeUp 0.4s var(--ease-out) 0.1s both' }}>
            <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>{amountLabel} paid</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              GPL has your payment for {period}. The receipt is in your Vault.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', paddingTop: 6 }}>
            <button
              className="press focus-ring"
              onClick={goWalletFromPay}
              style={{
                width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
                color: 'var(--fg-on-accent)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              See it in Wallet
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
