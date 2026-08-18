import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Surface from '../../components/ui/Surface';
import Button from '../../components/ui/Button';
import StepProgress from '../../components/ui/StepProgress';
import { AGENCIES } from '../../state/mockData';
import { useAppState } from '../../state/AppStateContext';

// ---- copy fixtures (mirrors the source's onboardUnlocks / empRegSteps-style lists) ----
const NIS_UNLOCKS = [
  { icon: 'chart-column', label: 'View your contributions' },
  { icon: 'building-2', label: 'Check employer contributions' },
  { icon: 'file-plus-2', label: 'Apply for services' },
  { icon: 'landmark', label: 'Check your progress towards pension' },
];

// What connecting a non-NIS/GPL agency (e.g. MoPS) unlocks, with a sensible
// fallback for any other agency.
const AGENCY_UNLOCKS = {
  mops: [
    { icon: 'fingerprint', label: 'Apply for and manage your e-ID' },
    { icon: 'calendar-check', label: 'Book Service Centre appointments' },
    { icon: 'file-text', label: 'Request certificates and civil records' },
  ],
};
const DEFAULT_UNLOCKS = [
  { icon: 'file-plus-2', label: 'Apply for services online' },
  { icon: 'calendar-check', label: 'Book appointments' },
  { icon: 'bell', label: 'Get updates and reminders' },
];

// Per-agency data that connecting unlocks, so the agency's hub has content.
const DEMO_CONTRIB = { paid: 500, required: 750, weeks: 500, requiredWeeks: 750 };
const demoGplAccount = (account) => ({
  account: account && account.trim() ? (/^GPL-/i.test(account.trim()) ? account.trim() : `GPL-${account.trim()}`) : 'GPL-88213-4',
  balance: 14250, dueDate: '2026-08-28', status: 'unpaid',
  usageKwh: [210, 198, 225, 240, 230, 260, 250, 245, 238, 255, 262, 248],
});
const AGENCIES_WITH_HUB = ['nis', 'gpl', 'mops'];
const GPL_UNLOCKS = [
  { icon: 'receipt', label: 'Pay your bill in-app' },
  { icon: 'gauge', label: 'See usage history' },
  { icon: 'zap-off', label: 'Report outages' },
  { icon: 'clipboard-list', label: 'Track claims' },
];
const GPL_NEW_TIMELINE = [
  { label: 'Application submitted', note: 'GPL received your application', state: 'done' },
  { label: 'Document check', note: 'Certificate of inspection and proof of occupancy', state: 'current' },
  { label: 'Site inspection', note: '', state: 'todo' },
  { label: 'Meter installed', note: '', state: 'todo' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '11px 13px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-1)',
  fontFamily: 'inherit', fontSize: 14.5, color: 'var(--fg-1)', outline: 'none',
};

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button" className="press focus-ring" onClick={onClick}
      style={{
        minHeight: 38, padding: '0 13px', borderRadius: 999,
        border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
        background: active ? 'var(--agency-accent)' : 'var(--surface-1)',
        color: active ? '#fff' : 'var(--fg-1)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map((o) => (
          <Chip key={o} label={o} active={value === o} onClick={() => onChange(o)} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>{hint}</span>}
    </div>
  );
}

function UploadRow({ hint, uploaded, onClick }) {
  return (
    <button
      type="button" className="press focus-ring" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 56, padding: '11px 13px',
        border: `1.5px dashed ${uploaded ? 'var(--status-success)' : 'var(--surface-border)'}`,
        borderRadius: 12, background: uploaded ? 'var(--status-success-bg)' : 'var(--surface-1)',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <Icon name={uploaded ? 'check-circle-2' : 'upload'} size={18} color={uploaded ? 'var(--status-success)' : 'var(--fg-3)'} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--fg-1)' }}>{uploaded ? 'File attached' : 'Tap to upload'}</span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{hint}</span>
      </span>
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
      {title && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{title}</span>}
      {children}
    </div>
  );
}

function ConfirmRows({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 14, background: 'var(--surface-2)' }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)', flexShrink: 0 }}>{r.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function InfoNote(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
      <Icon name={props.icon || 'info'} size={16} color="var(--agency-accent-strong)" style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{props.children}</p>
    </div>
  );
}

function MatchingScreen({ icon, agencyShort, note }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 26px', textAlign: 'center' }}>
      <span style={{ position: 'relative', width: 76, height: 76, borderRadius: 999, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ position: 'absolute', inset: -6, borderRadius: 999, border: '2px solid transparent', borderTopColor: 'var(--agency-accent)', animation: 'faceArcSpin 1.1s linear infinite' }} />
        <Icon name={icon} size={32} color="var(--agency-accent-strong)" />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)' }}>Checking with {agencyShort}</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 280 }}>{note}</p>
      </div>
    </div>
  );
}

const initialGplForm = (persona) => {
  const parts = (persona.name || '').split(' ');
  return {
    serviceType: 'Residential', meterType: 'Postpaid', request: 'New service',
    certNo: '', certDate: '', certUploaded: false,
    address: '', prior: '', ownership: '', titleUploaded: false,
    surname: parts[parts.length - 1] || '', firstName: parts[0] || '', occupation: '',
    idType: 'National ID', idNumber: '', idUploaded: !!persona.verified,
    phone: '+592 674 4820', phone2: '', email: '',
    mailing: '', billing: 'E-copy to my email', agreed: false,
  };
};

function makeRef() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${d}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export default function OnboardingFlow() {
  const { isOpen, closeOverlay, openOverlay, getPayload, navigate, persona, user, showToast, connectAgency } = useAppState();
  const open = isOpen('onboard');
  const payload = getPayload('onboard');
  const otpChannel = user?.gov?.phoneMasked || '••• ••• 4820';

  const [agency, setAgency] = useState(null); // 'nis' | 'gpl' | null
  const [step, setStep] = useState('pick-agency');
  const [flowKind, setFlowKind] = useState(null); // 'nis' | 'gpl-link' | 'gpl-new'

  const [nisNumber, setNisNumber] = useState('');
  const [nisError, setNisError] = useState('');
  const [nisChecking, setNisChecking] = useState(false);

  const [gplAccount, setGplAccount] = useState('');
  const [gplAddress, setGplAddress] = useState('');
  const [gplScanning, setGplScanning] = useState(false);

  const [gplForm, setGplForm] = useState(() => initialGplForm(persona));
  const [gplNewStep, setGplNewStep] = useState(1);
  const [gplNewRef] = useState(makeRef);

  // OTP gate — every agency addition is confirmed with a one-time code before
  // anything is connected.
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpReturnStep, setOtpReturnStep] = useState('confirm');

  // Reset the whole wizard fresh every time it opens, reading the payload
  // the caller handed us (e.g. { agency: 'gpl', intent: 'new' }).
  useEffect(() => {
    if (!open) return;
    const p = payload && typeof payload === 'object' ? payload : {};
    setNisNumber(''); setNisError(''); setNisChecking(false);
    setGplAccount(''); setGplAddress(''); setGplScanning(false);
    setGplForm(initialGplForm(persona));
    setGplNewStep(1);
    setOtpValue(''); setOtpError(''); setOtpReturnStep('confirm');
    if (p.agency === 'gpl') {
      setAgency('gpl');
      setStep(p.intent === 'new' ? 'gpl-new' : 'gpl-choice');
      setFlowKind(p.intent === 'new' ? 'gpl-new' : null);
    } else if (p.agency === 'nis') {
      setAgency('nis');
      setStep('nis-number');
      setFlowKind('nis');
    } else if (p.agency && AGENCIES[p.agency]) {
      // Any other agency (MoPS, …) uses the generic connect flow.
      setAgency(p.agency);
      setStep('connect');
      setFlowKind('generic');
    } else {
      setAgency(null);
      setStep('pick-agency');
      setFlowKind(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => closeOverlay('onboard');

  const pickAgency = (id) => {
    setAgency(id);
    if (id === 'gpl') { setStep('gpl-choice'); setFlowKind(null); }
    else { setStep('nis-number'); setFlowKind('nis'); }
  };

  const goRegisterInstead = () => {
    closeOverlay('onboard');
    openOverlay('nisReg');
  };

  const submitNisNumber = () => {
    const digits = nisNumber.replace(/\D/g, '');
    if (digits.length < 7) {
      setNisError('Type your NIS number as it appears on your card — at least 7 digits.');
      return;
    }
    setNisError(''); setNisChecking(true);
    setTimeout(() => {
      setNisChecking(false);
      if (digits === '1111111') {
        setNisError('NIS has nothing under that number for your name. Check it again, or register instead.');
        return;
      }
      setFlowKind('nis');
      setStep('confirm');
    }, 1300);
  };

  const scanGplBill = () => {
    setGplScanning(true);
    showToast('Reading your bill…');
    setTimeout(() => {
      setGplScanning(false);
      setGplAccount('4471-0928');
      setGplAddress('Lot 42 Sheriff Street, Campbellville');
      showToast('Account number found on your bill');
    }, 1300);
  };

  const continueGplExisting = () => {
    if (!gplAccount.trim()) { showToast('Enter your GPL account number'); return; }
    setFlowKind('gpl-link');
    setStep('confirm');
  };

  const setGplField = (key, value) => setGplForm((f) => ({ ...f, [key]: value }));

  const gplNewNext = () => {
    if (!gplForm.address.trim()) { showToast('Add the address for the installation'); return; }
    if (!gplForm.prior) { showToast('Tell us whether there was a connection here before'); return; }
    if (!gplForm.ownership) { showToast('Select whether the property is owned or rented'); return; }
    setGplNewStep(2);
  };

  const gplNewSubmit = () => {
    if (!gplForm.surname.trim() || !gplForm.firstName.trim()) { showToast('Check your name'); return; }
    if (!gplForm.occupation.trim()) { showToast("Add your occupation"); return; }
    if (!gplForm.agreed) { showToast("Confirm the details and accept GPL's terms"); return; }
    setFlowKind('gpl-new');
    setOtpReturnStep('gpl-new'); setOtpValue(''); setOtpError(''); setStep('otp');
  };

  const confirmSubmit = () => {
    setOtpReturnStep('confirm'); setOtpValue(''); setOtpError(''); setStep('otp');
  };

  const verifyOtp = () => {
    if (otpValue.replace(/\D/g, '').length < 6) { setOtpError('Enter the 6-digit code we sent you.'); return; }
    if (otpValue === '000000') { setOtpError('That code is wrong. Check it and try again.'); return; }
    setOtpError(''); setStep('matching');
  };

  const connectGeneric = () => {
    setOtpReturnStep('connect'); setOtpValue(''); setOtpError(''); setStep('otp');
  };

  // Drive the "matching" step to its result automatically, and — once verified —
  // actually connect the agency so it persists and shows on Home.
  useEffect(() => {
    if (step !== 'matching') return;
    const t = setTimeout(() => {
      if (flowKind === 'nis') {
        connectAgency('nis', { nisAccountState: 'active', nisNumber: nisNumber.trim() || 'NIS-2201-84732', contributions: DEMO_CONTRIB });
      } else if (flowKind === 'gpl-link') {
        connectAgency('gpl', { gpl: demoGplAccount(gplAccount) });
      } else if (flowKind === 'generic' && agency) {
        connectAgency(agency);
      }
      if (flowKind === 'gpl-new') showToast('Application sent to GPL — we will track it for you');
      setStep('success');
    }, 1500);
    return () => clearTimeout(t);
  }, [step, flowKind, agency, nisNumber, gplAccount, connectAgency, showToast]);

  const handleBack = () => {
    switch (step) {
      case 'gpl-existing':
      case 'gpl-new':
        setStep('gpl-choice'); break;
      case 'confirm':
        setStep(agency === 'gpl' ? 'gpl-existing' : 'nis-number'); break;
      case 'connect':
        close(); break;
      case 'otp':
        setStep(otpReturnStep === 'gpl-new' ? 'gpl-new' : otpReturnStep === 'connect' ? 'connect' : 'confirm'); break;
      default:
        close();
    }
  };

  const finishToScreen = (screen) => {
    close();
    navigate(screen);
  };

  const agencyDef = agency ? AGENCIES[agency] : null;
  const agencyShort = agency === 'gpl' ? 'GPL' : agency === 'nis' ? 'NIS' : (agencyDef?.shortName || 'the agency');
  const agencyIcon = agency === 'gpl' ? 'zap' : agency === 'nis' ? 'shield-check' : (agencyDef?.icon || 'building-2');
  const isHubAgency = AGENCIES_WITH_HUB.includes(agency);
  const successHeading = agency === 'gpl' ? 'Electricity account linked' : agency === 'nis' ? 'NIS connected' : `${agencyDef?.shortName || 'Agency'} connected`;
  const successBody = agency === 'gpl'
    ? 'Your GPL account is now part of My Guyana. Bills, usage and outages live here from now on.'
    : agency === 'nis'
      ? 'Your NIS record is now part of My Guyana. Contributions, employer details and pension are all in one place.'
      : `${agencyDef?.name || 'This agency'} is now connected to My Guyana. Its services live here from now on.`;
  const successUnlocks = agency === 'gpl' ? GPL_UNLOCKS : agency === 'nis' ? NIS_UNLOCKS : (AGENCY_UNLOCKS[agency] || DEFAULT_UNLOCKS);
  const openLabel = agency === 'gpl' ? 'Open Electricity' : agency === 'nis' ? 'Open NIS' : `Open ${agencyDef?.shortName || 'agency'}`;
  const openTarget = isHubAgency ? agency : 'home';

  let title = 'Add an agency';
  let subtitle;
  if (agency === 'nis') { title = 'Connect NIS'; subtitle = 'National Insurance Scheme'; }
  else if (agency === 'gpl') { title = 'Connect GPL'; subtitle = 'Guyana Power & Light'; }
  else if (agencyDef) { title = `Connect ${agencyDef.shortName}`; subtitle = agencyDef.name; }
  if (step === 'otp') { title = "Confirm it's you"; subtitle = undefined; }
  if (step === 'matching') { title = `Checking with ${agencyShort}`; subtitle = undefined; }
  if (step === 'success') { title = flowKind === 'gpl-new' ? 'Application submitted' : "You're connected"; subtitle = undefined; }

  return (
    <PageOverlay open={open} onClose={handleBack} title={title} subtitle={subtitle} agency={agency || undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100%' }}>

        {step === 'pick-agency' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="ds-body" style={{ margin: 0 }}>Which agency would you like to add?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Surface interactive onClick={() => pickAgency('nis')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, cursor: 'pointer' }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'rgba(0,121,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="shield-check" size={18} color="#00674c" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>National Insurance Scheme</span>
                  <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Contributions, benefits and pension</span>
                </span>
                <Icon name="chevron-right" size={17} color="var(--fg-4)" />
              </Surface>
              <Surface interactive onClick={() => pickAgency('gpl')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, cursor: 'pointer' }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'rgba(64,66,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="zap" size={18} color="#404293" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>Guyana Power & Light</span>
                  <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Bills, usage and connections</span>
                </span>
                <Icon name="chevron-right" size={17} color="var(--fg-4)" />
              </Surface>
            </div>
          </div>
        )}

        {step === 'nis-number' && (
          <>
            <StepProgress step={1} total={2} />
            <span className="ds-caption" style={{ color: 'var(--fg-3)' }}>Step 1 of 2 · Verify your identity</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Link your record</span>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)', lineHeight: 1.25 }}>What's your NIS number?</h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>You can find it on your NIS card or on any contribution slip. We use it to find your NIS record and check it against the name and date of birth government already has.</p>
            </div>
            <Field label="NIS number">
              <input
                type="text" inputMode="numeric" value={nisNumber} placeholder="e.g. 3 456 7890"
                onChange={(e) => { setNisNumber(e.target.value); setNisError(''); }}
                style={{ ...inputStyle, minHeight: 50, fontSize: 16, letterSpacing: '0.04em', borderColor: nisError ? 'var(--status-error)' : 'var(--surface-border)' }}
              />
              {nisError && (
                <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, lineHeight: 1.5, fontWeight: 700, color: 'var(--status-error)' }}>
                  <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{nisError}
                </p>
              )}
            </Field>
            <InfoNote icon="lock">Your record will not be linked yet. Once NIS finds the match, we check that it belongs to you before adding it to your account.</InfoNote>
            {nisChecking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, background: 'var(--surface-2)' }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, border: '2.5px solid var(--agency-accent)', borderTopColor: 'transparent', animation: 'faceArcSpin 0.9s linear infinite' }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-2)' }}>Checking with NIS…</span>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Button fullWidth onClick={submitNisNumber} disabled={nisChecking}>{nisChecking ? 'Checking…' : 'Continue'}</Button>
              <button className="press focus-ring" onClick={goRegisterInstead} style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>
                I don't have one yet — register me
              </button>
            </div>
          </>
        )}

        {step === 'gpl-choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StepProgress step={1} total={2} />
            <span className="ds-caption" style={{ color: 'var(--fg-3)' }}>Step 1 of 2 · Link your account</span>
            <p className="ds-body" style={{ margin: '6px 0 2px' }}>Do you already have a GPL account?</p>
            <Surface interactive onClick={() => setStep('gpl-existing')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="link" size={18} color="var(--agency-accent-strong)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>Yes, link my existing account</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Connect your existing GPL account number</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--fg-4)" />
            </Surface>
            <Surface interactive onClick={() => { setStep('gpl-new'); setGplNewStep(1); }} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plug" size={18} color="var(--agency-accent-strong)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>No, I need a new connection</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Apply for new electricity service with GPL</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--fg-4)" />
            </Surface>
          </div>
        )}

        {step === 'gpl-existing' && (
          <>
            <StepProgress step={1} total={2} />
            <span className="ds-caption" style={{ color: 'var(--fg-3)' }}>Step 1 of 2 · Link your account</span>
            <SectionCard>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Link your electricity account</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Your account number is on the top right of any GPL bill.</p>
              </div>
              <Field label="Account number">
                <input value={gplAccount} onChange={(e) => setGplAccount(e.target.value)} placeholder="4471-0928" style={{ ...inputStyle, minHeight: 48, fontSize: 15 }} />
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--surface-hairline)' }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>or</span>
                <span style={{ flex: 1, height: 1, background: 'var(--surface-hairline)' }} />
              </div>
              <button
                className="press focus-ring" onClick={scanGplBill} disabled={gplScanning}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '12px 14px', borderRadius: 14, border: '1px dashed var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={gplScanning ? 'loader-circle' : 'scan-line'} size={18} color="var(--agency-accent-strong)" />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{gplScanning ? 'Reading your bill…' : 'Scan a past bill'}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fg-3)' }}>Photograph any GPL bill and we read the account number for you</span>
                </span>
                {!gplScanning && <Icon name="chevron-right" size={17} color="var(--fg-4)" />}
              </button>
            </SectionCard>
            <InfoNote icon="shield-check">GPL will confirm the account is registered at your address. Nothing is shared with other agencies.</InfoNote>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={close} style={{ flex: 1 }}>Skip</Button>
              <Button onClick={continueGplExisting} style={{ flex: 2 }}>Continue</Button>
            </div>
          </>
        )}

        {step === 'gpl-new' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--fg-1)' }}>Apply for a new connection</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{gplNewStep === 2 ? 'Your details' : 'Service details'} · GPL reviews your application</p>
              </div>
              <span style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 999, background: 'var(--surface-4)', fontSize: 11, fontWeight: 800, color: 'var(--fg-3)' }}>{gplNewRef}</span>
            </div>
            <StepProgress step={gplNewStep} total={2} />

            {gplNewStep === 1 && (
              <>
                <SectionCard>
                  <ChipGroup label="Service type" options={['Residential', 'Commercial', 'Government', 'Industrial', 'Demand', 'Street light']} value={gplForm.serviceType} onChange={(v) => setGplField('serviceType', v)} />
                  <ChipGroup label="Meter type" options={['Postpaid', 'Prepaid']} value={gplForm.meterType} onChange={(v) => setGplField('meterType', v)} />
                  <ChipGroup label="Service request" options={['New service', 'Change of occupancy']} value={gplForm.request} onChange={(v) => setGplField('request', v)} />
                </SectionCard>

                <SectionCard title="Certificate of inspection">
                  <Field label="Certificate number">
                    <input value={gplForm.certNo} onChange={(e) => setGplField('certNo', e.target.value)} placeholder="e.g. CI-2026-4471" style={inputStyle} />
                  </Field>
                  <Field label="Date of certification">
                    <input type="date" value={gplForm.certDate} onChange={(e) => setGplField('certDate', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Copy of the certificate">
                    <UploadRow hint="JPG, PNG or PDF · max 10 MB" uploaded={gplForm.certUploaded} onClick={() => setGplField('certUploaded', !gplForm.certUploaded)} />
                  </Field>
                </SectionCard>

                <SectionCard title="Where the supply goes">
                  <Field label="Address for the installation" hint="Street number, street, city or area.">
                    <textarea
                      value={gplForm.address} onChange={(e) => setGplField('address', e.target.value)}
                      placeholder="Street number, street, city or area"
                      style={{ ...inputStyle, minHeight: 72, resize: 'none' }}
                    />
                  </Field>
                  <ChipGroup label="Was there a connection here before?" options={['Yes', 'No']} value={gplForm.prior} onChange={(v) => setGplField('prior', v)} />
                  <ChipGroup label="Property ownership" options={['Owned', 'Renting']} value={gplForm.ownership} onChange={(v) => setGplField('ownership', v)} />
                  <Field label="Certified title, lease or tenancy agreement">
                    <UploadRow hint="Proof of legal occupancy · JPG, PNG or PDF" uploaded={gplForm.titleUploaded} onClick={() => setGplField('titleUploaded', !gplForm.titleUploaded)} />
                  </Field>
                </SectionCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <Button fullWidth onClick={gplNewNext}>Continue to your details</Button>
                  <button className="press focus-ring" onClick={() => setStep('gpl-choice')} style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>Back</button>
                </div>
              </>
            )}

            {gplNewStep === 2 && (
              <>
                <InfoNote icon="user-check">Your name, ID and contact details come from your verified profile. Check them and change anything that is out of date.</InfoNote>

                <SectionCard title="Applicant">
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Surname"><input value={gplForm.surname} onChange={(e) => setGplField('surname', e.target.value)} style={inputStyle} /></Field>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Field label="First name"><input value={gplForm.firstName} onChange={(e) => setGplField('firstName', e.target.value)} style={inputStyle} /></Field>
                    </div>
                  </div>
                  <Field label="Occupation">
                    <input value={gplForm.occupation} onChange={(e) => setGplField('occupation', e.target.value)} placeholder="e.g. Teacher" style={inputStyle} />
                  </Field>
                  <ChipGroup label="Identification" options={['National ID', 'Passport', 'Other']} value={gplForm.idType} onChange={(v) => setGplField('idType', v)} />
                  <Field label="ID number">
                    <input value={gplForm.idNumber} onChange={(e) => setGplField('idNumber', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Copy of your ID">
                    <UploadRow hint="Already on file if your identity is verified" uploaded={gplForm.idUploaded} onClick={() => setGplField('idUploaded', !gplForm.idUploaded)} />
                  </Field>
                </SectionCard>

                <SectionCard title="Contact">
                  <Field label="Phone number"><input type="tel" value={gplForm.phone} onChange={(e) => setGplField('phone', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Another number (optional)"><input type="tel" value={gplForm.phone2} onChange={(e) => setGplField('phone2', e.target.value)} placeholder="If we cannot reach the first one" style={inputStyle} /></Field>
                  <Field label="Email address"><input type="email" value={gplForm.email} onChange={(e) => setGplField('email', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Mailing address">
                    <textarea value={gplForm.mailing} onChange={(e) => setGplField('mailing', e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: 'none' }} />
                  </Field>
                  <ChipGroup label="How would you like your bill?" options={['E-copy to my email', 'Hard copy by post']} value={gplForm.billing} onChange={(v) => setGplField('billing', v)} />
                </SectionCard>

                <button
                  className="press focus-ring" onClick={() => setGplField('agreed', !gplForm.agreed)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: 15, borderRadius: 16,
                    border: `1px solid ${gplForm.agreed ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 6,
                    border: `1.5px solid ${gplForm.agreed ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: gplForm.agreed ? 'var(--agency-accent)' : 'var(--surface-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {gplForm.agreed && <Icon name="check" size={14} color="#fff" />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--fg-1)' }}>I confirm these details are accurate</span>
                    <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>And I accept GPL's terms for electricity supply: proof of occupancy and identification, a maximum of 90 feet of secondary cable to the nearest connection point, and installed capacity within 60 amperes.</span>
                  </span>
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <Button fullWidth onClick={gplNewSubmit} style={{ opacity: gplForm.agreed ? 1 : 0.55 }}>Submit application</Button>
                  <button className="press focus-ring" onClick={() => setGplNewStep(1)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>Back to service details</button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'confirm' && (
          <>
            <StepProgress step={2} total={2} />
            <span className="ds-caption" style={{ color: 'var(--fg-3)' }}>Step 2 of 2 · Confirm</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Confirm these details</h3>
              {agency === 'gpl' ? (
                <ConfirmRows rows={[
                  { label: 'Account number', value: `GPL-${gplAccount || '—'}` },
                  { label: 'Service address', value: gplAddress || 'On file with GPL' },
                ]} />
              ) : (
                <ConfirmRows rows={[
                  { label: 'Name', value: persona.name },
                  { label: 'NIS number', value: nisNumber || persona.nisNumber || '—' },
                  { label: 'Date of birth', value: persona.dob },
                  { label: 'Employer on file', value: 'Devcon Construction Ltd.' },
                ]} />
              )}
            </div>
            <InfoNote>
              {agency === 'gpl'
                ? "GPL matches this account against the name and service address it holds, then confirms it is you before connecting anything."
                : 'NIS confirms the record is yours before anything is connected.'}
            </InfoNote>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={handleBack} style={{ flex: 1 }}>Back</Button>
              <Button onClick={confirmSubmit} style={{ flex: 2 }}>Connect {agencyShort}</Button>
            </div>
          </>
        )}

        {step === 'connect' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 14, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={agencyIcon} size={24} color="var(--agency-accent-strong)" />
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.2 }}>Connect {agencyDef?.name}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--fg-2)' }}>Add {agencyShort} to your account</p>
              </div>
            </div>
            <SectionCard title="What you'll get">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {successUnlocks.map((u) => (
                  <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Icon name={u.icon} size={19} color="var(--agency-accent-strong)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{u.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <InfoNote icon="shield-check">We confirm it&apos;s you with a one-time code before connecting {agencyShort} to your account.</InfoNote>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={close} style={{ flex: 1 }}>Cancel</Button>
              <Button onClick={connectGeneric} style={{ flex: 2 }}>Connect {agencyShort}</Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <InfoNote icon="shield-check">Adding an agency to your account needs a one-time code, so only you can connect your records.</InfoNote>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)', lineHeight: 1.25 }}>Enter your code</h2>
              <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>We sent a 6-digit code to your registered number {otpChannel}.</p>
            </div>
            <Field label="6-digit code">
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="go" placeholder="000000"
                value={otpValue}
                onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                style={{ ...inputStyle, minHeight: 52, fontSize: 22, letterSpacing: '0.35em', textAlign: 'center', fontFamily: 'var(--font-mono)', borderColor: otpError ? 'var(--status-error)' : 'var(--surface-border)' }}
              />
              {otpError && (
                <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, lineHeight: 1.5, fontWeight: 700, color: 'var(--status-error)' }}>
                  <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{otpError}
                </p>
              )}
            </Field>
            <button className="press focus-ring" onClick={() => showToast('New code sent')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--agency-accent-strong)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, padding: '0 2px' }}>
              Send a new code
            </button>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={handleBack} style={{ flex: 1 }}>Back</Button>
              <Button onClick={verifyOtp} style={{ flex: 2 }}>Verify and connect</Button>
            </div>
          </>
        )}

        {step === 'matching' && (
          <MatchingScreen
            icon={agencyIcon} agencyShort={agencyShort}
            note={`Matching this ${flowKind === 'gpl-new' ? 'application' : 'account'} against the customer details ${agencyShort} already holds.`}
          />
        )}

        {step === 'success' && flowKind === 'gpl-new' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
                <span style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'successIconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  <Icon name="plug" size={30} color="var(--agency-accent-strong)" />
                </span>
                <div style={{ animation: 'successFadeUp 0.4s ease-out 0.1s both' }}>
                  <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>Application submitted</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>GPL will review your application and schedule a site inspection. We'll track its status for you.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 2px 2px' }}>
                {GPL_NEW_TIMELINE.map((t, i) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 2px', animation: `successFadeUp 0.4s ease-out ${(0.18 + i * 0.08).toFixed(2)}s both` }}>
                    <span style={{
                      width: 22, height: 22, flexShrink: 0, borderRadius: 999, marginTop: 1,
                      background: t.state === 'done' ? 'var(--status-success)' : t.state === 'current' ? 'var(--agency-accent)' : 'var(--surface-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {t.state === 'done' && <Icon name="check" size={13} color="#fff" />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: t.state === 'todo' ? 'var(--fg-3)' : 'var(--fg-1)' }}>{t.label}</span>
                      {t.note && <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>{t.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
              <Button fullWidth onClick={() => finishToScreen('applications')}>View application status</Button>
              <Button variant="outline" fullWidth onClick={() => finishToScreen('home')}>Back to Home</Button>
            </div>
          </>
        )}

        {step === 'success' && flowKind !== 'gpl-new' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
                <span style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'successIconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  <Icon name={agencyIcon} size={30} color="var(--agency-accent-strong)" />
                </span>
                <div style={{ animation: 'successFadeUp 0.4s ease-out 0.1s both' }}>
                  <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>{successHeading}</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{successBody}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '6px 2px 2px' }}>
                {successUnlocks.map((u, i) => (
                  <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 11, animation: `successFadeUp 0.4s ease-out ${(0.18 + i * 0.09).toFixed(2)}s both` }}>
                    <Icon name={u.icon} size={20} color="var(--agency-accent-strong)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.3 }}>{u.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
              <Button fullWidth onClick={() => finishToScreen(openTarget)}>{openLabel}</Button>
              <Button variant="outline" fullWidth onClick={() => finishToScreen('home')}>Back to Home</Button>
            </div>
          </>
        )}

      </div>
    </PageOverlay>
  );
}
