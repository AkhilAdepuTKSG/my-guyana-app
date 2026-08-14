import { Screen, Heading, Row, TextButton, Spacer } from './ui';
import { RECOVERY_REASONS, RECOVERY_FIX_COPY } from './authData';

// alternative entry: no code possible — ask why before offering a route
export function Recovery({ on }) {
  return (
    <Screen onBack={on.recoveryBack} gap={14}>
      <Heading title="What went wrong?" sub="Tell us what happened and we will point you at the quickest way in." />
      {RECOVERY_REASONS.map((rr) => (
        <Row key={rr.id} icon={rr.icon} title={rr.title} sub={rr.sub} onClick={() => on.pickRecoveryReason(rr.id)} />
      ))}
    </Screen>
  );
}

// recovery · the route that fits the reason; a centre only if nothing digital works
export function RecoveryFix({ st, on }) {
  const copy = RECOVERY_FIX_COPY[st.recoveryReason] || { title: 'What we can do', sub: 'Pick the route that fits.' };
  const options = {
    wrong: [
      { id: 'edit', icon: 'pencil', title: 'Change my number or email', sub: 'Type it again and we send a new code', pick: on.recoveryEditContact },
    ],
    noarrive: [
      { id: 'resend', icon: 'rotate-ccw', title: 'Send the code again', sub: 'To the same number or email', pick: on.recoveryResend },
      { id: 'switch', icon: 'mail', title: 'Send it to my email instead', sub: 'Check spam if it does not show up', pick: on.recoverySwitchChannel },
    ],
    lost: [
      { id: 'card', icon: 'id-card', title: 'Use a government document', sub: 'Pick which one you have, then scan it or type the number. No code needed.', pick: on.recoveryUseDocument },
      { id: 'face', icon: 'scan-face', title: 'Verify with my face', sub: 'A live check against the photo government already holds', pick: on.recoveryFace },
    ],
    other: [
      { id: 'ask', icon: 'sparkles', title: 'Ask Gov', sub: 'Describe the problem and get pointed the right way', pick: on.recoveryAskGov },
    ],
  }[st.recoveryReason] || [];

  return (
    <Screen onBack={on.recoveryFixBack} gap={14}>
      <Heading title={copy.title} sub={copy.sub} />
      {options.map((o) => <Row key={o.id} icon={o.icon} title={o.title} sub={o.sub} onClick={o.pick} />)}
      <Spacer />
      <TextButton onClick={on.recoveryCentre}>Still stuck? Find a service centre</TextButton>
    </Screen>
  );
}
