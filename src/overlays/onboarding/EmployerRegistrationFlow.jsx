import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

// ---- copy fixtures (mirrors the source's empRegRows / empRegSteps) ----
const EMPLOYER_NAME = 'Devcon Construction Ltd.'; // matches NOTIFICATIONS / NIS_ACTIVITY mock data
const REGISTERED_ON = '30 July 2026';

const WHAT_HAPPENS_STEPS = [
  { icon: 'shield-check', title: 'Your NIS record is connected', sub: "You'll be able to see your contributions as they are reported." },
  { icon: 'briefcase', title: 'Your employment is added to your record', sub: 'This employer will appear in your NIS employment history.' },
  { icon: 'bell', title: 'You will get alerted if needed', sub: "If information is missing or doesn't match, you can review it in the app." },
];

function InfoRow({ label, value, mono, masked, onRevealTap }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14 }}>
      <span style={{ flexShrink: 0, fontSize: 13.5, color: 'var(--fg-3)' }}>{label}</span>
      <span
        onClick={masked ? onRevealTap : undefined}
        style={{
          flex: 1, minWidth: 0, textAlign: 'right', fontSize: 15, fontWeight: 700, lineHeight: 1.35,
          color: masked ? 'var(--fg-4)' : 'var(--fg-1)', fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          cursor: masked ? 'pointer' : 'default', letterSpacing: masked ? '0.06em' : 0,
          transition: 'color var(--dur-base) var(--ease-out)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function EmployerRegistrationFlow() {
  const { isOpen, closeOverlay, persona, showToast, navigate, connectAgency } = useAppState();
  const open = isOpen('empReg');

  // eslint-disable-next-line no-unused-vars -- setter used below; the value is not read
  const [, setResolved] = useState(null); // null | 'confirmed' | 'disputed'

  const [masked, setMasked] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [phase, setPhase] = useState('review'); // 'review' | 'dispute-confirm' | 'matching' | 'success'

  const close = () => {
    closeOverlay('empReg');
    setPhase('review');
  };

  const reveal = () => {
    if (revealing) return;
    setRevealing(true);
    setTimeout(() => { setRevealing(false); setMasked(false); }, 1400);
  };

  const confirm = () => {
    setPhase('matching');
    setTimeout(() => {
      setPhase('success');
      setResolved('confirmed');
      // Employer details confirmed — the pending notice on the NIS hub clears.
      connectAgency('nis', { nisEmployerPending: false, nisEmployerConfirmed: true });
    }, 1500);
  };

  const askDispute = () => setPhase('dispute-confirm');
  const cancelDispute = () => setPhase('review');
  const submitDispute = () => {
    setResolved('disputed');
    // Disputed — NIS follows up; nothing more is asked of the citizen in-app.
    connectAgency('nis', { nisEmployerPending: false, nisEmployerDisputed: true });
    closeOverlay('empReg');
    setPhase('review');
    showToast('Reported — NIS will contact you within 5 working days');
  };

  const nisNumberDisplay = masked ? '••• ••• ••4' : (persona.nisNumber || 'Will be assigned once confirmed');
  const salaryDisplay = masked ? 'G$ •••,•••' : 'G$ 148,000 / month';

  return (
    <>
      {open && (
      <div data-agency="nis" style={{ position: 'absolute', inset: 0, zIndex: 115, display: 'flex', flexDirection: 'column', background: 'var(--surface-1)', animation: 'pageSlideIn var(--dur-slow) var(--ease-emphasis)' }}>
        <div style={{ flexShrink: 0, padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16, background: 'linear-gradient(150deg, #00563a 0%, #009b67 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="press focus-ring" onClick={close} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Icon name="x" size={17} color="#fff" />
            </button>
            <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 800, color: '#fff' }}>National Insurance Scheme</h1>
          </div>
          {phase === 'review' && (
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Registered on {REGISTERED_ON}</span>
              <h2 style={{ margin: '6px 0 0', fontSize: 23, fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>{EMPLOYER_NAME} registered you with NIS</h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.88)' }}>Confirm that you work for this employer and that the details below are correct.</p>
            </div>
          )}
          {phase === 'dispute-confirm' && (
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>Report this registration</h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.88)' }}>We'll flag this for NIS to review — nothing is connected to your account while it's under review.</p>
            </div>
          )}
        </div>

        {phase === 'review' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11.5, color: 'var(--fg-3)' }}>What your employer filed</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 17, borderRadius: 16, background: 'var(--surface-2)' }}>
                  <InfoRow label="Employer" value={EMPLOYER_NAME} />
                  <InfoRow label="Employer NIS no." value="1042-887" />
                  <InfoRow label="Your job title" value="Warehouse Supervisor" />
                  <InfoRow label="Start date" value="27 July 2026" />
                  <div style={{ height: 1, background: 'var(--surface-hairline)', margin: '2px 0' }} />
                  <InfoRow label="Your NIS number" value={nisNumberDisplay} mono masked={masked} onRevealTap={reveal} />
                  <InfoRow label="Declared earnings" value={salaryDisplay} mono masked={masked} onRevealTap={reveal} />
                </div>
                {masked && (
                  <button
                    className="press focus-ring" onClick={reveal} disabled={revealing}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 56, padding: '11px 14px', border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={revealing ? 'loader-circle' : 'scan-face'} size={16} color="var(--agency-accent-strong)" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{revealing ? 'Checking your face…' : 'Verify to reveal these details'}</span>
                      <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>{revealing ? 'Matching against your e-ID record' : 'Face or fingerprint check on this device'}</span>
                    </span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11.5, color: 'var(--fg-3)' }}>What happens when you confirm</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {WHAT_HAPPENS_STEPS.map((st) => (
                    <div key={st.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 2px' }}>
                      <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'rgba(0,155,103,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={st.icon} size={14} color="#00764f" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{st.title}</span>
                        <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>{st.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0, padding: '14px 20px 26px', borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button fullWidth size="lg" onClick={confirm}>Yes, this is my job</Button>
              <Button variant="outline" fullWidth onClick={askDispute}>I don't recognise this employer</Button>
            </div>
          </>
        )}

        {phase === 'dispute-confirm' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--status-warning-bg)' }}>
                <Icon name="triangle-alert" size={16} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>If this employer or these details are wrong, NIS will contact you within 5 working days to sort it out. Nothing is added to your record until then.</p>
              </div>
            </div>
            <div style={{ flexShrink: 0, padding: '14px 20px 26px', borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="danger" fullWidth onClick={submitDispute}>Report to NIS</Button>
              <Button variant="outline" fullWidth onClick={cancelDispute}>Cancel</Button>
            </div>
          </>
        )}

        {phase === 'matching' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 26px', textAlign: 'center' }}>
            <span style={{ position: 'relative', width: 76, height: 76, borderRadius: 999, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', inset: -6, borderRadius: 999, border: '2px solid transparent', borderTopColor: 'var(--agency-accent)', animation: 'faceArcSpin 1.1s linear infinite' }} />
              <Icon name="shield-check" size={32} color="var(--agency-accent-strong)" />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)' }}>Confirming with NIS</h2>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 260 }}>Activating your record and linking {EMPLOYER_NAME} to your employment history.</p>
            </div>
          </div>
        )}

        {phase === 'success' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
                <span style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'successIconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  <Icon name="shield-check" size={30} color="var(--agency-accent-strong)" />
                </span>
                <div style={{ animation: 'successFadeUp 0.4s ease-out 0.1s both' }}>
                  <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>NIS record active</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{EMPLOYER_NAME} is now on your NIS employment history, and your contributions will show here as they're reported.</p>
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, padding: '14px 20px 24px', borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button fullWidth onClick={() => { close(); navigate('nis'); }}>Open NIS</Button>
              <Button variant="outline" fullWidth onClick={() => { close(); navigate('home'); }}>Back to Home</Button>
            </div>
          </>
        )}
      </div>
      )}
    </>
  );
}
