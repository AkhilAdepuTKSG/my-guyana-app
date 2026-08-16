import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { isBiometricSupported, hasEnrolledBiometric, enrolBiometric, clearBiometric } from '../auth/biometric';

// Manage Face ID / biometric for THIS device from the profile. Lets a signed-in
// citizen turn it on, turn it off, or re-register — the fix for a passkey that
// was removed from the browser/OS (the app can't detect that on its own, so it
// offers an explicit "set up again").
export default function BiometricSettings() {
  const { persona, showToast } = useAppState();
  const [supported, setSupported] = useState(null); // null = probing
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    isBiometricSupported().then((s) => {
      if (!alive) return;
      setSupported(s);
      setEnrolled(hasEnrolledBiometric());
    });
    return () => { alive = false; };
  }, []);

  if (supported === false) return null; // no platform biometric here — nothing to manage

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
      <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Sign-in security</h2>
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
    </div>
  );
}
