import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';

// #3 — Citizens who registered with a TIN / passport / National ID / licence
// (i.e. not an e-ID) land with an incomplete profile. This is the short form
// that fills in the missing details and flips session.user.profileComplete,
// which clears the Home prompt.
const EMPTY = { email: '', phone: '', address: '', region: '', occupation: '', dob: '' };

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>{hint}</span>}
    </div>
  );
}

export default function CompleteProfileFlow() {
  const { isOpen, closeOverlay, persona, user, updateUser, showToast, addNotification } = useAppState();
  const open = isOpen('completeProfile');
  const [fields, setFields] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setFields({ ...EMPTY }); setSubmitting(false); }
  }, [open]);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  // The details government still needs before records/services open up.
  const required = ['email', 'phone', 'address', 'occupation'];
  const complete = required.every((k) => fields[k].trim());
  const filledCount = required.filter((k) => fields[k].trim()).length;

  const submit = () => {
    if (!complete) return;
    setSubmitting(true);
    updateUser({ profileComplete: true, profile: { ...fields } });
    addNotification({
      agency: 'mops', icon: 'user-round-check', title: 'Profile completed',
      body: 'Thanks — your personal records and services are unlocking across My Guyana.',
    });
    showToast('Profile completed — your records are unlocking');
    closeOverlay('completeProfile');
  };

  const method = user?.method && user.method !== 'returning' ? user.method : 'your document';

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('completeProfile')} title="Complete your profile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 16, background: 'var(--brand-100)', border: '1px solid var(--brand-200, var(--surface-border))' }}>
          <Icon name="id-card" size={20} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            You signed up with <strong>{method}</strong>. Add the details below so government can finish setting up your account and open your personal records.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-4)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(filledCount / required.length) * 100}%`, background: 'var(--brand-600)', transition: 'width 160ms ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-3)' }}>{filledCount}/{required.length}</span>
        </div>

        <Field label="Full name">
          <input value={persona?.name || ''} readOnly style={{ ...fieldStyle, background: 'var(--surface-4)', color: 'var(--fg-3)' }} />
        </Field>
        <Field label="Email address">
          <input type="email" value={fields.email} onChange={set('email')} placeholder="you@example.gy" style={fieldStyle} />
        </Field>
        <Field label="Mobile number">
          <input type="tel" value={fields.phone} onChange={set('phone')} placeholder="e.g. 677 4820" style={fieldStyle} />
        </Field>
        <Field label="Home address">
          <input value={fields.address} onChange={set('address')} placeholder="Lot, street, village/ward" style={fieldStyle} />
        </Field>
        <Field label="Occupation">
          <input value={fields.occupation} onChange={set('occupation')} placeholder="e.g. Teacher" style={fieldStyle} />
        </Field>
        <Field label="Date of birth" hint="Optional — helps match your government records.">
          <input type="date" value={fields.dob} onChange={set('dob')} style={fieldStyle} />
        </Field>

        <Button style={{ opacity: complete ? 1 : 0.5 }} disabled={!complete || submitting} onClick={submit}>
          {submitting ? 'Saving…' : 'Save and finish'}
        </Button>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>
          You can update these any time from your profile.
        </p>
      </div>
    </PageOverlay>
  );
}
