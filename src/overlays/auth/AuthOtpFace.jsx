import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, IconBadge, PrimaryButton, TextButton, ErrorBox, DemoHint,
} from './ui';
import { POL_TIPS } from './authData';

function otpSentToLabel(st) {
  if (st.otpSource === 'registry') return 'the number on your e-ID record · +592 ••• 4820';
  if (st.otpSource === 'govrecord') {
    return st.contactMode === 'phone'
      ? 'the number on your government record · ••• ••• 4820'
      : 'the email on your government record · n••••••@example.gy';
  }
  if (st.contactMode === 'phone') {
    const last4 = (st.contactValue || '').replace(/\D/g, '').slice(-4) || '0000';
    return `+592 ••• ${last4}`;
  }
  return st.contactValue
    ? st.contactValue.charAt(0) + '••••' + st.contactValue.slice(st.contactValue.indexOf('@'))
    : 'your email';
}

export function Otp({ st, on }) {
  const resendLabel = st.otpExpired || st.otpSeconds === 0 ? 'Send a new code' : `Send a new code in 0:${String(st.otpSeconds).padStart(2, '0')}`;
  return (
    <Screen onBack={on.otpBack}>
      <Heading title="Enter the 6 digits we sent" sub={`Sent to ${otpSentToLabel(st)}`} />
      <input
        aria-label="6-digit code" inputMode="numeric" maxLength={6} placeholder="000000"
        value={st.otpValue} onChange={on.updateOtp}
        style={{
          width: '100%', boxSizing: 'border-box', minHeight: 60,
          border: `1px solid ${st.otpError ? 'var(--status-error)' : 'var(--surface-border)'}`,
          borderRadius: 14, background: 'var(--surface-2)', textAlign: 'center', fontFamily: 'inherit',
          fontSize: 26, fontWeight: 800, letterSpacing: '0.36em', textIndent: '0.36em', color: 'var(--fg-1)', outline: 'none',
        }}
      />
      {st.otpError && <ErrorBox>{st.otpError}</ErrorBox>}
      <PrimaryButton busy={st.otpBusy} onClick={on.otpSubmit}>{st.otpBusy ? 'Checking…' : 'Continue'}</PrimaryButton>
      <TextButton tone={st.otpExpired || st.otpSeconds === 0 ? 'var(--brand-500)' : 'var(--fg-4)'} onClick={on.otpResend}>
        {resendLabel}
      </TextButton>
      {st.otpSource !== 'registry' && (
        <TextButton tone="var(--fg-2)" onClick={on.otpSwitchChannel} style={{ minHeight: 42 }}>
          {st.contactMode === 'phone' ? 'Send it to my email instead' : 'Send it to my number instead'}
        </TextButton>
      )}
      <DemoHint>Demo: any six digits work. Type 000000 to see the wrong-code message.</DemoHint>
    </Screen>
  );
}

// STEP 3c · BLOCKED · three failed checks
export function Blocked({ on }) {
  return (
    <Screen gap={18}>
      <IconBadge name="shield-x" tone="error" />
      <Heading title="We have paused this for now" sub="Three checks did not pass, so we stopped to keep your record safe. Try again in an hour, or visit a service centre and they will help you in person." />
      <PrimaryButton onClick={on.backToSplash}>Back to start</PrimaryButton>
      <TextButton onClick={on.visitCentre}>Find a service centre</TextButton>
    </Screen>
  );
}

// STEP 3b · PROOF OF LIFE · a live picture, after the code
export function Pol({ on }) {
  return (
    <Screen>
      <IconBadge name="camera" />
      <Heading title="One quick photo" sub="Take a picture of yourself so government knows a real person is here. It is compared with the photo on your record and never kept by My Guyana." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
        {POL_TIPS.map((t, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, lineHeight: 1.45, color: 'var(--fg-2)' }}>
            <Icon name={t.icon} size={16} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: 1 }} />{t.label}
          </span>
        ))}
      </div>
      <PrimaryButton onClick={on.polStart}>Take my picture</PrimaryButton>
    </Screen>
  );
}

// Live face-check sheet: NFC-style biometric capture, shared by every
// "prove it's a live person" moment (device sign-in, proof of life, discovery).
export function FaceCheck() {
  return (
    <div
      role="dialog" aria-label="Face check"
      style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 26, padding: '70px 26px 40px',
        background: 'linear-gradient(180deg, #12314f 0%, #0b1c2e 45%, #06121f 100%)',
        animation: 'sheetOverlayFade 0.24s ease-out',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Taking your picture</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Hold still</h2>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.66)', maxWidth: 250 }}>
          Look at the camera. We are comparing you with the photo government has.
        </p>
      </div>

      <span aria-hidden="true" style={{ position: 'relative', width: 190, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '96px 96px 84px 84px', border: '2px solid rgba(126,205,255,0.55)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', animation: 'faceOvalGlow 2.1s ease-out infinite' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'linear-gradient(90deg, transparent, #7ecdff, transparent)', boxShadow: '0 0 14px 3px rgba(126,205,255,0.55)', animation: 'faceSweep 1.9s ease-in-out infinite' }} />
        </span>
        <span aria-hidden="true" style={{ position: 'absolute', width: 214, height: 214, borderRadius: 999, border: '2px solid transparent', borderTopColor: '#7ecdff', borderRightColor: 'rgba(126,205,255,0.35)', animation: 'faceArcSpin 1.25s linear infinite' }} />
        <Icon name="scan-face" size={52} color="rgba(255,255,255,0.5)" />
      </span>

      <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#7ecdff', animation: 'faceDots 1.1s ease-in-out infinite' }} />
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#7ecdff', animation: 'faceDots 1.1s ease-in-out 0.18s infinite' }} />
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#7ecdff', animation: 'faceDots 1.1s ease-in-out 0.36s infinite' }} />
      </span>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Checking with government…</p>
    </div>
  );
}
