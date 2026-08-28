import { useEffect, useRef, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';

// Purposes that belong to a specific agency confirming its own records,
// even though the citizen is already signed in to My Guyana. These get an
// "agency intro" screen first; everything else goes straight to "choose".
const AGENCY_PURPOSES = ['agencylink', 'nislink', 'nislinkdirect', 'gplnew'];

// High-trust purposes get a stronger framing on the "choose method" screen —
// this is a visual/copy distinction only, no real risk engine behind it.
const HIGH_TRUST = ['bank', 'payment', 'signature', 'sensitive'];

function agencyMetaFor(purpose, agencyId) {
  if (purpose === 'gplnew') return AGENCIES.gpl;
  if (purpose === 'nislink' || purpose === 'nislinkdirect') return AGENCIES.nis;
  if (agencyId && AGENCIES[agencyId]) return AGENCIES[agencyId];
  return { name: 'This agency', shortName: 'the agency', icon: 'landmark' };
}

export default function IdvFlow() {
  const { isOpen, closeOverlay, getPayload, showToast, persona, updateUser } = useAppState();
  const open = isOpen('idv');
  const rawPayload = getPayload('idv');
  const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
  const purpose = payload.purpose || 'sensitive';
  const isAgencyPurpose = AGENCY_PURPOSES.indexOf(purpose) !== -1;
  const isHighTrust = HIGH_TRUST.indexOf(purpose) !== -1;
  const agency = agencyMetaFor(purpose, payload.agencyId);

  const [step, setStep] = useState(isAgencyPurpose ? 'agency-intro' : 'choose');
  const [channel, setChannel] = useState(null);
  const [code, setCode] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStep(isAgencyPurpose ? 'agency-intro' : 'choose');
      setChannel(null);
      setCode('');
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const succeed = () => {
    clearTimeout(timerRef.current);
    // Record it on the account. Confirming identity is a prerequisite for
    // applying for anything, so a flow that only said "verified" and changed
    // nothing sent the citizen straight back to the same blocked screen.
    // An agency confirming its own records is not the citizen proving who they
    // are, so those purposes leave the account's own level alone.
    if (!isAgencyPurpose) updateUser({ verificationLevel: 'verified' });
    closeOverlay('idv');
    showToast('Identity verified');
  };

  const startBiometric = () => {
    setStep('biometric');
    timerRef.current = setTimeout(succeed, 1800);
  };

  const useCodeInstead = () => {
    clearTimeout(timerRef.current);
    setStep('channel');
  };

  const sendOtp = (ch) => {
    setChannel(ch);
    setCode('');
    setStep('code');
  };

  const verifyCode = () => {
    if (code.replace(/\D/g, '').length < 6) {
      showToast('Enter the 6 digits we sent');
      return;
    }
    succeed();
  };

  const goBack = () => {
    if (step === 'code') { setStep('channel'); setCode(''); return; }
    if (step === 'channel') { setStep(isAgencyPurpose ? 'agency-intro' : 'choose'); return; }
  };

  const close = () => closeOverlay('idv');

  const chooseTitle = isHighTrust ? 'One more check' : "Verify it's you";
  const chooseSub = isAgencyPurpose
    ? `${agency.shortName} accepts any of these. A code to the contact they hold is the usual way.`
    : isHighTrust
      ? 'This one moves money or carries your signature, so we ask again even though you are signed in.'
      : 'Confirm your identity before we connect this to your name. Pick whichever is easiest.';
  const levelNote = isHighTrust
    ? 'High-trust action · asked every time'
    : isAgencyPurpose
      ? 'Asked once when connecting — not on every visit'
      : 'Standard check · your device remembers you for next time';

  const phoneMasked = '••• ••• 4820';
  const firstInitial = (persona?.name || 'N').trim().charAt(0).toLowerCase();
  const emailMasked = `${firstInitial}••••••@example.gy`;

  const channelSub = isAgencyPurpose
    ? `To the phone or email ${agency.shortName} has on record for you.`
    : "We'll send a 6-digit code to confirm it's you.";

  const codeTitle = isAgencyPurpose ? "Just checking it's you" : 'Enter your code';
  const codeSub = (isAgencyPurpose
    ? (purpose === 'nislink' || purpose === 'nislinkdirect' ? 'NIS opens your record once you confirm. '
      : purpose === 'gplnew' ? 'GPL needs to know this is really you. '
      : 'This agency keeps its own records. ')
    : '')
    + 'We sent a 6-digit code to '
    + (channel === 'email' ? emailMasked : phoneMasked) + '.';

  const methods = [
    { id: 'device', icon: 'scan-face', title: 'Face or fingerprint', sub: 'The biometrics on this device', strongest: true, pick: startBiometric },
    { id: 'code', icon: 'key-round', title: 'Send me a one-time code', sub: 'By text message or email', strongest: false, pick: useCodeInstead },
  ];

  return (
    <Sheet open={open} onClose={close} maxHeight="92%">
      {step === 'agency-intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={agency.icon} size={22} color="var(--agency-accent-strong)" />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 className="ds-h2" style={{ margin: 0, lineHeight: 1.25 }}>{agency.name || agency.shortName} needs to confirm it is you</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>You are signed in to My Guyana, but each agency keeps its own records and checks for itself before opening them. It takes one code.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: 15, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 13px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-border)' }}>
              <Icon name="send" size={15} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>The code goes to the phone or email {agency.shortName} already has for you.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 13px', background: 'var(--surface-1)' }}>
              <Icon name="shield-check" size={15} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>You are not creating another account — this connects the one you already have.</span>
            </div>
          </div>
          <button className="press focus-ring" onClick={() => setStep('choose')} style={{ width: '100%', minHeight: 52, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Validate</button>
          <button className="press focus-ring" onClick={close} style={{ width: '100%', minHeight: 44, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-3)', cursor: 'pointer' }}>Not now</button>
        </div>
      )}

      {step === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="shield-check" size={21} color="currentColor" />
            </span>
            <h2 className="ds-h2" style={{ margin: 0 }}>{chooseTitle}</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{chooseSub}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methods.map((m) => (
              <button key={m.id} className="press focus-ring" onClick={m.pick} style={{
                display: 'flex', alignItems: 'center', gap: 13, width: '100%', minHeight: 64, padding: '13px 15px',
                borderRadius: 16, border: `1px solid ${m.strongest ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                background: m.strongest ? 'var(--agency-accent-soft)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}>
                <span aria-hidden="true" style={{
                  width: 38, height: 38, flexShrink: 0, borderRadius: 12,
                  background: m.strongest ? 'var(--agency-accent)' : 'var(--surface-2)',
                  color: m.strongest ? 'var(--agency-contrast)' : 'var(--fg-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={m.icon} size={19} color="currentColor" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>
                    {m.title}
                    {m.strongest && <span style={{ padding: '2px 7px', borderRadius: 999, background: 'var(--status-success-bg)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--status-success)' }}>STRONGEST</span>}
                  </span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'var(--fg-2)' }}>{m.sub}</span>
                </span>
                <Icon name="chevron-right" size={18} color="var(--fg-3)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
          <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-4)' }}>
            <Icon name="info" size={14} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{levelNote}
          </p>
        </div>
      )}

      {step === 'biometric' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '16px 8px 8px' }}>
          <span aria-hidden="true" style={{ position: 'relative', width: 88, height: 88, borderRadius: 999, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'successFadeUp 0.4s ease-out both' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: -6, borderRadius: 999, border: '2px solid transparent', borderTopColor: 'var(--agency-accent)', animation: 'faceArcSpin 1.1s linear infinite' }} />
            <Icon name="scan-face" size={40} color="currentColor" />
          </span>
          <h2 className="ds-h2" style={{ margin: 0, fontSize: 19 }}>Hold still</h2>
          <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)', maxWidth: 255 }}>Checking your face against your e-ID record…</p>
          <button className="press focus-ring" onClick={useCodeInstead} style={{ minHeight: 40, padding: '0 10px', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--fg-3)', cursor: 'pointer' }}>Use a code instead</button>
        </div>
      )}

      {step === 'channel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 className="ds-h2" style={{ margin: 0 }}>Where should we send the code?</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{channelSub}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="press focus-ring" onClick={() => sendOtp('phone')} style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', minHeight: 60, padding: '13px 15px', borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="smartphone" size={18} color="currentColor" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Text message</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'var(--fg-2)' }}>{phoneMasked}</span>
              </span>
            </button>
            <button className="press focus-ring" onClick={() => sendOtp('email')} style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', minHeight: 60, padding: '13px 15px', borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mail" size={18} color="currentColor" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Email</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'var(--fg-2)' }}>{emailMasked}</span>
              </span>
            </button>
          </div>
          <button className="press focus-ring" onClick={goBack} style={{ width: '100%', minHeight: 44, border: 'none', borderRadius: 14, background: 'none', color: 'var(--fg-3)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
        </div>
      )}

      {step === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="shield-check" size={21} color="currentColor" />
            </span>
            <h2 className="ds-h2" style={{ margin: 0 }}>{codeTitle}</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--fg-2)' }}>{codeSub}</p>
          </div>
          <input
            type="text" inputMode="numeric" enterKeyHint="done" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{ width: '100%', minHeight: 56, padding: '12px 16px', borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-2)', fontSize: 24, fontWeight: 800, letterSpacing: '0.3em', textAlign: 'center', color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-4)' }}>Demo: any 6 digits work.</p>
          <button className="press focus-ring" onClick={verifyCode} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Verify and continue</button>
          <button className="press focus-ring" onClick={goBack} style={{ width: '100%', minHeight: 44, border: 'none', borderRadius: 14, background: 'none', color: 'var(--fg-3)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isAgencyPurpose ? 'Send it somewhere else' : 'Use another method'}</button>
        </div>
      )}
    </Sheet>
  );
}
