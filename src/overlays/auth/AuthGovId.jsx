import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, IconBadge, PrimaryButton, SecondaryButton, TextButton, Row, ListCard,
  Field, textInputStyle, ErrorBox, InfoBox, Spacer, Spinner,
} from './ui';
import { GOV_ID_PLACEHOLDER, GOV_ID_TITLE, govIdAgencyFor } from './authData';

// STEP 1 · CREATE · one decision per screen: which document, how to give it, then its number
export function GovId({ st, on }) {
  const { govStep } = st;
  return (
    <Screen onBack={on.govStepBack} gap={18}>
      {govStep === 'choose' && (
        <>
          <Heading
            title="How do you want to sign up?"
            sub="Your e-ID is the fastest way in. No e-ID yet? Sign up with any government document and we'll start an e-ID application for you."
          />
          <button
            className="press focus-ring" onClick={() => on.govPickType('e-ID')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, width: '100%', padding: 22, border: 'none', borderRadius: 20, background: 'var(--brand-600)', color: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden="true" style={{ width: 50, height: 50, borderRadius: 15, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fingerprint" size={24} color="#fff" />
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.2)' }}>FASTEST</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em' }}>Use my e-ID</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>Tap your card to the phone or enter its number. Nothing to fill in.</span>
            </span>
          </button>

          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Don't have an e-ID yet?
          </span>
          <ListCard>
            <Row icon="id-card" title="National ID" sub="The GECOM card you vote with" onClick={() => on.govPickType('National ID')} />
            <Row icon="book-user" title="Passport" sub="Your Guyana passport" onClick={() => on.govPickType('Passport')} />
            <Row icon="car" title="Driver's licence" sub="Issued by the Guyana Police Force" onClick={() => on.govPickType("Driver's licence")} />
            <Row icon="receipt" title="TIN" sub="Your tax number, on any GRA letter" onClick={() => on.govPickType('TIN')} />
          </ListCard>
          <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>
            <Icon name="info" size={15} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 1 }} />
            We confirm who you are with this document, then start your e-ID application, help you book a Service Centre visit, and prompt you to complete your profile.
          </p>
          <Spacer />
          <TextButton onClick={on.govIdNone}>I don't have any of these</TextButton>
        </>
      )}

      {govStep === 'how' && (
        <>
          <Heading title={st.govIdType || 'Your document'} sub="How would you like to provide it?" />
          <button
            className="press focus-ring" onClick={on.govScanStart}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, width: '100%', padding: 22, border: 'none', borderRadius: 20, background: 'var(--brand-600)', color: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden="true" style={{ width: 50, height: 50, borderRadius: 15, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={24} color="#fff" />
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.2)' }}>EASIEST</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em' }}>Scan it with my camera</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>Point your camera at it. We read the number, so there is nothing to type.</span>
            </span>
          </button>
          <Row icon="keyboard" title="Type the number instead" sub="Read it off the document yourself" onClick={on.govHowTypeIt} />
          <Spacer />
          <TextButton onClick={on.govChooseType}>Choose a different document</TextButton>
        </>
      )}

      {govStep === 'number' && (
        <>
          <Heading title={GOV_ID_TITLE[st.govIdType] || 'Your number'} sub="Type it exactly as it appears on the document." />
          <Field hint="Demo: anything works. Type 0000 for an invalid-number error, or 9999 to see the no-record-found state.">
            <input
              type="text" value={st.govIdValue} onChange={on.updateGovId}
              placeholder={GOV_ID_PLACEHOLDER[st.govIdType] || ''}
              style={textInputStyle(!!st.govIdError, { fontFamily: 'var(--font-mono)', letterSpacing: '0.02em', fontSize: 17 })}
            />
            {st.govIdError && <ErrorBox>{st.govIdError}</ErrorBox>}
          </Field>
          <PrimaryButton busy={st.govIdBusy} onClick={on.govIdSubmit}>
            {st.govIdBusy ? `Checking with ${govIdAgencyFor(st.govIdType)}…` : 'Continue'}
          </PrimaryButton>
          <TextButton tone="var(--brand-700)" onClick={on.govScanStart}>Scan it instead</TextButton>
          <TextButton onClick={on.govChooseType}>Choose a different document</TextButton>
        </>
      )}
    </Screen>
  );
}

// 1d · scanning the document
export function GovScan() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '80px 26px 40px', background: 'linear-gradient(180deg,#12314f 0%,#0b1c2e 55%,#06121f 100%)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Hold the document steady</h2>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.66)', maxWidth: 250 }}>Fit the whole card inside the frame.</p>
      </div>
      <span aria-hidden="true" style={{ position: 'relative', width: 250, height: 158, borderRadius: 14, border: '2px solid rgba(126,205,255,0.6)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'linear-gradient(90deg, transparent, #7ecdff, transparent)', boxShadow: '0 0 14px 3px rgba(126,205,255,0.55)', animation: 'faceSweep 1.7s ease-in-out infinite' }} />
        <Icon name="id-card" size={44} color="rgba(255,255,255,0.45)" />
      </span>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Reading your document…</p>
    </div>
  );
}

// 1c-bis · the lookup itself: a real call to the issuing agency
export function GovCheck({ st }) {
  return (
    <Screen center>
      <Spinner iconName="search-check" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Checking your information</h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-3)' }}>
          We are asking {govIdAgencyFor(st.govIdType)} whether this document matches a record. This takes a moment.
        </p>
      </div>
    </Screen>
  );
}

// 1c-ter · the lookup came back empty
export function NoRecord({ st, on }) {
  return (
    <Screen onBack={on.noRecordAnotherDoc}>
      <IconBadge name="search-x" tone="warning" />
      <Heading
        title="We found no record linked to that document"
        sub={`${st.govIdType || 'That document'} did not match anything at ${govIdAgencyFor(st.govIdType)}. Check the number, try another document, or carry on and we will confirm you a different way.`}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row icon="id-card" title="Try another document" sub="A different agency may hold your record" onClick={on.noRecordAnotherDoc} />
        <Row icon="user-plus" title="Create my account" sub="Enter your details and upload a document for review" onClick={on.noRecordManual} />
      </div>
    </Screen>
  );
}

// STEP 2 · CONFIRM · only a first name is shown until the citizen claims it
export function ConfirmId({ st, on, persona }) {
  const first = (persona.name || 'there').split(' ')[0];
  const initial = (persona.initials || first.charAt(0)).charAt(0);
  return (
    <Screen onBack={on.govIdBack} gap={18}>
      <Heading title="Is this you?" sub="We found one record with that number. This is all we can show until you tell us it is yours." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 20, borderRadius: 18, border: '1px solid var(--brand-600)', background: 'var(--brand-100)' }}>
        <span aria-hidden="true" style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 999, background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 }}>{initial}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>{first}</span>
          <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>One record held by {govIdAgencyFor(st.govIdType)}</span>
        </span>
      </div>
      <PrimaryButton onClick={on.confirmIsMe}>Yes, that's me</PrimaryButton>
      <SecondaryButton onClick={on.confirmNotMe}>No, that's not me</SecondaryButton>
    </Screen>
  );
}

// STEP 2b · NOT ME · nothing is revealed, nothing is linked
export function NotMe({ on }) {
  return (
    <Screen gap={18}>
      <IconBadge name="user-x" tone="warning" />
      <Heading title="Choose what to do next" sub="You can try again with different information, or report the issue for review." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row icon="rotate-ccw" iconBg="var(--brand-600)" iconFg="#fff" border="var(--brand-600)" title="Try again" sub="Enter your information and search again." onClick={on.notMeTryAgain} />
        <Row icon="flag" title="Report an issue" sub="Tell us if you believe your information is missing or incorrect." onClick={on.notMeReport} />
      </div>
    </Screen>
  );
}

// STAGE 2 · CREATE · the contact government holds, not one the citizen types
export function GovContact({ st, on }) {
  const contacts = st.otpSource === 'manual'
    ? [
      { id: 'phone', icon: 'smartphone', label: 'Text message', value: st.manualFields.phone || '••• ••• 4820', pick: () => on.manualSendCode('phone') },
      { id: 'email', icon: 'mail', label: 'Email', value: st.manualFields.email || 'your email', pick: () => on.manualSendCode('email') },
    ]
    : [
      { id: 'phone', icon: 'smartphone', label: 'Text message', value: st.govCitizen?.phoneMasked || '••• ••• 4820', pick: () => on.govSendCode('phone') },
      { id: 'email', icon: 'mail', label: 'Email', value: st.govCitizen?.emailMasked || 'n••••••@example.gy', pick: () => on.govSendCode('email') },
    ];
  return (
    <Screen onBack={on.govIdBack}>
      <Heading
        eyebrow={st.otpSource === 'manual' ? 'Confirm your contact' : govIdAgencyFor(st.govIdType)}
        title="Where should we send the code?"
        sub={st.otpSource === 'manual'
          ? 'We send a code to the details you just gave us, so we know they reach you.'
          : 'Government has these for you. Pick the one you can check right now.'}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {contacts.map((c) => <Row key={c.id} icon={c.icon} title={c.label} sub={c.value} onClick={c.pick} />)}
      </div>
      <TextButton onClick={on.govContactWrong}>I can't use either of these</TextButton>
    </Screen>
  );
}

// STAGE 2b · neither registered contact reaches the citizen
export function ContactHelp({ on }) {
  return (
    <Screen onBack={on.contactHelpBack}>
      <Heading title="No way to reach you?" sub="The phone and email above are the ones government has on record. If neither works, here is what you can do." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row icon="id-card" title="Try a different document" sub="Another agency may hold a contact you still use" onClick={on.contactHelpOtherDoc} />
        <Row icon="file-up" title="Enter my details and upload a document" sub="An officer checks it, and you can explore the app meanwhile" onClick={on.contactHelpManual} />
      </div>
      <InfoBox tone="neutral" plain>To change the phone or email government holds for you, visit the agency that issued your document. We cannot change it here.</InfoBox>
    </Screen>
  );
}
