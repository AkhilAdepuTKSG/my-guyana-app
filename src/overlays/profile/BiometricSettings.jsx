import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import MissingBadge from '../../components/ui/MissingBadge';
import { useAppState } from '../../state/AppStateContext';
import { isBiometricSupported, hasEnrolledBiometric, enrolBiometric, clearBiometric } from '../auth/biometric';

// The profile's "Sign-in & Security" section: the account password and Face ID /
// biometric for THIS device. A password that was never set (the e-ID signup path
// doesn't ask for one) counts as a missing field and badges the section header
// (backlog 2.4). Face ID management is the fix for a passkey that was removed
// from the browser/OS — the app can't detect that on its own, so it offers an
// explicit "set up again".
export default function BiometricSettings() {
  const { persona, user, updateUser, requireOtp, showToast } = useAppState();
  const [supported, setSupported] = useState(null); // null = probing
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);

  // Inline password editor state.
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    let alive = true;
    isBiometricSupported().then((s) => {
      if (!alive) return;
      setSupported(s);
      setEnrolled(hasEnrolledBiometric());
    });
    return () => { alive = false; };
  }, []);

  // Driven off the profile model: the account either has a password or it doesn't.
  const passwordSet = !!user?.passwordSet;
  const missingSecurity = passwordSet ? 0 : 1;

  const savePassword = () => {
    if (pw.length < 8) { setPwError('Make the password at least 8 characters.'); return; }
    requireOtp({
      title: 'Confirm your new password',
      confirmLabel: 'Save password',
      onConfirm: () => {
        updateUser({ passwordSet: true });
        setPwOpen(false); setPw(''); setPwError('');
        showToast('Password set — you can use it to sign in');
      },
    });
  };

  const enrol = async () => {
    setBusy(true);
    const res = await enrolBiometric({ name: persona?.name || 'My Guyana citizen', displayName: persona?.name || 'My Guyana citizen' });
    setBusy(false);
    if (res.ok) { setEnrolled(true); showToast('Face ID enabled on this device'); }
    else showToast(res.message || 'Could not set up Face ID');
  };
  const reEnrol = async () => { clearBiometric(); setEnrolled(false); await enrol(); };
  const turnOff = () => { clearBiometric(); setEnrolled(false); showToast('Face ID turned off on this device'); };

  const status = supported === null ? 'Checking…' : enrolled ? 'On for this device' : 'Off — sign in uses a code or password';

  const btn = (label, onClick, primary) => (
    <button
      className="press focus-ring" onClick={onClick} disabled={busy}
      style={{
        minHeight: 38, padding: '0 14px', borderRadius: 10, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
        fontSize: 12.5, fontWeight: 700,
        border: primary ? 'none' : '1px solid var(--surface-border)',
        background: primary ? 'var(--agency-accent)' : 'var(--surface-1)',
        color: primary ? 'var(--agency-contrast, #fff)' : 'var(--fg-1)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Sign-in & Security</h2>
        <MissingBadge count={missingSecurity} />
      </div>

      {/* Password — pending until one exists on the account */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="key-round" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Password</span>
            <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: passwordSet ? 'var(--fg-2)' : 'var(--status-error)', fontWeight: passwordSet ? 500 : 700 }}>
              {passwordSet ? 'Set — a backup for when a code cannot reach you' : 'Not added yet — set one so you can always get back in'}
            </span>
          </span>
          {!passwordSet && !pwOpen && btn('Set password', () => setPwOpen(true), true)}
        </div>
        {pwOpen && (
          <>
            <input
              type="password" autoFocus placeholder="At least 8 characters"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') savePassword(); }}
              aria-label="New password"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
                border: `1px solid ${pwError ? 'var(--status-error)' : 'var(--surface-border)'}`, borderRadius: 12,
                background: 'var(--surface-2)', fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
              }}
            />
            {pwError && (
              <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--status-error)' }}>
                <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{pwError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {btn('Cancel', () => { setPwOpen(false); setPw(''); setPwError(''); }, false)}
              {btn('Save password', savePassword, true)}
            </div>
          </>
        )}
      </div>

      {/* Face ID — only when this device can do a platform biometric */}
      {supported !== false && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="scan-face" size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Face ID sign-in</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>{busy ? 'Waiting for your device…' : status}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!enrolled && btn(busy ? 'Setting up…' : 'Turn on Face ID', enrol, true)}
            {enrolled && btn('Set up again', reEnrol, false)}
            {enrolled && btn('Turn off', turnOff, false)}
          </div>
          {enrolled && (
            <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>
              Removed the passkey from your browser or phone? Tap “Set up again” to re-register.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
