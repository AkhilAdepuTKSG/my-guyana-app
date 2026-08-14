import Icon from '../../components/ui/Icon';
import {
  Screen, IconBadge, PrimaryButton, SecondaryButton, Field, textInputStyle, ErrorBox, ListCard, Spacer,
} from './ui';
import { OB_CAPABILITIES } from './authData';

// STEP 4 · SET UP ACCOUNT · only what is still missing
export function Setup({ st, on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  return (
    <Screen gap={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--status-success)' }}>Identity confirmed</span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>Last thing, {first}</h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>Two details we still need, so you can always get back in.</p>
      </div>
      <Field label="Email address" hint="Government has no email for you. We use it only to get you back in if you lose your phone.">
        <input type="email" value={st.setupEmail} onChange={on.updateSetupEmail} placeholder="you@example.com" style={textInputStyle(false, { borderRadius: 13, minHeight: 52, padding: '13px 15px' })} />
      </Field>
      <Field label="Create a password" hint="A backup for the rare day a code cannot reach you.">
        <input type="password" value={st.setupPass} onChange={on.updateSetupPass} placeholder="At least 8 characters" style={textInputStyle(false, { borderRadius: 13, minHeight: 52, padding: '13px 15px' })} />
      </Field>
      {st.setupError && <ErrorBox>{st.setupError}</ErrorBox>}
      <PrimaryButton onClick={on.setupSubmit}>Finish and go in</PrimaryButton>
    </Screen>
  );
}

// secure the account · Face ID / device biometric prompt
export function Secure({ st, on }) {
  return (
    <Screen gap={16}>
      <IconBadge name="scan-face" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>Getting back in</h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>All done. Now just choose how you want to open My Guyana on this phone.</p>
      </div>
      <button
        className="press focus-ring" onClick={on.toggleDeviceFace} aria-pressed={st.deviceFaceOn}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: 16, border: `1px solid ${st.deviceFaceOn ? 'var(--brand-600)' : 'var(--surface-border)'}`, borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <span aria-hidden="true" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="scan-face" size={19} color="var(--brand-600)" />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Use Face ID on this phone</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>Nothing new to remember. Leave it off and we will send a code each time.</span>
        </span>
        <span aria-hidden="true" style={{ width: 46, height: 28, flexShrink: 0, borderRadius: 999, padding: 3, background: st.deviceFaceOn ? 'var(--brand-600)' : 'var(--surface-border)', display: 'flex', justifyContent: st.deviceFaceOn ? 'flex-end' : 'flex-start', transition: 'background 160ms ease' }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(9,26,43,0.3)' }} />
        </span>
      </button>
      <PrimaryButton onClick={on.secureContinue}>Continue</PrimaryButton>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>You can change this whenever you like in your profile.</p>
    </Screen>
  );
}

// ONBOARDING · verified
export function ObVerified({ st, on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  const headline = st.discoverResult === 'eid' ? 'Your identity is connected' : 'Your identity is verified';
  const verifiedBy = st.discoverResult === 'eid' ? 'Your e-ID is connected' : 'Your identity is confirmed';
  return (
    <Screen bg="var(--hero-navy-gradient)" gap={18} style={{ color: '#fff', padding: '48px 22px 32px' }}>
      <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="badge-check" size={25} color="#fff" />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.12, color: '#fff' }}>Welcome, {first}</h1>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)' }}>
          My Guyana is one secure place for your services, documents, applications and payments.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
        <Icon name="shield-check" size={20} color="#7fd8b0" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>{headline}</span>
          <span style={{ fontSize: 13, lineHeight: 1.4, color: 'rgba(255,255,255,0.82)' }}>{verifiedBy} · 3 agencies already linked</span>
        </span>
      </div>
      <Spacer />
      <button className="press focus-ring" onClick={on.obFinish} style={{ width: '100%', minHeight: 52, border: 'none', borderRadius: 14, background: '#fff', color: '#0e2237', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
        Go to my Home
      </button>
    </Screen>
  );
}

// ONBOARDING · basic
export function ObBasic({ on }) {
  return (
    <Screen gap={16}>
      <IconBadge name="check" tone="success" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>Your account is ready</h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>
          Everything below is yours to use now. Confirming who you are opens your own government records and services.
        </p>
      </div>
      <ListCard>
        {OB_CAPABILITIES.map((cp) => (
          <div key={cp.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
            <Icon name={cp.icon} size={16} color={cp.tone === 'success' ? 'var(--status-success)' : 'var(--fg-3)'} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: cp.tone === 'success' ? 'var(--fg-1)' : 'var(--fg-3)' }}>{cp.label}</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.03em', padding: '3px 8px', borderRadius: 999, background: cp.tone === 'success' ? 'var(--status-success-bg)' : 'var(--surface-4)', color: cp.tone === 'success' ? 'var(--status-success)' : 'var(--fg-3)' }}>{cp.tag}</span>
          </div>
        ))}
      </ListCard>
      <PrimaryButton onClick={on.obVerifyNow}>Verify my identity</PrimaryButton>
      <SecondaryButton onClick={on.obFinish}>Explore My Guyana</SecondaryButton>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>You can do this any time from your profile.</p>
    </Screen>
  );
}
