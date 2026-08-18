import { useRef } from 'react';
import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, PrimaryButton, SecondaryButton, TextButton, Row, ListCard,
  Field, textInputStyle, ErrorBox, Spacer, DemoHint,
} from './ui';

// SIGN IN · pick how to prove it's you. e-ID is the primary path; a device
// passkey (Face ID) is offered when this phone has one enrolled.
export function SignInDevice({ st, on, persona }) {
  const hasName = !!(persona?.name || '').trim();
  const first = hasName ? persona.name.split(' ')[0] : '';
  const initial = (persona?.initials || first.charAt(0) || 'G').charAt(0);
  // Drive the biometric action off the real probe: unlock if a passkey is
  // enrolled here, set one up if the device supports it, otherwise hide it.
  const canBio = st?.bioSupported;
  const enrolled = st?.bioEnrolled;
  const busy = !!st?.bioBusy;
  return (
    <Screen onBack={on.backToSplash}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>
          {hasName ? <>Welcome back<br />{first}</> : 'Sign in'}
        </h1>
        {!hasName && (
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>
            Sign in with your e-ID, or another way you set up before.
          </p>
        )}
      </div>
      {hasName && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '24px 0 6px' }}>
          <span aria-hidden="true" style={{ position: 'relative', width: 92, height: 92, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>
            {initial}
            <span aria-hidden="true" style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 999, background: 'var(--brand-600)', border: '3px solid var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="scan-face" size={15} color="#fff" />
            </span>
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>{persona.name}</span>
        </div>
      )}
      {st?.bioError && <ErrorBox>{st.bioError}</ErrorBox>}
      <Spacer />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={on.signInWithEid}>
          <Icon name="fingerprint" size={20} color="#fff" /> Sign in with my e-ID
        </PrimaryButton>
        {!st?.bioProbed && (
          <SecondaryButton busy>Checking this device…</SecondaryButton>
        )}
        {st?.bioProbed && canBio && enrolled && (
          <SecondaryButton busy={busy} onClick={on.startFaceSignIn}>
            <Icon name="scan-face" size={18} /> {busy ? 'Waiting for Face ID…' : 'Sign in with Face ID'}
          </SecondaryButton>
        )}
        {st?.bioProbed && canBio && enrolled && !busy && (
          <TextButton onClick={on.bioResetEnrol} style={{ minHeight: 38 }}>
            Face ID not working? Set it up again
          </TextButton>
        )}
        {st?.bioProbed && canBio && !enrolled && (
          <SecondaryButton busy={busy} onClick={on.enrolBiometricNow}>
            <Icon name="scan-face" size={18} /> {busy ? 'Setting up…' : 'Set up Face ID on this device'}
          </SecondaryButton>
        )}
        <SecondaryButton onClick={on.otherWays}>Other ways to sign in</SecondaryButton>
        <TextButton onClick={on.useOtherAccount}>Use a different account</TextButton>
      </div>
    </Screen>
  );
}

// SIGN IN · read the citizen's e-ID by tapping the card (NFC) or scanning it.
// No number is ever typed by hand.
export function EidSignIn({ st, on }) {
  const scanRef = useRef(null);
  return (
    <Screen onBack={on.backToSplash}>
      <IconBadgeEid />
      <Heading
        eyebrow="Sign in"
        title="Sign in with your e-ID"
        sub="Tap your card to the phone, or scan it — we read your e-ID on your device and send a one-time code to confirm it's you. Nothing to type."
      />
      <input
        ref={scanRef} type="file" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) on.eidSignInScanFile(f); }}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row
          icon="nfc" iconBg="var(--brand-600)" iconFg="#fff" border="var(--brand-600)"
          title="Tap my e-ID card"
          sub="Hold your card to the phone — the chip proves it's yours"
          onClick={on.eidSignInTap}
        />
        <Row
          icon="scan-line"
          title="Scan or upload my e-ID card"
          sub="Photograph your card — we read it on your device to sign you in"
          onClick={() => scanRef.current?.click()}
        />
      </div>
      {st.eidSignInError && <ErrorBox>{st.eidSignInError}</ErrorBox>}
      <DemoHint>Demo: “Tap my e-ID card” signs you in as Nicole Persaud. Or scan the sample e-ID card from <strong>/sample-docs.html</strong>.</DemoHint>
    </Screen>
  );
}

function IconBadgeEid() {
  return (
    <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="fingerprint" size={22} color="var(--brand-700)" />
    </span>
  );
}

// SIGN IN · the other credentials this account already has
export function OtherWays({ on }) {
  return (
    <Screen onBack={on.otherWaysBack} gap={20}>
      <Heading title="Other ways to sign in" />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        Send me a verification code
      </span>
      <ListCard>
        <Row icon="message-square" title="Text me" sub="••• ••• 4820" onClick={() => on.signInSendCode('phone')} />
        <Row icon="mail" title="Send email" sub="n••••••@example.gy" onClick={() => on.signInSendCode('email')} />
      </ListCard>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Or</span>
      <ListCard>
        <Row icon="key-round" title="Use my password" onClick={on.usePassword} />
        <Row icon="life-buoy" title="Recover my account" sub="If you no longer have that phone or email" onClick={on.recoverFromOtherWays} />
      </ListCard>
    </Screen>
  );
}

// SIGN IN · password fallback
export function PasswordScreen({ st, on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  return (
    <Screen onBack={on.otherWays}>
      <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>
        Welcome back<br />{first}
      </h1>
      <input
        type="password" value={st.signInPassword} onChange={on.updateSignInPassword}
        placeholder="Enter password" style={textInputStyle(!!st.signInPassError)}
      />
      {st.signInPassError && <ErrorBox>{st.signInPassError}</ErrorBox>}
      <TextButton tone="var(--brand-700)" onClick={on.forgotPassword} style={{ alignSelf: 'flex-start', width: 'auto', textDecoration: 'underline', minHeight: 'auto' }}>
        Forgot password?
      </TextButton>
      <Spacer />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={on.submitPassword}>Continue</PrimaryButton>
        <SecondaryButton onClick={on.otherWays}>Other ways to sign in</SecondaryButton>
      </div>
    </Screen>
  );
}

// IDENTIFIER FIRST · one field, no new-vs-returning fork
export function IdentifierScreen({ st, on }) {
  const isPhone = st.contactMode === 'phone';
  return (
    <Screen onBack={on.backToSplash}>
      <Heading
        title={st.authIntent === 'create' ? 'Create your account' : 'Sign in'}
        sub={st.authIntent === 'create'
          ? 'Enter your mobile number or email. We send one code to confirm it is yours, then set your account up.'
          : 'Enter the mobile number or email on your account. We send one code and take you straight in.'}
      />
      <Field label={isPhone ? 'Mobile number' : 'Email address'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 14px', borderRadius: 13, border: `1.5px solid ${st.contactError ? 'var(--status-error)' : 'var(--surface-border)'}`, background: 'var(--surface-2)' }}>
          {isPhone && <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-2)', flexShrink: 0 }}>+592</span>}
          <input
            type="text" enterKeyHint="go" placeholder={isPhone ? '700 0000' : 'you@example.gy'}
            value={st.contactValue} onChange={on.updateContact}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: 'var(--fg-1)' }}
          />
        </div>
        {st.contactError && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--status-error)' }}>
            <Icon name="triangle-alert" size={14} color="currentColor" />{st.contactError}
          </span>
        )}
        <TextButton onClick={on.toggleContactMode} style={{ alignSelf: 'flex-start', width: 'auto', minHeight: 36, color: 'var(--brand-600)', padding: 0 }}>
          {isPhone ? 'Use an email address instead' : 'Use a mobile number instead'}
        </TextButton>
      </Field>
      <PrimaryButton busy={st.contactBusy} onClick={on.submitContact}>
        {st.contactBusy ? 'Sending…' : 'Send me a code'}
      </PrimaryButton>
      <TextButton onClick={on.cantReceiveCode}>I can't receive a code</TextButton>
      {st.authIntent === 'signin' && (
        <DemoHint>Demo: anything works and signs you in. Type "0" for an invalid-input error, or "new" to see the no-account state.</DemoHint>
      )}
    </Screen>
  );
}

// SIGN IN · no account found
export function NoAccount({ st, on }) {
  return (
    <Screen>
      <IconBadgeInline />
      <Heading
        title={`No account with ${st.contactValue || 'that number'}`}
        sub="Your number is confirmed, so nothing is lost. You can create your My Guyana account with it now, or try the number you signed up with."
      />
      <Spacer />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={on.noAccountCreate}>Create my account</PrimaryButton>
        <SecondaryButton onClick={on.noAccountChange}>Try a different number or email</SecondaryButton>
      </div>
    </Screen>
  );
}

function IconBadgeInline() {
  return (
    <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="user-round-search" size={22} color="var(--fg-2)" />
    </span>
  );
}
