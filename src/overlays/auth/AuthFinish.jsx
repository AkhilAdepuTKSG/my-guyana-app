import {
  Screen, PrimaryButton, Field, textInputStyle, ErrorBox,
} from './ui';

// STEP 4 · SET UP ACCOUNT · only what is still missing. This is the last
// screen of account creation — finishing here lands the citizen straight on
// Home (backlog 1.4: no interstitials after the password).
export function Setup({ st, on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  const hasGovEmail = !!persona?.email;
  return (
    <Screen gap={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--status-success)' }}>Identity confirmed</span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>Last thing, {first}</h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>{hasGovEmail ? 'Confirm your email and set a password, so you can always get back in.' : 'Two details we still need, so you can always get back in.'}</p>
      </div>
      <Field label="Email address" hint={hasGovEmail ? 'This is the email government has for you. We use it only to get you back in if you lose your phone.' : 'Government has no email for you. We use it only to get you back in if you lose your phone.'}>
        <input type="email" value={st.setupEmail} onChange={on.updateSetupEmail} placeholder="you@example.com" style={textInputStyle(false, { borderRadius: 13, minHeight: 52, padding: '13px 15px' })} />
      </Field>
      <Field label="Create a password" hint="A backup for the rare day a code cannot reach you.">
        <input type="password" value={st.setupPass} onChange={on.updateSetupPass} placeholder="At least 8 characters" style={textInputStyle(false, { borderRadius: 13, minHeight: 52, padding: '13px 15px' })} />
      </Field>
      {st.setupError && <ErrorBox>{st.setupError}</ErrorBox>}
      <PrimaryButton onClick={on.setupSubmit}>Finish and go to my Home</PrimaryButton>
    </Screen>
  );
}
