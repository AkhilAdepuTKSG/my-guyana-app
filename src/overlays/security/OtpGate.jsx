import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

// Reusable one-time-code confirmation, layered above any flow. Opened via
// requireOtp({ title, message, confirmLabel, onConfirm }) from AppStateContext —
// on a valid code it closes and runs onConfirm(), so every submission / request /
// payment / change can gate its final action behind a code with one wrapper.
export default function OtpGate() {
  const { isOpen, closeOverlay, getPayload, user, showToast } = useAppState();
  const open = isOpen('otpGate');
  const raw = getPayload('otpGate');
  const payload = raw && typeof raw === 'object' ? raw : {};
  const channel = user?.gov?.phoneMasked || '••• ••• 4820';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setOtp(''); setError(''); } }, [open]);

  if (!open) return null;

  const verify = () => {
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter the 6-digit code we sent you.'); return; }
    if (otp === '000000') { setError('That code is wrong. Check it and try again.'); return; }
    const fn = payload.onConfirm;
    closeOverlay('otpGate');
    if (typeof fn === 'function') fn();
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', background: 'rgba(9,26,43,0.5)', animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)' }}
      onClick={() => closeOverlay('otpGate')}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: 'var(--surface-1)', borderRadius: '24px 24px 0 0', padding: '10px 20px 28px', animation: 'sheetSlideUp var(--dur-slow) var(--ease-emphasis)' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--surface-4)', margin: '6px auto 16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield-check" size={22} color="var(--brand-700)" />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>{payload.title || "Confirm it's you"}</h2>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              {payload.message || `Enter the one-time code we sent to ${channel} to confirm this request.`}
            </p>
          </div>
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="go" placeholder="000000"
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
            aria-label="One-time code"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 54, padding: '13px 15px', borderRadius: 13,
              border: `1.5px solid ${error ? 'var(--status-error)' : 'var(--surface-border)'}`, background: 'var(--surface-2)',
              fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.35em', textAlign: 'center', color: 'var(--fg-1)', outline: 'none',
            }}
          />
          {error && (
            <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--status-error)' }}>
              <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{error}
            </p>
          )}
          <Button fullWidth onClick={verify}>{payload.confirmLabel || 'Confirm'}</Button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <button
              className="press focus-ring"
              onClick={() => { setOtp(''); setError(''); showToast('New code sent'); }}
              style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, fontFamily: 'inherit' }}
            >
              Send a new code
            </button>
            <button
              className="press focus-ring"
              onClick={() => closeOverlay('otpGate')}
              style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, fontFamily: 'inherit' }}
            >
              Cancel
            </button>
          </div>
          <p style={{ margin: 0, textAlign: 'center', fontSize: 11, lineHeight: 1.5, color: 'var(--fg-4)' }}>Demo: any six digits confirm. Type 000000 to see the error.</p>
        </div>
      </div>
    </div>
  );
}
