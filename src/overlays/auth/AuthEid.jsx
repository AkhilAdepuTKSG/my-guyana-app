import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, IconBadge, PrimaryButton, SecondaryButton, TextButton, Row, ListCard,
  Field, textInputStyle, ErrorBox, DemoHint, Spacer,
} from './ui';
import { CONSENT_ITEMS, EID_FAIL_TIPS, formatDob } from './authData';

// "Check for your government record?" / "Share your details with My Guyana?"
export function Consent({ st, on }) {
  const fromLookup = st.consentFrom === 'lookup';
  return (
    <Screen onBack={on.authStepBack}>
      <IconBadge name="shield-check" />
      <Heading
        title={fromLookup ? 'Check for your government record?' : 'Share your details with My Guyana?'}
        sub={fromLookup
          ? 'With your permission we will look for a government record in your name. If one exists, we will then ask you to verify it is yours before anything is connected. If none exists, your account is created without it.'
          : 'Agree to what government confirms back to My Guyana before the check begins.'}
      />
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--fg-2)' }}>What may be shared:</p>
      <ListCard>
        {CONSENT_ITEMS.map((ci) => (
          <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
            <Icon name="check" size={16} color="var(--fg-4)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{ci.label}</span>
          </div>
        ))}
      </ListCard>
      <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>
        <Icon name="lock" size={15} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />My Guyana never stores your fingerprints or face.
      </p>
      <PrimaryButton busy={st.consentBusy} onClick={on.consentAgree}>
        {st.consentBusy ? 'Checking…' : fromLookup ? 'Agree and check' : 'Agree and continue'}
      </PrimaryButton>
      <TextButton onClick={on.consentDecline}>{fromLookup ? 'Not now' : 'Cancel'}</TextButton>
      {fromLookup && <DemoHint>Demo: "Agree and check" always finds a record. Use the link below to see the no-record path instead.</DemoHint>}
      {fromLookup && (
        <TextButton tone="var(--fg-4)" style={{ border: '1px dashed var(--surface-border)', borderRadius: 12, minHeight: 40 }} onClick={on.consentDemoNoRecord}>
          Demo: no record found instead
        </TextButton>
      )}
    </Screen>
  );
}

// STAGE 3 · PROOFING · a record was found; prove it belongs to you
export function Proof({ st, on }) {
  const found = st.discoverResult === 'eid'
    ? 'You are registered with government, and you have an e-ID'
    : 'You are registered with government, but you do not have an e-ID';
  const sub = st.discoverResult === 'eid'
    ? 'Verify the record is yours and your e-ID moves into My Guyana. Nothing from the record is shown until the check passes.'
    : 'You do not need an e-ID to finish here — you can apply for one inside the app later. For now, just verify your identity to continue.';
  return (
    <Screen onBack={on.authStepBack}>
      <Heading eyebrow="Your identity" title={found} sub={sub} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row
          icon="scan-face" iconBg="var(--brand-600)" iconFg="#fff" border="var(--brand-600)"
          title="Verify with my face" sub="A live camera check against the photo government already holds — nothing to look up or type"
          onClick={on.proofFace}
        />
        {st.discoverResult === 'eid' && (
          <Row icon="nfc" title="Tap my e-ID card" sub="Hold your card to the phone — the chip proves it is yours" onClick={on.proofTap} />
        )}
      </div>
      <TextButton onClick={on.proofOtherMethod}>Use another verification method</TextButton>
    </Screen>
  );
}

// e-ID authentication · NFC tap
export function EidAuth({ on }) {
  return (
    <Screen onBack={on.eidGoAlt}>
      <Heading title="Tap your government ID card" sub="This phone reads the security chip in your physical card. A Guyanese national ID or a residency card both work — hold it flat against the back until it beeps. Nothing to type in." />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <div aria-hidden="true" style={{ position: 'relative', width: 190, height: 190, borderRadius: 999, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '2px solid var(--brand-400)', animation: 'successRingPulse 1.8s ease-out infinite' }} />
          <Icon name="nfc" size={64} color="var(--brand-600)" />
        </div>
      </div>
      <PrimaryButton onClick={on.eidAuthTap}>I'm holding it now</PrimaryButton>
      <SecondaryButton onClick={on.eidReadFailed}>It isn't reading</SecondaryButton>
      <TextButton tone="var(--brand-600)" onClick={on.eidGoAlt}>Other ways to prove it's me</TextButton>
      <DemoHint>Demo: this button stands in for the card read.</DemoHint>
    </Screen>
  );
}

// e-ID read failed · retry with help, never a dead end
export function EidFail({ on }) {
  return (
    <Screen>
      <IconBadge name="nfc" tone="warning" />
      <Heading title="The card didn't read" sub="This is usually the position of the card, not a problem with your account. Three things that fix it:" />
      <ListCard>
        {EID_FAIL_TIPS.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
            <Icon name={t.icon} size={16} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{t.label}</span>
          </div>
        ))}
      </ListCard>
      <PrimaryButton onClick={on.eidFailRetry}>Try the card again</PrimaryButton>
      <SecondaryButton onClick={on.eidUseCardNumber}>Type the number instead</SecondaryButton>
      <TextButton onClick={on.eidGoAlt}>Prove it another way</TextButton>
    </Screen>
  );
}

// e-ID · card number + date of birth, then a code to the Registry's channel
export function EidCard({ st, on }) {
  return (
    <Screen onBack={on.eidGoAlt}>
      <Heading title="Type the number on your government ID card" sub="Two things from the front of your card. We ask for your date of birth so a card number alone can never be enough." />
      <Field label="Card number">
        <input
          type="text" inputMode="numeric" enterKeyHint="next" placeholder="0000 0000 0000"
          value={st.eidCardNo} onChange={on.updateEidCardNo}
          style={textInputStyle(false, { fontFamily: 'var(--font-mono)' })}
        />
      </Field>
      <Field label="Date of birth">
        <input
          type="text" enterKeyHint="go" placeholder="DD / MM / YYYY"
          value={st.eidDob} onChange={on.updateEidDob} style={textInputStyle(false)}
        />
      </Field>
      {st.eidCardError && <ErrorBox>{st.eidCardError}</ErrorBox>}
      <PrimaryButton onClick={on.eidCardSubmit}>Send a code to my registered number</PrimaryButton>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-4)' }}>
        The code goes to the number the Registry already holds for you — not to the one you typed earlier. If that number has changed, any government office can update it.
      </p>
    </Screen>
  );
}

// verified · the record is known, so consent to connect it is informed
export function LinkConfirm({ persona, on }) {
  const items = [
    { id: 'name', label: 'Full name', value: persona.name },
    { id: 'dob', label: 'Date of birth', value: formatDob(persona.dob) },
    { id: 'id', label: 'National ID number', value: '884 213 004' },
  ];
  return (
    <Screen>
      <IconBadge name="badge-check" tone="success" />
      <Heading title="Is this you?" sub="This is what government has on file. If it is right, we will connect it to your account." />
      <ListCard>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--fg-3)' }}>{it.label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right' }}>{it.value}</span>
          </div>
        ))}
      </ListCard>
      <PrimaryButton onClick={on.linkConfirm}>Yes, connect my record</PrimaryButton>
      <TextButton onClick={on.linkDecline}>No, this is not me</TextButton>
    </Screen>
  );
}

// FALSE MATCH · a security state: the candidate record is discarded, nothing is linked
export function Mismatch({ on }) {
  return (
    <Screen>
      <IconBadge name="shield-x" tone="error" />
      <Heading title="We have discarded that record" sub="Nothing was connected to your account and those details are gone from this device. Your My Guyana account is safe and still yours." />
      <ListCard>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
          <Icon name="eye-off" size={16} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>No further details were shown to you, and none were saved.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
          <Icon name="unlink" size={16} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Your account stays unverified until an identity is confirmed another way.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--surface-1)' }}>
          <Icon name="flag" size={16} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>A wrong match is reported so government can look into it.</span>
        </div>
      </ListCard>
      <Spacer />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={on.mismatchAltMethod}>Confirm my identity another way</PrimaryButton>
        <SecondaryButton onClick={on.mismatchContinue}>Continue without connecting</SecondaryButton>
      </div>
    </Screen>
  );
}
