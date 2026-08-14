import { useEffect, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Sheet from '../../components/ui/Sheet';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StepProgress from '../../components/ui/StepProgress';
import { useAppState } from '../../state/AppStateContext';

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

function Card({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>{children}</div>;
}

function OptionButton({ icon, label, sub, onClick, locked }) {
  return (
    <button className="press focus-ring" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: 12,
      borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    }}>
      <span aria-hidden="true" style={{
        width: 44, height: 44, borderRadius: 13, background: 'var(--agency-accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={19} color="var(--agency-accent-strong)" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{label}</span>
        {sub && <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: 'var(--fg-2)' }}>{sub}</span>}
      </span>
      <Icon name={locked ? 'lock' : 'chevron-right'} size={18} color="var(--fg-3)" />
    </button>
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

const CONTRIB_OPTIONS = [
  { id: 'employee', icon: 'briefcase', label: 'Employed', sub: 'Your employer pays NIS contributions for you' },
  { id: 'self', icon: 'store', label: 'Self-employed', sub: 'You work for yourself and pay your own contributions' },
  { id: 'employer', icon: 'receipt-text', label: 'Employer', sub: 'You employ people and pay NIS contributions for them' },
  { id: 'voluntary', icon: 'hand-coins', label: 'Voluntary contributor', sub: 'You want to keep paying NIS contributions yourself' },
];

const PICKUP_OFFICES = [
  { id: 'brickdam', label: 'NIS Brickdam — Georgetown' },
  { id: 'cvive', label: 'NIS Camp Street — Georgetown' },
  { id: 'newam', label: 'NIS New Amsterdam' },
];
const PICKUP_DATES = [{ id: 'd1', label: 'Mon 17', sub: 'Aug' }, { id: 'd2', label: 'Tue 18', sub: 'Aug' }, { id: 'd3', label: 'Thu 20', sub: 'Aug' }];
const PICKUP_TIMES = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM'];

const STATUS_META = {
  onFile: { text: 'On file', bg: 'var(--agency-accent-soft)', fg: 'var(--agency-accent-strong)' },
  uploaded: { text: 'Uploaded', bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  requested: { text: 'Requested', bg: 'var(--surface-4)', fg: 'var(--fg-3)' },
  missing: { text: 'Missing', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
};

const INITIAL_FIELDS = { employer: '', job: '', start: '', empNo: '', workType: '', location: '', business: '', tin: '' };

export default function NisRegistrationFlow() {
  const { isOpen, closeOverlay, showToast, navigate, persona } = useAppState();
  const open = isOpen('nisReg');
  const wasOpen = useRef(false);

  const [phase, setPhase] = useState('gate'); // gate | link | wizard
  const [linkNumber, setLinkNumber] = useState('');
  const [linking, setLinking] = useState(false);

  const [step, setStep] = useState(1); // 1 | 2 | 3 | 'success'
  const [regType, setRegType] = useState(null); // employee | self
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [docStatus, setDocStatus] = useState({});
  const [pickup, setPickup] = useState({ office: null, date: null, time: null });
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState('');

  // Reset everything each time the flow is freshly opened.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setPhase('gate');
      setLinkNumber('');
      setLinking(false);
      setStep(1);
      setRegType(null);
      setFields(INITIAL_FIELDS);
      setDocStatus({});
      setPickup({ office: null, date: null, time: null });
      setSubmitting(false);
    }
    wasOpen.current = open;
  }, [open]);

  const updateField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const pickRegType = (type) => {
    if (type !== 'employee' && type !== 'self') {
      showToast(CONTRIB_OPTIONS.find((o) => o.id === type)?.label + ' — not available in this preview');
      return;
    }
    setRegType(type);
    setStep(2);
  };

  const docDefs = regType === 'self'
    ? [{ id: 'id', label: 'National ID', base: 'onFile' }, { id: 'biz', label: 'Business registration or TIN certificate', base: 'missing' }]
    : [{ id: 'id', label: 'National ID', base: 'onFile' }, { id: 'proof', label: 'Proof of employment (letter or payslip)', base: 'missing' }];
  const docs = docDefs.map((d) => {
    const status = docStatus[d.id] || d.base;
    const meta = STATUS_META[status];
    return { ...d, status, ...meta, isMissing: status === 'missing' };
  });
  const canSubmit = docs.every((d) => d.status !== 'missing');
  const resolveDoc = (id, status) => setDocStatus((s) => ({ ...s, [id]: status }));

  const close = () => closeOverlay('nisReg');

  const submitReg = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setRef('NIS-REG-2026-' + String(Math.floor(10000 + Math.random() * 90000)));
      setStep('success');
    }, 900);
  };

  const idNumber = persona?.nationalId || 'GEC-4821-7739';
  const fullName = persona?.name || 'Citizen';

  return (
    <>
      {/* Entry gate: does the citizen already have an NIS number? */}
      <Sheet open={open && phase === 'gate'} onClose={close} title="Do you already have an NIS number?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="press focus-ring" onClick={() => setPhase('link')} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: 12,
            borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}>
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="shield-check" size={18} color="var(--agency-accent-strong)" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Yes, I have a number</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--fg-2)' }}>Link it with your NIS number</span>
            </span>
          </button>
          <button className="press focus-ring" onClick={() => { setPhase('wizard'); setStep(1); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: 12,
            borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}>
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="user-plus" size={18} color="var(--agency-accent-strong)" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>No, I do not have one</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--fg-2)' }}>Register with NIS — about ten minutes</span>
            </span>
          </button>
        </div>
      </Sheet>

      {/* Link an existing NIS number */}
      <Sheet open={open && phase === 'link'} onClose={close} title="Link your NIS record">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField label="NIS number" htmlFor="nis-link-no" type="text" enterKeyHint="done" placeholder="660-0000-0"
            value={linkNumber} onChange={(e) => setLinkNumber(e.target.value)} style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} />
          <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            <Icon name="lock" size={15} color="var(--agency-accent-strong)" style={{ flexShrink: 0, marginTop: 1 }} />
            Your record will not be linked yet. Next we check that it belongs to you.
          </p>
          <Button variant="primary" fullWidth disabled={!linkNumber.trim() || linking} onClick={() => {
            setLinking(true);
            setTimeout(() => {
              setLinking(false);
              close();
              showToast('NIS record linked — welcome back.');
            }, 900);
          }}>
            {linking ? 'Checking…' : 'Continue'}
          </Button>
        </div>
      </Sheet>

      {/* Full registration wizard */}
      <PageOverlay
        open={open && phase === 'wizard'}
        onClose={close}
        agency="nis"
        title="Register for NIS"
        subtitle={step !== 'success' ? `Step ${step} of 3` : undefined}
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
            <StepProgress step={step} total={3} color="var(--agency-accent)" />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 19 }}>How will you contribute to NIS?</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>Choose the option that best describes you.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CONTRIB_OPTIONS.map((op) => (
                <OptionButton key={op.id} icon={op.icon} label={op.label} sub={op.sub} onClick={() => pickRegType(op.id)} />
              ))}
            </div>
            <button className="press focus-ring" onClick={close} style={{
              alignSelf: 'center', marginTop: 2, background: 'none', border: 'none', padding: 6,
              fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Do this at an NIS office instead
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>Add your work information</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--fg-2)' }}>{regType === 'employee' ? 'Employee' : 'Self-employed'}</p>
            </div>

            {regType === 'employee' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <TextField label="Who is your employer?" htmlFor="reg-employer" type="text" enterKeyHint="done" placeholder="Business name" value={fields.employer} onChange={updateField('employer')} />
                <TextField label="What is your job?" htmlFor="reg-job" type="text" enterKeyHint="done" placeholder="Job title" value={fields.job} onChange={updateField('job')} />
                <TextField label="When did you start?" htmlFor="reg-start" type="date" value={fields.start} onChange={updateField('start')} />
                <TextField label="Employee number, if available" htmlFor="reg-empno" type="text" enterKeyHint="done" placeholder="Optional" value={fields.empNo} onChange={updateField('empNo')} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <Icon name="info" size={17} color="var(--fg-2)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>We'll ask your employer to confirm your employment.</p>
                </div>
              </div>
            )}

            {regType === 'self' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <TextField label="What type of work do you do?" htmlFor="reg-worktype" type="text" enterKeyHint="done" placeholder="e.g. Carpentry, tutoring" value={fields.workType} onChange={updateField('workType')} />
                <TextField label="When did you start?" htmlFor="reg-startself" type="date" value={fields.start} onChange={updateField('start')} />
                <TextField label="Where do you work?" htmlFor="reg-location" type="text" enterKeyHint="done" placeholder="Region or address" value={fields.location} onChange={updateField('location')} />
                <TextField label="Business name, if applicable" htmlFor="reg-business" type="text" enterKeyHint="done" placeholder="Optional" value={fields.business} onChange={updateField('business')} />
                <TextField label="TIN, if available" htmlFor="reg-tin" type="text" enterKeyHint="done" placeholder="Optional" value={fields.tin} onChange={updateField('tin')} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <Icon name="info" size={17} color="var(--fg-2)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>NIS may contact you to verify your self-employment.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>Review and submit</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Personal details</h3>
              <Card>
                <KeyVal k="Name" v={fullName} />
                <KeyVal k="National ID number" v={idNumber} />
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Work information</h3>
              <Card>
                {regType === 'employee' ? (
                  <>
                    <KeyVal k="Employer" v={fields.employer} />
                    <KeyVal k="Job" v={fields.job} />
                    <KeyVal k="Start date" v={fields.start} />
                    <KeyVal k="Employee number" v={fields.empNo} />
                  </>
                ) : (
                  <>
                    <KeyVal k="Type of work" v={fields.workType} />
                    <KeyVal k="Start date" v={fields.start} />
                    <KeyVal k="Location" v={fields.location} />
                    <KeyVal k="Business name" v={fields.business} />
                    <KeyVal k="TIN" v={fields.tin} />
                  </>
                )}
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Uploaded documents</h3>
              {docs.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{doc.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: doc.bg, color: doc.fg, flexShrink: 0 }}>{doc.text}</span>
                  </div>
                  {doc.isMissing && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="press focus-ring" onClick={() => resolveDoc(doc.id, 'uploaded')} style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upload a photo</button>
                      <button className="press focus-ring" onClick={() => resolveDoc(doc.id, 'requested')} style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Request a copy</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {regType === 'employee' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Employer confirmation</h3>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
                  <Icon name="send" size={16} color="var(--fg-2)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>We'll ask your employer to confirm your employment.</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>Collect your NIS card</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>Pick when you will come in to collect your card and finish registering.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PICKUP_OFFICES.map((o) => {
                  const active = pickup.office === o.id;
                  return (
                    <button key={o.id} className="press focus-ring" onClick={() => setPickup((p) => ({ ...p, office: o.id }))} style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '8px 14px',
                      borderRadius: 14, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'var(--fg-1)' }}>{o.label}</span>
                      {active && <Icon name="check" size={17} color="#fff" />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PICKUP_DATES.map((d) => {
                  const active = pickup.date === d.id;
                  return (
                    <button key={d.id} className="press focus-ring" onClick={() => setPickup((p) => ({ ...p, date: d.id }))} style={{
                      flex: 1, minWidth: 96, minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      borderRadius: 14, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: active ? '#fff' : 'var(--fg-1)' }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'rgba(255,255,255,0.8)' : 'var(--fg-3)' }}>{d.sub}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PICKUP_TIMES.map((t) => {
                  const active = pickup.time === t;
                  return (
                    <button key={t} className="press focus-ring" onClick={() => setPickup((p) => ({ ...p, time: t }))} style={{
                      flex: 1, minWidth: 84, minHeight: 44, borderRadius: 12, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--agency-accent)' : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{t}</button>
                  );
                })}
              </div>
            </div>
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
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--surface-2)', fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>{ref}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <Button variant="primary" fullWidth onClick={() => { close(); navigate('applications'); }}>See application</Button>
              <Button variant="outline" fullWidth onClick={() => { close(); navigate('nis'); }}>Back to NIS</Button>
            </div>
          </div>
        )}

        {/* Sticky footer actions */}
        {step === 1 && null}
        {step === 2 && (
          <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', gap: 10 }}>
            <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" style={{ flex: 2 }} onClick={() => setStep(3)}>Continue</Button>
          </div>
        )}
        {step === 3 && (
          <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!canSubmit && <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-2)', textAlign: 'center' }}>Resolve required documents to continue.</p>}
            <Button variant="primary" fullWidth disabled={!canSubmit || submitting} onClick={submitReg} style={{ opacity: canSubmit ? 1 : 0.45 }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        )}
      </PageOverlay>
    </>
  );
}
