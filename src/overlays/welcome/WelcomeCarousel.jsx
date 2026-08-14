import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';

const CAPABILITIES = [
  { icon: 'fingerprint', label: 'e-ID', color: '#8b2346' },
  { icon: 'file-check-2', label: 'Certificates', color: '#142b44' },
  { icon: 'calendar-check', label: 'Appointments', color: '#6d4bd8' },
  { icon: 'route', label: 'Track applications', color: '#2563c9' },
  { icon: 'hand-coins', label: 'Benefits & pension', color: '#009b67' },
  { icon: 'receipt', label: 'Pay bills', color: '#404293' },
  { icon: 'zap-off', label: 'Report outages', color: '#b45f16' },
  { icon: 'wallet', label: 'Wallet documents', color: '#142b44' },
];

const HOW_IT_WORKS = [
  { n: '1', icon: 'fingerprint', title: 'Prove who you are, once', body: 'Apply for your e-ID so every service here already knows who you are.' },
  { n: '2', icon: 'plus', title: 'Add the agencies you use', body: 'NIS, electricity and more join your Home one at a time — never all at once.' },
  { n: '3', icon: 'wallet', title: 'Everything lands in your Wallet', body: 'Cards, receipts and certificates stay with you, ready when an office asks.' },
];

// A hand-rolled bottom sheet (rather than the shared Sheet component) because
// step 0 needs a dark hero background that the other two steps don't share.
export default function WelcomeCarousel() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('welcome');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const close = () => closeOverlay('welcome');
  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const start = () => {
    showToast('Welcome to My Guyana');
    closeOverlay('welcome');
  };

  const isHero = step === 0;
  const sheetBg = isHero ? 'var(--hero-navy-gradient)' : 'var(--surface-1)';
  const handleBg = isHero ? 'rgba(255,255,255,0.3)' : 'var(--surface-border)';
  const closeBg = isHero ? 'rgba(255,255,255,0.16)' : 'var(--surface-4)';
  const closeFg = isHero ? '#fff' : 'var(--fg-2)';

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 220, display: 'flex', alignItems: 'flex-end', background: 'rgba(6,12,24,0.62)', animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)' }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Welcome to My Guyana"
        style={{
          width: '100%', maxHeight: '88%', overflowY: 'auto', background: sheetBg,
          borderRadius: '26px 26px 0 0', boxShadow: '0px 12px 30px 12px rgba(203,229,255,0.2)',
          padding: '10px 20px 26px', display: 'flex', flexDirection: 'column', gap: 18,
          animation: 'sheetSlideUp var(--dur-slow) var(--ease-emphasis)',
          border: '1px solid rgba(69,119,208,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginTop: 6 }}>
          <span style={{ width: 32, flexShrink: 0 }} />
          <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 40, height: 5, borderRadius: 100, background: handleBg }} />
          </span>
          <button
            className="press focus-ring"
            onClick={close}
            aria-label="Close"
            style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: 'none', background: closeBg, color: closeFg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {step === 0 && (
          <div style={{ position: 'relative', flexShrink: 0, margin: '-18px -20px -18px', padding: '38px 24px 30px', color: '#fff', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <span aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: -70, top: -60, width: 220, height: 220, borderRadius: 999, border: '1px solid rgba(255,255,255,0.13)' }} />
            <span aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: -40, bottom: -96, width: 190, height: 190, borderRadius: 999, background: 'rgba(139,35,70,0.32)' }} />
            <span aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', left: -60, bottom: -70, width: 140, height: 140, borderRadius: 999, background: 'rgba(0,155,103,0.16)' }} />
            <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 15, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon name="landmark" size={22} color="#fff" />
            </span>
            <span style={{ position: 'relative', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Welcome to My Guyana</span>
            <h2 style={{ position: 'relative', margin: 0, fontSize: 31, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fff', maxWidth: '90%' }}>One app,<br />one government</h2>
            <p style={{ position: 'relative', margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', maxWidth: '94%' }}>
              It starts with your identity, then grows as you add the agencies you use.
            </p>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Everything in one place</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Here's all you can do</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 10px', padding: '6px 2px 2px' }}>
              {CAPABILITIES.map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.icon} size={20} color={c.color} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.3 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, paddingBottom: 4 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Getting started</span>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>How My Guyana works</h2>
            </div>
            {HOW_IT_WORKS.map((w) => (
              <div key={w.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, paddingBottom: 16 }}>
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 999, background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>
                  {w.n}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.3 }}>{w.title}</span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{w.body}</span>
                </span>
                <Icon name={w.icon} size={16} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 5 }} />
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                height: 6, width: i === step ? 20 : 6, borderRadius: 999,
                background: i === step ? (isHero ? '#fff' : 'var(--brand-600)') : (isHero ? 'rgba(255,255,255,0.28)' : 'var(--surface-4)'),
                transition: 'width var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0 }}>
          {step === 2 && (
            <button className="press focus-ring" onClick={start} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Get started
            </button>
          )}
          {step === 0 && (
            <button className="press focus-ring" onClick={next} style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: '#fff', color: 'var(--brand-700)', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Continue
            </button>
          )}
          {step === 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="press focus-ring" onClick={back} style={{ flex: 1, minHeight: 50, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Back
              </button>
              <button className="press focus-ring" onClick={next} style={{ flex: 2, minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue
              </button>
            </div>
          )}
          {step === 2 && (
            <button className="press focus-ring" onClick={back} style={{ width: '100%', minHeight: 44, border: 'none', borderRadius: 14, background: 'none', color: 'var(--fg-3)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back
            </button>
          )}
          {step === 0 && (
            <button className="press focus-ring" onClick={close} style={{ width: '100%', minHeight: 44, border: 'none', borderRadius: 14, background: 'none', color: 'rgba(255,255,255,0.66)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Look around first
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
