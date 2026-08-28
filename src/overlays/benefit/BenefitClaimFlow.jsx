import { useEffect, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Sheet from '../../components/ui/Sheet';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StepProgress from '../../components/ui/StepProgress';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import { useAppState } from '../../state/AppStateContext';
import { NIS_BENEFITS } from '../../state/mockData';

// ---------------------------------------------------------------------------
// Static content — mirrors the source prototype's per-benefit copy, trimmed
// to the four benefit types this app surfaces (NIS_BENEFITS has no pension
// entry, so the type picker and its flows only cover these four).
// ---------------------------------------------------------------------------

const ABOUT_DEFS = {
  sickness: {
    icon: 'thermometer', title: 'Sickness Benefit',
    desc: 'Temporary income support when illness or a non-work-related injury stops you from working.',
    whatReceive: 'A temporary cash benefit based on your insurable earnings and the approved incapacity period.',
    whoFor: 'Insured employees and eligible self-employed contributors who have stopped working because of sickness.',
    whenApply: 'As soon as a medical professional confirms you are unable to work.',
    whatNext: 'NIS checks your contributions, employer information and your medical certificate.',
    hasMetric: true, contribs: 5, target: 8, metricLabel: 'Contributions in the last 13 weeks',
    note: "April's contribution is missing. NIS will assess your record fully when you apply.",
    docLabel: 'Medical certificate from your doctor', formTitle: 'Tell us about your claim',
    reqs: [
      { icon: 'calendar-check', text: 'At least 8 contributions in the last 13 weeks' },
      { icon: 'calendar-check', text: 'At least 50 total contributions' },
      { icon: 'briefcase', text: 'Insurable employment right before your incapacity' },
      { icon: 'stethoscope', text: 'Medical evidence confirms you are unable to work' },
    ],
    declareText: "I confirm the information I've provided is complete and accurate.",
  },
  maternity: {
    icon: 'baby', title: 'Maternity Allowance',
    desc: 'Income support while you are away from work before and after childbirth.',
    whatReceive: 'A maternity allowance for the approved period, normally covering 13 weeks.',
    whoFor: 'Insured employees and eligible self-employed contributors who meet the contribution rules.',
    whenApply: 'Before delivery with expected-confinement evidence, or after delivery with confinement evidence.',
    whatNext: 'NIS checks your contributions, delivery information, earnings and any wages paid during leave.',
    hasMetric: true, contribs: 5, target: 7, metricLabel: 'Contributions in the last 26 weeks',
    note: "April's contribution is missing. NIS will assess your record fully when you apply.",
    docLabel: 'Medical certificate of expected or actual confinement',
    reqs: [
      { icon: 'calendar-check', text: 'At least 7 contributions in the last 26 weeks' },
      { icon: 'calendar-check', text: 'At least 15 total contributions' },
      { icon: 'stethoscope', text: 'Expected or actual confinement is medically certified' },
      { icon: 'briefcase', text: 'Earnings and maternity-leave pay are confirmed' },
    ],
    formTitle: 'Tell us about your pregnancy', dateLabel: 'What is your expected or actual delivery date?',
    toggleLabel: 'Has the baby been born?', toggleYes: 'Yes', toggleNo: 'No',
    toggleHelper: 'If yes, tell us the date of birth below so we can process your claim.',
    returnDateLabel: 'When do you expect to return to work?', providerLabel: 'Doctor or midwife name',
    reasonLabel: 'Anything else NIS should know', reasonPlaceholder: 'Optional notes', secondDateOnYes: true,
    secondDocLabel: 'Employer statement of earnings and leave pay',
    declareText: "I confirm the information I've provided is complete and accurate.",
  },
  injury: {
    icon: 'activity', title: 'Injury Benefit',
    desc: 'Temporary income support when a work accident or prescribed disease stops you from working.',
    whatReceive: 'A temporary cash benefit based on your insurable earnings and the approved incapacity period.',
    whoFor: 'Employed insured persons — self-employed contributors are not covered under this benefit.',
    whenApply: 'As soon as possible after reporting the accident and receiving medical confirmation.',
    whatNext: 'Your employer confirms the accident and earnings; NIS reviews the work connection and medical evidence.',
    hasMetric: false, docLabel: 'Medical certificate confirming your injury',
    reqs: [
      { icon: 'briefcase', text: 'You were employed when the incident occurred' },
      { icon: 'link', text: 'The incident arose out of your employment' },
      { icon: 'stethoscope', text: 'You were unable to work because of the injury' },
      { icon: 'user-x', text: 'Not covered if applying as self-employed' },
    ],
    formTitle: 'Tell us about the accident', dateLabel: 'When did the accident happen?',
    toggleLabel: 'Is your employer continuing to pay you?', toggleYes: 'Yes', toggleNo: 'No',
    toggleHelper: "If yes, we'll ask for the amount and dates.",
    returnDateLabel: 'When did you stop working?', providerLabel: 'Where did the accident happen',
    reasonLabel: 'What happened and what injury resulted', reasonPlaceholder: 'Brief description',
    secondDocLabel: 'Employer Notice of Accident and earnings evidence',
    declareText: 'I confirm this claim relates to my employment.',
  },
  funeral: {
    icon: 'flower-2', title: 'Funeral Benefit',
    desc: 'A one-time payment toward funeral expenses for an eligible insured person or spouse.',
    whatReceive: 'A funeral benefit paid to the person who paid or is responsible for the expenses.',
    whoFor: 'The person who paid the funeral costs, or who is legally liable to pay them.',
    whenApply: 'After death, once death records and funeral bills or receipts are available.',
    whatNext: 'NIS verifies contributions, the death, your authority to claim, and the funeral expenses.',
    hasMetric: false, docLabel: 'Death or cause-of-death certificate', formTitle: 'Tell us about the deceased',
    reqs: [
      { icon: 'shield-check', text: "The deceased's record meets the contribution requirement" },
      { icon: 'receipt', text: 'You paid or are liable for the funeral expenses' },
      { icon: 'badge-check', text: 'Death and your authority to claim are verified' },
      { icon: 'link', text: 'A work-related death is also routed to Industrial Death' },
    ],
    secondDocLabel: 'Funeral receipts or bills',
    declareText: 'I confirm I paid or am responsible for the listed funeral expenses.',
  },
};

const SUBTYPE_DEFS = {
  sickness: [
    { id: 'income', icon: 'hand-coins', label: 'Income support while sick', sub: 'Cash benefit while you cannot work' },
    { id: 'medical', icon: 'receipt', label: 'Medical expense reimbursement', sub: 'Get back what you paid for treatment' },
    { id: 'accident', icon: 'triangle-alert', label: 'Report a work accident', sub: 'Tell NIS about an injury at work' },
    { id: 'injury-medical', icon: 'bandage', label: 'Work-injury medical expenses', sub: 'Reimbursement for a workplace injury' },
  ],
  maternity: [
    { id: 'leave', icon: 'baby', label: 'Maternity leave income', sub: 'Cash benefit around the birth of your child' },
    { id: 'grant', icon: 'gift', label: 'Maternity grant', sub: 'A one-time payment for a new baby' },
    { id: 'extend', icon: 'calendar-plus', label: 'Extend maternity support', sub: 'Ask for more time if you need it' },
  ],
};
const PRIMARY_SUBTYPE = { sickness: 'income', maternity: 'leave' };
const SUBTYPE_TITLE = { sickness: 'What type of issue?', maternity: 'What do you need?' };

const EMPLOYER_OPTIONS = [
  { id: 'ddl', label: 'Demerara Distillers Limited' },
  { id: 'gbti', label: 'Guyana Bank for Trade and Industry' },
  { id: 'none', label: 'Not listed / none of these' },
];

const DOC_META = {
  missing: { text: 'Missing', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  uploaded: { text: 'Uploaded', bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  requested: { text: 'Requested', bg: 'var(--surface-4)', fg: 'var(--fg-3)' },
};
const EMPLOYER_DOC_META = {
  missing: { text: 'Not sent', bg: 'var(--status-error-bg)', fg: 'var(--status-error)' },
  requested: { text: 'Pending employer', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  uploaded: { text: 'Received', bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
};

const PAYMENT_OPTIONS = [
  { id: 'bank', icon: 'landmark', label: 'Bank deposit' },
  { id: 'cheque', icon: 'file-text', label: 'Cheque — pick up at NIS office' },
  { id: 'mobile', icon: 'smartphone', label: 'Mobile money' },
];
const PAYMENT_QUESTION = {
  maternity: 'How would you like to receive your allowance?',
  injury: 'How would you like to receive this benefit?',
  funeral: 'How would you like to receive this benefit?',
};
const DECISION_OPTIONS = [
  { id: 'app', icon: 'smartphone', label: 'In the app' },
  { id: 'email', icon: 'mail', label: 'Email' },
  { id: 'pickup', icon: 'building-2', label: 'Pick up from an NIS office' },
];

const INITIAL_SB_FIELDS = { firstDay: '', stillUnable: 'yes', returnDate: '', doctor: '', reason: '', deceasedName: '', deceasedNis: '', deathDate: '', relationship: '' };
const INITIAL_SICK = { applyingSelf: 'yes', illnessStart: '', lastWorked: '', workRelated: '', receivingWages: 'no', wageAmount: '', wageSince: '', employerPickerOpen: false, employerId: 'ddl' };

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

function FieldLabel({ children, htmlFor }) {
  return <label htmlFor={htmlFor} style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{children}</label>;
}
const inputStyle = {
  width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12,
  border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
  fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
function TextField({ label, htmlFor, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <input id={htmlFor} style={inputStyle} {...rest} />
    </div>
  );
}
function Card({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
      {title && <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>{title}</h3>}
      {children}
    </div>
  );
}
function KeyVal({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{k}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{v || '—'}</span>
    </div>
  );
}
function EditButton({ onClick, children }) {
  return (
    <button className="press focus-ring" onClick={onClick} style={{
      marginTop: 4, minHeight: 40, border: '1px solid var(--surface-border)', borderRadius: 10,
      background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  );
}
function Chip({ active, onClick, children, flex = 1 }) {
  return (
    <button className="press focus-ring" onClick={onClick} style={{
      flex, minHeight: 44, borderRadius: 12, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
      background: active ? 'var(--agency-accent)' : 'var(--surface-1)', color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
      fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  );
}
function IconRow({ icon, iconBg, iconColor, label, active, onClick }) {
  return (
    <button className="press focus-ring" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '8px 14px',
      borderRadius: 14, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
      background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    }}>
      <span aria-hidden="true" style={{
        width: 34, height: 34, borderRadius: 10, background: active ? 'rgba(255,255,255,0.2)' : (iconBg || 'var(--agency-accent-soft)'),
        color: active ? '#fff' : (iconColor || 'var(--agency-accent-strong)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color="currentColor" />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: active ? '#fff' : 'var(--fg-1)' }}>{label}</span>
      {active && <Icon name="check" size={17} color="#fff" />}
    </button>
  );
}
function DocCard({ doc, uploadLabel = 'Upload a photo' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{doc.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: doc.bg, color: doc.fg, flexShrink: 0 }}>{doc.text}</span>
      </div>
      {doc.isMissing && (
        <button className="press focus-ring" onClick={doc.onAction} style={{
          minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
          color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>{doc.actionLabel || uploadLabel}</button>
      )}
    </div>
  );
}

export default function BenefitClaimFlow() {
  const { isOpen, closeOverlay, getPayload, showToast, navigate, persona, requireOtp } = useAppState();
  const open = isOpen('benefit');
  const payload = getPayload('benefit');
  const wasOpen = useRef(false);

  const [step, setStep] = useState('type'); // type | subtype | about | 1 | 2 | 3 | success
  const [sbType, setSbType] = useState(null);
  const [, setSbSubtype] = useState(null); // recorded for the claim; not read by this screen yet
  const [aboutTab, setAboutTab] = useState('why');

  const [sbFields, setSbFields] = useState(INITIAL_SB_FIELDS);
  const [sick, setSick] = useState(INITIAL_SICK);
  const [docStatus, setDocStatus] = useState({});
  const [decisionChannel, setDecisionChannel] = useState('app');
  const [declared, setDeclared] = useState(false);

  const [payment, setPayment] = useState('bank');
  const [bankFields, setBankFields] = useState({ bankName: '', accountNumber: '' });
  const [mobileFields, setMobileFields] = useState({ mobileNumber: '' });

  const [personalOpen, setPersonalOpen] = useState(false);
  const [personalFields, setPersonalFields] = useState({ phone: '592 611 4820', email: 'nicole.persaud@example.gy' });
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState('');

  const resetAll = () => {
    setSbFields(INITIAL_SB_FIELDS);
    setSick(INITIAL_SICK);
    setDocStatus({});
    setDecisionChannel('app');
    setDeclared(false);
    setPayment('bank');
    setBankFields({ bankName: '', accountNumber: '' });
    setMobileFields({ mobileNumber: '' });
    setAboutTab('why');
    setExitConfirmOpen(false);
    setSubmitting(false);
  };

  const pickType = (type) => {
    setSbType(type);
    if (SUBTYPE_DEFS[type]) { setSbSubtype(null); setStep('subtype'); }
    else { setSbSubtype(null); setStep('about'); }
  };

  useEffect(() => {
    if (open && !wasOpen.current) {
      resetAll();
      const t = payload && typeof payload === 'object' ? payload.type : null;
      if (t && ABOUT_DEFS[t]) pickType(t);
      else { setSbType(null); setSbSubtype(null); setStep('type'); }
    }
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const about = ABOUT_DEFS[sbType] || ABOUT_DEFS.sickness;
  const isSickness = sbType === 'sickness';
  const isFuneral = sbType === 'funeral';
  const isGenericForm = !isFuneral && !isSickness;
  const showPaymentStep = !isSickness;

  const close = () => closeOverlay('benefit');

  const order = () => (SUBTYPE_DEFS[sbType] ? ['type', 'subtype', 'about', 1, 2, 3] : ['type', 'about', 1, 2, 3]);
  const goBack = () => {
    const o = order();
    const idx = o.indexOf(step);
    if (idx > 0) setStep(o[idx - 1]);
  };
  const headerBack = () => {
    if (step === 'type') { close(); return; }
    if (typeof step === 'number') { setExitConfirmOpen(true); return; }
    goBack();
  };

  const pickSubtype = (id) => {
    if (id !== PRIMARY_SUBTYPE[sbType]) {
      const opt = (SUBTYPE_DEFS[sbType] || []).find((o) => o.id === id);
      showToast((opt ? opt.label : 'This option') + ' — not available in this preview');
      return;
    }
    setSbSubtype(id);
    setStep('about');
  };

  const switchToInjury = () => { setSbType('injury'); setSbSubtype(null); setStep('about'); };

  const eligStatus = about.hasMetric ? (about.contribs >= about.target ? 'eligible' : about.contribs > 0 ? 'partial' : 'ineligible') : 'partial';
  const eligMeta = {
    eligible: { label: 'You appear eligible', sub: 'Your record meets what we can check right now.', icon: 'check-circle-2', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    partial: { label: 'Partial eligibility', sub: 'NIS will confirm the rest when you apply.', icon: 'circle-help', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    ineligible: { label: 'Not currently eligible', sub: 'Your record does not yet meet this requirement.', icon: 'x-circle', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
  }[eligStatus];

  const certStatus = docStatus.cert || 'missing';
  const certMeta = DOC_META[certStatus];
  const sbDoc = { label: about.docLabel, status: certStatus, ...certMeta, isMissing: certStatus === 'missing', onAction: () => setDocStatus((s) => ({ ...s, cert: 'uploaded' })) };

  const employerDocLabel = isSickness ? 'Employer earnings & absence statement' : (about.secondDocLabel || 'Employer earnings & absence statement');
  const employerStatus = docStatus.employer || 'missing';
  const employerMeta = EMPLOYER_DOC_META[employerStatus];
  const employerDoc = {
    label: employerDocLabel, status: employerStatus, ...employerMeta, isMissing: employerStatus === 'missing',
    actionLabel: isSickness ? 'Send request to employer' : 'Send request',
    onAction: () => setDocStatus((s) => ({ ...s, employer: isFuneral ? 'uploaded' : 'requested' })),
  };

  const canSubmit = certStatus !== 'missing' && employerStatus !== 'missing' && declared;
  const blockReason = !declared ? 'Confirm the declaration to continue.'
    : certStatus === 'missing' ? 'Resolve the required document to continue.'
    : employerStatus === 'missing' ? `Send the ${employerDocLabel.toLowerCase()} request to continue.` : '';

  const sickEmployerName = { ddl: 'Demerara Distillers Limited', gbti: 'Guyana Bank for Trade and Industry', none: 'Not listed — added manually' }[sick.employerId];
  const showSecondDate = about.secondDateOnYes ? sbFields.stillUnable === 'yes' : sbFields.stillUnable === 'no';

  const submitClaim = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccessRef('NIS-' + (sbType || 'CL').slice(0, 2).toUpperCase() + '-2026-' + String(Math.floor(10000 + Math.random() * 90000)));
      setStep('success');
    }, 900);
  };

  const fullName = persona?.name || 'Citizen';
  const nisNumber = persona?.nisNumber || 'Not yet linked';

  const stepBars = typeof step === 'number' ? step : 0;

  return (
    <>
      {/* Personal-details editor */}
      <Sheet open={open && personalOpen} onClose={() => setPersonalOpen(false)} title="Update personal information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Name</FieldLabel>
            <div style={{ minHeight: 48, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 12, background: 'var(--surface-2)', color: 'var(--fg-2)', fontSize: 14 }}>{fullName}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>NIS number</FieldLabel>
            <div style={{ minHeight: 48, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 12, background: 'var(--surface-2)', color: 'var(--fg-2)', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{nisNumber}</div>
          </div>
          <TextField label="Phone" htmlFor="sb-personal-phone" type="tel" enterKeyHint="done" value={personalFields.phone} onChange={(e) => setPersonalFields((f) => ({ ...f, phone: e.target.value }))} />
          <TextField label="Email" htmlFor="sb-personal-email" type="email" value={personalFields.email} onChange={(e) => setPersonalFields((f) => ({ ...f, email: e.target.value }))} />
          <Button variant="primary" fullWidth onClick={() => setPersonalOpen(false)}>Save</Button>
        </div>
      </Sheet>

      {/* Exit confirmation */}
      <Sheet open={open && exitConfirmOpen} onClose={() => setExitConfirmOpen(false)} title="Leave this application?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>You can save your progress and finish it later, or discard it.</p>
          <Button variant="primary" fullWidth onClick={() => { setExitConfirmOpen(false); close(); showToast('Saved as a draft — pick up where you left off anytime.'); }}>Save as draft</Button>
          <Button variant="danger" fullWidth onClick={() => { setExitConfirmOpen(false); close(); setStep('type'); setSbType(null); setSbSubtype(null); }}
            style={{ background: 'var(--surface-1)', color: 'var(--status-error)', border: '1px solid var(--status-error)' }}>Discard</Button>
          <button className="press focus-ring" onClick={() => setExitConfirmOpen(false)} style={{ width: '100%', minHeight: 44, border: 'none', background: 'none', color: 'var(--fg-2)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Continue editing</button>
        </div>
      </Sheet>

      <PageOverlay
        open={open}
        onClose={headerBack}
        agency="nis"
        title="Apply for a benefit"
        subtitle={typeof step === 'number' ? `Step ${step} of 3` : undefined}
        headerRight={step !== 'success' && (
          <button className="press focus-ring" onClick={() => showToast('Ask Gov support — coming soon')} aria-label="Support" style={{
            width: 34, height: 34, borderRadius: 999, border: 'none', background: 'var(--brand-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <Icon name="sparkles" size={17} color="#fff" />
          </button>
        )}
      >
        {typeof step === 'number' && (
          <div style={{ marginBottom: 20 }}>
            <StepProgress step={stepBars} total={3} color="var(--agency-accent)" />
          </div>
        )}

        {step === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 19 }}>What would you like to apply for?</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>Pick the benefit that matches your situation.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NIS_BENEFITS.map((b) => (
                <button key={b.key} className="press focus-ring" onClick={() => pickType(b.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: 12,
                  borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={b.icon} size={19} color="var(--agency-accent-strong)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{b.name}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>{ABOUT_DEFS[b.key]?.desc}</span>
                  </span>
                  <Icon name="chevron-right" size={18} color="var(--fg-3)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'subtype' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 19 }}>{SUBTYPE_TITLE[sbType]}</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>Choose what applies to you. More will follow the same pattern soon.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(SUBTYPE_DEFS[sbType] || []).map((op) => (
                <button key={op.id} className="press focus-ring" onClick={() => pickSubtype(op.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: 12,
                  borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={op.icon} size={19} color="var(--agency-accent-strong)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{op.label}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: 'var(--fg-2)' }}>{op.sub}</span>
                  </span>
                  <Icon name="chevron-right" size={18} color="var(--fg-3)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <SegmentedTabs
              tabs={[{ value: 'why', label: 'Why it matters' }, { value: 'elig', label: 'Am I eligible?' }, { value: 'req', label: 'Requirements' }]}
              active={aboutTab}
              onChange={setAboutTab}
            />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexDirection: 'column' }}>
              <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={about.icon} size={20} color="var(--agency-accent-strong)" />
              </span>
              <div>
                <h2 className="ds-h3" style={{ margin: 0, fontSize: 19 }}>{about.title}</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{about.desc}</p>
              </div>
            </div>

            {aboutTab === 'why' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 2px' }}>
                {[
                  { icon: 'hand-coins', label: 'You may get — ', value: about.whatReceive },
                  { icon: 'users', label: "Who it's for — ", value: about.whoFor },
                  { icon: 'calendar-clock', label: 'When to apply — ', value: about.whenApply },
                  { icon: 'list-checks', label: "What's next — ", value: about.whatNext },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 4px' }}>
                    <Icon name={row.icon} size={17} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}><b style={{ color: 'var(--fg-1)', fontWeight: 700 }}>{row.label}</b>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {aboutTab === 'elig' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Your eligibility</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, background: eligMeta.bg }}>
                  <Icon name={eligMeta.icon} size={34} color={eligMeta.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: 'var(--fg-1)' }}>{eligMeta.label}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 13, lineHeight: 1.4, color: 'var(--fg-2)' }}>{eligMeta.sub}</span>
                  </div>
                </div>
                {about.hasMetric && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)' }}>{about.metricLabel}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{about.contribs} of {about.target}</span>
                    </div>
                    <div aria-hidden="true" style={{ position: 'relative', height: 8, borderRadius: 999, background: 'var(--surface-4)' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'var(--status-warning)', width: `${Math.round((about.contribs / about.target) * 100)}%` }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, background: '#F7ECE0', border: '1px solid #E4C29A' }}>
                      <Icon name="triangle-alert" size={15} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)' }}>{about.note}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {aboutTab === 'req' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Requirements</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  {about.reqs.map((r, i) => {
                    const state = i === 0 && about.hasMetric ? (about.contribs >= about.target ? 'met' : 'unmet') : 'pending';
                    const badgeIcon = state === 'met' ? 'check' : state === 'unmet' ? 'x' : 'minus';
                    const badgeColor = state === 'met' ? 'var(--status-success)' : state === 'unmet' ? 'var(--status-error)' : 'var(--fg-3)';
                    const badgeBg = state === 'met' ? 'var(--status-success-bg)' : state === 'unmet' ? 'var(--status-error-bg)' : 'var(--surface-4)';
                    const badgeSub = state === 'met' ? 'Met' : state === 'unmet' ? 'Not met' : 'Checked when you apply';
                    return (
                      <div key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 999, background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={badgeIcon} size={13} color={badgeColor} />
                        </span>
                        <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, color: 'var(--fg-1)' }}>{r.text}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, flexShrink: 0, whiteSpace: 'nowrap' }}>{badgeSub}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <Button variant="outline" fullWidth icon={<Icon name="sparkles" size={16} />} onClick={() => showToast('Ask Gov about this program — coming soon')}>Ask Gov about this program</Button>
              <Button variant="primary" fullWidth onClick={() => setStep(1)}>Apply for this benefit</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--agency-accent)' }}>{about.title}</span>
              <h2 className="ds-h3" style={{ margin: '4px 0 0', fontSize: 18 }}>{about.formTitle}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {isSickness && (
                <>
                  <Card title="Applicant">
                    <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Are you applying for yourself?</label>
                    <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                      <Chip active={sick.applyingSelf === 'yes'} onClick={() => setSick((s) => ({ ...s, applyingSelf: 'yes' }))}>Yes</Chip>
                      <Chip active={sick.applyingSelf === 'no'} onClick={() => setSick((s) => ({ ...s, applyingSelf: 'no' }))}>No, on someone's behalf</Chip>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>
                      {sick.applyingSelf === 'yes' ? "You're filing this claim for yourself." : 'NIS will ask you to confirm your authority to act on their behalf.'}
                    </p>
                  </Card>
                  <Card title="Employer on file">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="building-2" size={17} color="var(--agency-accent-strong)" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{sickEmployerName}</span>
                        <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-3)' }}>From your NIS employment record</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>This is used to confirm your recent earnings and time away from work.</p>
                    <button className="press focus-ring" onClick={() => setSick((s) => ({ ...s, employerPickerOpen: !s.employerPickerOpen }))} style={{
                      alignSelf: 'flex-start', minHeight: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--surface-border)',
                      background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>This isn't my employer</button>
                    {sick.employerPickerOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                        {EMPLOYER_OPTIONS.map((emp) => (
                          <button key={emp.id} className="press focus-ring" onClick={() => setSick((s) => ({ ...s, employerId: emp.id, employerPickerOpen: false }))} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, padding: '10px 12px',
                            borderRadius: 10, border: `1px solid ${sick.employerId === emp.id ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                            background: sick.employerId === emp.id ? 'var(--agency-accent-soft)' : 'var(--surface-1)', color: 'var(--fg-1)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          }}>
                            <span>{emp.label}</span>
                            {sick.employerId === emp.id && <Icon name="check" size={15} color="var(--agency-accent-strong)" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}

              {isGenericForm && (
                <>
                  <Card title="Timeline">
                    <TextField label={about.dateLabel} htmlFor="sb-firstday" type="date" value={sbFields.firstDay} onChange={(e) => setSbFields((f) => ({ ...f, firstDay: e.target.value }))} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{about.toggleLabel}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Chip active={sbFields.stillUnable === 'yes'} onClick={() => setSbFields((f) => ({ ...f, stillUnable: 'yes' }))}>{about.toggleYes}</Chip>
                        <Chip active={sbFields.stillUnable === 'no'} onClick={() => setSbFields((f) => ({ ...f, stillUnable: 'no' }))}>{about.toggleNo}</Chip>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>{about.toggleHelper}</p>
                    </div>
                    {showSecondDate && (
                      <TextField label={about.returnDateLabel} htmlFor="sb-returndate" type="date" value={sbFields.returnDate} onChange={(e) => setSbFields((f) => ({ ...f, returnDate: e.target.value }))} />
                    )}
                  </Card>
                  <Card title="Details">
                    <TextField label={about.providerLabel} htmlFor="sb-doctor" type="text" enterKeyHint="done" placeholder="Optional" value={sbFields.doctor} onChange={(e) => setSbFields((f) => ({ ...f, doctor: e.target.value }))} />
                    <TextField label={about.reasonLabel} htmlFor="sb-reason" type="text" enterKeyHint="done" placeholder={about.reasonPlaceholder} value={sbFields.reason} onChange={(e) => setSbFields((f) => ({ ...f, reason: e.target.value }))} />
                  </Card>
                  <Card title="Upload documents">
                    <DocCard doc={sbDoc} />
                    <DocCard doc={employerDoc} uploadLabel="Send request" />
                  </Card>
                </>
              )}

              {isFuneral && (
                <>
                  <Card title="About the deceased">
                    <TextField label="Full name of the deceased" htmlFor="sb-deceased-name" type="text" enterKeyHint="done" value={sbFields.deceasedName} onChange={(e) => setSbFields((f) => ({ ...f, deceasedName: e.target.value }))} />
                    <TextField label="Deceased's NIS number (if known)" htmlFor="sb-deceased-nis" type="text" enterKeyHint="done" placeholder="Optional" value={sbFields.deceasedNis} onChange={(e) => setSbFields((f) => ({ ...f, deceasedNis: e.target.value }))} />
                    <TextField label="Date of death" htmlFor="sb-death-date" type="date" value={sbFields.deathDate} onChange={(e) => setSbFields((f) => ({ ...f, deathDate: e.target.value }))} />
                    <TextField label="Your relationship to the deceased" htmlFor="sb-relationship" type="text" enterKeyHint="done" placeholder="e.g. Spouse, child, sibling" value={sbFields.relationship} onChange={(e) => setSbFields((f) => ({ ...f, relationship: e.target.value }))} />
                  </Card>
                  <Card title="Upload documents">
                    <DocCard doc={sbDoc} />
                    <DocCard doc={employerDoc} />
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--agency-accent)' }}>{about.title}</span>
              {isSickness && <h2 className="ds-h3" style={{ margin: '2px 0 0', fontSize: 18 }}>Complete your claim</h2>}
              {showPaymentStep && <h2 className="ds-h3" style={{ margin: '2px 0 0', fontSize: 18 }}>{PAYMENT_QUESTION[sbType] || 'How would you like to receive this benefit?'}</h2>}
            </div>

            {isSickness && (
              <>
                <Card title="Timeline">
                  <TextField label="When did the illness or condition begin?" htmlFor="sick-illness-start" type="date" value={sick.illnessStart} onChange={(e) => setSick((s) => ({ ...s, illnessStart: e.target.value }))} />
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>An approximate date is fine.</p>
                  <TextField label="When did you last work?" htmlFor="sick-last-worked" type="date" value={sick.lastWorked} onChange={(e) => setSick((s) => ({ ...s, lastWorked: e.target.value }))} />
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Cannot be a future date.</p>
                </Card>

                <Card title="Cause of illness">
                  <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Was this caused by your work?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['yes', 'no', 'unsure'].map((v) => (
                      <Chip key={v} active={sick.workRelated === v} onClick={() => setSick((s) => ({ ...s, workRelated: v }))}>{{ yes: 'Yes', no: 'No', unsure: 'Unsure' }[v]}</Chip>
                    ))}
                  </div>
                  {sick.workRelated === 'yes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 12, background: 'var(--status-warning-bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Icon name="triangle-alert" size={15} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Work-related conditions are handled under Injury Benefit instead.</p>
                      </div>
                      <button className="press focus-ring" onClick={switchToInjury} style={{
                        alignSelf: 'flex-start', minHeight: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--status-warning)',
                        background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}>Switch to Injury Benefit</button>
                    </div>
                  )}
                </Card>

                <Card title="Income">
                  <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Are you receiving wages while away from work?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Chip active={sick.receivingWages === 'yes'} onClick={() => setSick((s) => ({ ...s, receivingWages: 'yes' }))}>Yes</Chip>
                    <Chip active={sick.receivingWages === 'no'} onClick={() => setSick((s) => ({ ...s, receivingWages: 'no' }))}>No</Chip>
                  </div>
                  {sick.receivingWages === 'yes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                      <TextField label="How much, per week?" htmlFor="sick-wage-amount" type="text" enterKeyHint="done" placeholder="GYD" value={sick.wageAmount} onChange={(e) => setSick((s) => ({ ...s, wageAmount: e.target.value }))} />
                      <TextField label="Since when?" htmlFor="sick-wage-since" type="date" value={sick.wageSince} onChange={(e) => setSick((s) => ({ ...s, wageSince: e.target.value }))} />
                    </div>
                  )}
                </Card>

                <Card title="Evidence">
                  <DocCard doc={sbDoc} />
                  <DocCard doc={employerDoc} uploadLabel="Send request to employer" />
                </Card>
              </>
            )}

            {showPaymentStep && (
              <>
                <p style={{ margin: '-8px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Choose how NIS should get this to you if your claim is approved.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PAYMENT_OPTIONS.map((p) => (
                    <IconRow key={p.id} icon={p.icon} label={p.label} active={payment === p.id} onClick={() => setPayment(p.id)} />
                  ))}
                </div>

                {payment === 'bank' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <TextField label="Bank name" htmlFor="sb-bankname" type="text" enterKeyHint="done" placeholder="e.g. Republic Bank" value={bankFields.bankName} onChange={(e) => setBankFields((f) => ({ ...f, bankName: e.target.value }))} />
                    <TextField label="Account number" htmlFor="sb-account" type="text" enterKeyHint="done" value={bankFields.accountNumber} onChange={(e) => setBankFields((f) => ({ ...f, accountNumber: e.target.value }))} style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} />
                  </div>
                )}
                {payment === 'mobile' && (
                  <TextField label="Mobile money number" htmlFor="sb-mobile" type="tel" enterKeyHint="done" placeholder="592 000 0000" value={mobileFields.mobileNumber} onChange={(e) => setMobileFields({ mobileNumber: e.target.value })} />
                )}
                {payment === 'cheque' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                    <Icon name="info" size={17} color="var(--fg-2)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Bring your ID to any NIS office to collect your cheque once it's ready.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>Review and submit</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Personal details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                <KeyVal k="Name" v={fullName} />
                <KeyVal k="NIS number" v={nisNumber} />
                <KeyVal k="Phone" v={personalFields.phone} />
                <KeyVal k="Email" v={personalFields.email} />
                <EditButton onClick={() => setPersonalOpen(true)}>Edit personal details</EditButton>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>{about.title} details</h3>
              {isGenericForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <KeyVal k={about.dateLabel} v={sbFields.firstDay} />
                  <KeyVal k={about.providerLabel} v={sbFields.doctor} />
                  <KeyVal k={about.reasonLabel} v={sbFields.reason} />
                  <EditButton onClick={() => setStep(1)}>Edit answers</EditButton>
                </div>
              )}
              {isFuneral && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <KeyVal k="Deceased" v={sbFields.deceasedName} />
                  <KeyVal k="Date of death" v={sbFields.deathDate} />
                  <KeyVal k="Relationship" v={sbFields.relationship} />
                  <EditButton onClick={() => setStep(1)}>Edit answers</EditButton>
                </div>
              )}
              {isSickness && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <KeyVal k="Employer" v={sickEmployerName} />
                  <KeyVal k="Illness began" v={sick.illnessStart} />
                  <KeyVal k="Last day worked" v={sick.lastWorked} />
                  <KeyVal k="Work-related?" v={{ yes: 'Yes', no: 'No', unsure: 'Unsure' }[sick.workRelated] || 'Not answered'} />
                  <KeyVal k="Receiving wages?" v={sick.receivingWages === 'yes' ? 'Yes' : 'No'} />
                  <EditButton onClick={() => setStep(2)}>Edit answers</EditButton>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Uploaded documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{sbDoc.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: sbDoc.bg, color: sbDoc.fg, flexShrink: 0 }}>{sbDoc.text}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{employerDoc.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: employerDoc.bg, color: employerDoc.fg, flexShrink: 0 }}>{employerDoc.text}</span>
                </div>
                <EditButton onClick={() => setStep(isSickness ? 2 : 1)}>Edit documents</EditButton>
              </div>
            </div>

            {showPaymentStep && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Payment method</h3>
                <div style={{ padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <KeyVal k="Method" v={PAYMENT_OPTIONS.find((p) => p.id === payment)?.label} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>How would you like to receive the decision?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DECISION_OPTIONS.map((c) => (
                  <IconRow key={c.id} icon={c.icon} label={c.label} active={decisionChannel === c.id} onClick={() => setDecisionChannel(c.id)} />
                ))}
              </div>
            </div>

            <button className="press focus-ring" onClick={() => setDeclared((d) => !d)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <span aria-hidden="true" style={{
                width: 20, height: 20, borderRadius: 6, border: `2px solid ${declared ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                background: declared ? 'var(--agency-accent)' : 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                {declared && <Icon name="check" size={13} color="#fff" />}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-1)' }}>{about.declareText}</span>
            </button>
          </div>
        )}

        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '32px 8px', gap: 18, textAlign: 'center' }}>
            <span aria-hidden="true" style={{ width: 76, height: 76, borderRadius: 999, background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check-circle-2" size={38} color="var(--status-success)" />
            </span>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>Application submitted successfully</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>NIS will review your application. You can track its progress anytime.</p>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--surface-2)', fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>{successRef}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <Button variant="primary" fullWidth onClick={() => { close(); navigate('applications'); }}>See application</Button>
              <Button variant="outline" fullWidth onClick={() => { close(); navigate('nis'); }}>Back to NIS</Button>
            </div>
          </div>
        )}

        {/* Sticky footer actions */}
        {step === 'about' && null}
        {(step === 1 || step === 2) && (
          <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', gap: 10 }}>
            <Button variant="outline" style={{ flex: 1 }} onClick={goBack}>Back</Button>
            <Button variant="primary" style={{ flex: 2 }} onClick={() => setStep(step === 1 ? 2 : 3)}>Continue</Button>
          </div>
        )}
        {step === 3 && (
          <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!canSubmit && <p style={{ margin: 0, padding: '10px 14px', fontSize: 13.5, fontWeight: 700, color: 'var(--status-error)', background: 'var(--status-error-bg)', borderRadius: 10, textAlign: 'center' }}>{blockReason}</p>}
            <Button variant="primary" fullWidth disabled={!canSubmit || submitting} onClick={() => requireOtp({ title: 'Submit your benefit claim', confirmLabel: 'Submit claim', onConfirm: submitClaim })} style={{ opacity: canSubmit ? 1 : 0.45 }}>
              {submitting ? 'Submitting…' : 'Submit claim'}
            </Button>
          </div>
        )}
      </PageOverlay>
    </>
  );
}
