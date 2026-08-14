import { useEffect, useRef, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';

// Local constant — mockData.js has no bank list, and the assignment notes
// this is exactly the kind of thing to invent locally.
const BANKS = [
  'Republic Bank (Guyana)',
  'Guyana Bank for Trade and Industry',
  'Demerara Bank',
  'Citizens Bank Guyana',
  'Bank of Baroda Guyana',
  'Bank of Nova Scotia',
];

const EMPTY_FIELDS = { bank: '', account: '', routing: '', address: '' };

export default function BankLinkFlow() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('bank');

  const [step, setStep] = useState('form'); // form | checking | otp | bio | linking | done | flagged
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [query, setQuery] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [tries, setTries] = useState(0);
  const [linked, setLinked] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStep('form');
      setFields(EMPTY_FIELDS);
      setQuery('');
      setOtp('');
      setOtpError('');
      setTries(0);
      setLinked(null);
    }
    return () => clearTimeout(timerRef.current);
  }, [open]);

  const close = () => closeOverlay('bank');

  const bankName = fields.bank || 'your bank';
  const matches = query.trim()
    ? BANKS.filter((b) => b.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const showResults = matches.length > 0 && fields.bank !== query.trim();

  const pickBank = (name) => {
    setFields((f) => ({ ...f, bank: name }));
    setQuery(name);
  };

  const submitForm = () => {
    if (!fields.bank.trim()) return showToast('Search for and choose your bank');
    if (fields.account.replace(/\D/g, '').length < 6) return showToast('Enter a valid account number');
    if (fields.routing.replace(/\D/g, '').length < 6) return showToast('Enter a valid branch or routing number');
    if (fields.address.trim().length < 6) return showToast('Enter the address held on the account');
    setStep('checking');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOtp('');
      setOtpError('');
      setStep('otp');
    }, 1800);
  };

  const verifyOtp = () => {
    // Demo rule straight from the source prototype: 123456 always succeeds,
    // anything else fails and counts toward a 3-strike flag.
    if (otp === '123456') { setOtpError(''); setStep('bio'); return; }
    const nextTries = tries + 1;
    if (nextTries >= 3) { setTries(nextTries); setStep('flagged'); return; }
    setTries(nextTries);
    setOtp('');
    const left = 3 - nextTries;
    setOtpError(`That code did not match. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before this request is flagged.`);
  };

  const bioConfirm = () => {
    setStep('linking');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const acct = { bank: fields.bank.trim(), last4: fields.account.replace(/\D/g, '').slice(-4) };
      setLinked(acct);
      setStep('done');
    }, 1500);
  };

  const doneLine = linked ? `${linked.bank} ****${linked.last4} is in your Wallet.` : 'Your account is in your Wallet.';

  return (
    <Sheet open={open} onClose={close} maxHeight="92%">
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="landmark" size={21} color="currentColor" />
            </span>
            <h2 className="ds-h2" style={{ margin: 0 }}>Add a bank account</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>We send these details to your bank. They confirm the account is yours and send a code to the phone registered against it.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="bank-search" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Your bank</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)' }}>
              <Icon name="search" size={17} color="var(--fg-4)" style={{ flexShrink: 0 }} />
              <input
                id="bank-search" type="text" placeholder="Start typing your bank's name"
                value={query} onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)' }}
              />
            </div>
            {showResults && (
              <div style={{ border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', overflow: 'hidden' }}>
                {matches.map((b) => (
                  <button key={b} className="press focus-ring" onClick={() => pickBank(b)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 52, padding: '11px 14px',
                    border: 'none', borderBottom: '1px solid var(--surface-border)', background: fields.bank === b ? 'var(--agency-accent-soft)' : 'var(--surface-1)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <span aria-hidden="true" style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="landmark" size={15} color="currentColor" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{b}</span>
                    {fields.bank === b && <Icon name="check" size={16} color="var(--agency-accent)" style={{ flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="bank-account-no" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Account number</label>
            <input
              id="bank-account-no" type="text" enterKeyHint="done" inputMode="numeric"
              value={fields.account} onChange={(e) => setFields((f) => ({ ...f, account: e.target.value }))}
              placeholder="e.g. 0042198765"
              style={{ width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="bank-routing" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Branch or routing number</label>
            <input
              id="bank-routing" type="text" enterKeyHint="done" inputMode="numeric"
              value={fields.routing} onChange={(e) => setFields((f) => ({ ...f, routing: e.target.value }))}
              placeholder="e.g. 021000021"
              style={{ width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="bank-address" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Address on the account</label>
            <input
              id="bank-address" type="text" enterKeyHint="done"
              value={fields.address} onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))}
              placeholder="Lot 42 Sheriff Street, Campbellville"
              style={{ width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Must match the address your bank holds for this account.</p>
          </div>

          <button className="press focus-ring" onClick={submitForm} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Verify with my bank</button>
        </div>
      )}

      {step === 'checking' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '26px 10px 20px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ position: 'relative', width: 72, height: 72, borderRadius: 999, background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '2px solid var(--agency-accent)', animation: 'successRingPulse 1.6s ease-out infinite' }} />
            <Icon name="landmark" size={30} color="var(--agency-accent-strong)" />
          </span>
          <h2 className="ds-h3" style={{ margin: '4px 0 0' }}>Checking with {bankName}</h2>
          <p className="ds-small" style={{ margin: 0, color: 'var(--fg-3)', maxWidth: 260 }}>Verifying with your bank — matching the account, branch and address they hold…</p>
        </div>
      )}

      {step === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="shield-check" size={21} color="currentColor" />
            </span>
            <h2 className="ds-h2" style={{ margin: 0 }}>Enter your bank's code</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{bankName} confirmed the account and sent a 6-digit code to ••• ••• 4820, the phone registered against it.</p>
          </div>
          <input
            aria-label="Bank code" inputMode="numeric" maxLength={6} placeholder="000000"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 56,
              border: `1px solid ${otpError ? 'var(--status-error)' : 'var(--surface-border)'}`,
              borderRadius: 14, background: 'var(--surface-2)', textAlign: 'center', fontFamily: 'inherit',
              fontSize: 23, fontWeight: 800, letterSpacing: '0.36em', textIndent: '0.36em', color: 'var(--fg-1)', outline: 'none',
            }}
          />
          {otpError && (
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--status-error)' }}>
              <Icon name="triangle-alert" size={15} color="currentColor" />{otpError}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-4)' }}>Demo: 123456 succeeds, anything else fails.</p>
          <button className="press focus-ring" onClick={verifyOtp} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Verify and add account</button>
        </div>
      )}

      {step === 'bio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="scan-face" size={21} color="currentColor" />
            </span>
            <h2 className="ds-h2" style={{ margin: 0 }}>Now confirm it's you</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{bankName} has confirmed the account. My Guyana asks for your face one last time before the account is added to your Wallet — the same check you use to sign in.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
            <Icon name="lock" size={16} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Two separate checks: your bank confirms the account, My Guyana confirms the person adding it.</p>
          </div>
          <button className="press focus-ring" onClick={bioConfirm} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm with Face ID</button>
        </div>
      )}

      {step === 'linking' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '26px 10px 20px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ position: 'relative', width: 72, height: 72, borderRadius: 999, background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '2px solid var(--agency-accent)', animation: 'successRingPulse 1.6s ease-out infinite' }} />
            <Icon name="scan-face" size={30} color="var(--agency-accent-strong)" />
          </span>
          <h2 className="ds-h3" style={{ margin: '4px 0 0' }}>Linking your account</h2>
          <p className="ds-small" style={{ margin: 0, color: 'var(--fg-3)', maxWidth: 260 }}>Adding {bankName} to your Wallet…</p>
        </div>
      )}

      {step === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check-circle-2" size={23} color="var(--status-success)" />
          </span>
          <h2 className="ds-h2" style={{ margin: 0 }}>Bank account linked</h2>
          <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{doneLine} You can use it to pay bills and receive government payments.</p>
          <button className="press focus-ring" onClick={close} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
        </div>
      )}

      {step === 'flagged' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--status-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield-alert" size={23} color="var(--status-error)" />
          </span>
          <h2 className="ds-h2" style={{ margin: 0 }}>Blocked for your security</h2>
          <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>Three codes were entered incorrectly, so this request is flagged for review. The account was not added. Contact {bankName} or visit a branch to continue.</p>
          <button className="press focus-ring" onClick={close} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
        </div>
      )}
    </Sheet>
  );
}
