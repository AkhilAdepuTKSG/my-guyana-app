import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, PrimaryButton, SecondaryButton, TextButton, Row, ListCard,
  Field, textInputStyle, ErrorBox, Spacer, DemoHint,
} from './ui';

// SIGN IN · this device already knows the citizen (an optimisation inside Sign in)
export function SignInDevice({ on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  const initial = (persona.initials || first.charAt(0)).charAt(0);
  return (
    <Screen onBack={on.backToSplash}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>
          Welcome back<br />{first}
        </h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '24px 0 6px' }}>
        <span aria-hidden="true" style={{ position: 'relative', width: 92, height: 92, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>
          {initial}
          <span aria-hidden="true" style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 999, background: 'var(--brand-600)', border: '3px solid var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="scan-face" size={15} color="#fff" />
          </span>
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>{persona.name}</span>
          <span style={{ fontSize: 13.5, color: 'var(--fg-3)' }}>••• ••• 4820</span>
        </div>
      </div>
      <Spacer />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={on.startFaceSignIn}>
          <Icon name="scan-face" size={20} color="#fff" /> Sign in with Face ID
        </PrimaryButton>
        <SecondaryButton onClick={on.otherWays}>Other ways to sign in</SecondaryButton>
        <TextButton onClick={on.useOtherAccount}>Use a different account</TextButton>
      </div>
    </Screen>
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
