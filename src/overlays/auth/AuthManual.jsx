import Icon from '../../components/ui/Icon';
import {
  Screen, Heading, IconBadge, PrimaryButton, SecondaryButton, Field,
  InfoBox, InfoRow, ListCard, Spacer,
} from './ui';
import { MANUAL_COUNTRIES, MANUAL_GENDERS, DOC_TYPES } from './authData';

const selectStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};
const smallFieldStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};

// STAGE 3 · nothing matched · the citizen tells us who they are
export function Manual({ st, on }) {
  const m = st.manualFields;
  return (
    <Screen onBack={on.authStepBack} gap={18}>
      <InfoBox tone="info">We could not find you in government records, so we will ask you a few things instead.</InfoBox>
      <Heading title="Personal details" sub="A few details about you, so we can set up your account." />

      <button
        className="press focus-ring" onClick={on.manualScanFill}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '13px 15px', borderRadius: 16, border: '1.5px dashed var(--brand-600)', background: 'var(--brand-100)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size={18} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Scan a document to fill this in</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>Faster than typing — we read your details off it</span>
        </span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="First name">
          <input value={m.first} onChange={(e) => on.updateManual('first', e)} placeholder="e.g. Maya" style={smallFieldStyle} />
        </Field>
        <Field label="Last name">
          <input value={m.last} onChange={(e) => on.updateManual('last', e)} placeholder="e.g. Singh" style={smallFieldStyle} />
        </Field>
        <Field label="Date of birth">
          <input type="date" value={m.dob} onChange={(e) => on.updateManual('dob', e)} style={smallFieldStyle} />
        </Field>
        <Field label="Country of origin">
          <select value={m.country} onChange={(e) => on.updateManual('country', e)} style={selectStyle}>
            {MANUAL_COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Email address">
          <input type="email" value={m.email} onChange={(e) => on.updateManual('email', e)} placeholder="e.g. name@example.gy" style={smallFieldStyle} />
        </Field>
        <Field label="Password" hint="A backup for the days a code cannot reach you.">
          <input type="password" value={m.password} onChange={(e) => on.updateManual('password', e)} placeholder="At least 8 characters" style={smallFieldStyle} />
        </Field>
        <Field label="Mobile number">
          <input type="tel" value={m.phone} onChange={(e) => on.updateManual('phone', e)} placeholder="e.g. 677 4820" style={smallFieldStyle} />
        </Field>
        <Field label="Gender">
          <select value={m.gender} onChange={(e) => on.updateManual('gender', e)} style={selectStyle}>
            {MANUAL_GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>
            Citizenship document
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--surface-4)', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--fg-3)' }}>Optional</span>
          </span>
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>It helps government confirm who you are sooner. You can add it later if you don't have it now.</span>
        </div>
        <select aria-label="Document type" value={st.docType} onChange={on.updateDocType} style={{ ...selectStyle, background: 'var(--surface-1)' }}>
          {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <input aria-label="Document number" type="text" value={st.manualDocNo} onChange={on.updateManualDocNo} placeholder="Document number" style={{ ...smallFieldStyle, background: 'var(--surface-1)' }} />
        <button
          className="press focus-ring" onClick={on.pickUpload}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            width: '100%', minHeight: 96, padding: 16,
            border: `1.5px dashed ${st.docUploaded ? 'var(--status-success)' : 'var(--surface-border)'}`,
            borderRadius: 14, background: st.docUploaded ? 'var(--status-success-bg)' : 'var(--surface-1)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name={st.docUploaded ? 'check-circle-2' : 'upload'} size={22} color={st.docUploaded ? 'var(--status-success)' : 'var(--fg-3)'} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{st.docUploaded ? 'Document attached' : 'Add a photo or file'}</span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{st.docUploaded ? 'Tap again to remove' : 'JPG, PNG or PDF · max 10 MB'}</span>
        </button>
      </div>

      <PrimaryButton onClick={on.manualSubmit}>Create my account</PrimaryButton>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>
        You can start using My Guyana right away. Your own records open once government confirms who you are.
      </p>
    </Screen>
  );
}

// STAGE 3b · a document was given: an officer checks it, 24-48h
export function Review({ on }) {
  return (
    <Screen>
      <IconBadge name="clock" tone="info" />
      <Heading title="We are checking your document" sub="An officer reviews it, usually within 24 to 48 hours. You do not have to wait here — we will tell you the moment it is done." />
      <ListCard>
        <InfoRow icon="check" iconColor="var(--status-success)">You can use My Guyana while you wait — browse services, save what interests you.</InfoRow>
        <InfoRow icon="lock" last>Applying for services opens once your identity is confirmed.</InfoRow>
      </ListCard>
      <Spacer />
      <PrimaryButton onClick={on.reviewContinue}>Continue into My Guyana</PrimaryButton>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="press focus-ring" onClick={on.reviewDemoPass} style={{ flex: 1, minHeight: 42, border: '1px dashed var(--surface-border)', borderRadius: 12, background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--fg-4)', cursor: 'pointer' }}>Demo: it passes</button>
        <button className="press focus-ring" onClick={on.reviewDemoFail} style={{ flex: 1, minHeight: 42, border: '1px dashed var(--surface-border)', borderRadius: 12, background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--fg-4)', cursor: 'pointer' }}>Demo: it fails</button>
      </div>
    </Screen>
  );
}

// STAGE 3c · no document yet (or a failed one): the account works, applying does not
export function Limited({ st, on }) {
  const failed = st.limitedReason === 'failed';
  return (
    <Screen>
      <IconBadge name="compass" tone="neutral" />
      <Heading
        title={failed ? 'We could not confirm that document' : 'Your account is ready — with limits'}
        sub={failed
          ? 'The document did not match a government record. You can try another one, or visit a service centre to sort it out in person.'
          : 'Without a document we cannot confirm who you are yet, so applying for services stays closed. You can still look around.'}
      />
      <ListCard>
        <InfoRow icon="check" iconColor="var(--status-success)">Browse every service, agency and office, and see what each one needs.</InfoRow>
        <InfoRow icon="lock" last>Applying, paying and personal records stay closed until we confirm who you are.</InfoRow>
      </ListCard>
      <Spacer />
      <PrimaryButton onClick={on.limitedAddDoc}>Add a document now</PrimaryButton>
      <SecondaryButton onClick={on.reviewContinue}>Explore My Guyana for now</SecondaryButton>
    </Screen>
  );
}
