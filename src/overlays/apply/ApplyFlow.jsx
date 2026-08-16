import { useEffect, useMemo, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StepProgress from '../../components/ui/StepProgress';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, SERVICE_CENTRES } from '../../state/mockData';
import { getApplicationDef } from '../../state/requirements';
import { buildEidDateOptions, EID_TIME_OPTIONS, formatEidDate } from '../eid/eidData';

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function FieldRow({ field, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>
        {field.label}{!field.required && <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · optional</span>}
      </label>
      {field.type === 'select' ? (
        <select value={value} onChange={onChange} style={fieldStyle}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
          value={value} onChange={onChange} style={fieldStyle}
        />
      )}
      {field.hint && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>{field.hint}</span>}
    </div>
  );
}

export default function ApplyFlow() {
  const { isOpen, getPayload, closeOverlay, navigate, addApplication, addNotification, showToast } = useAppState();
  const open = isOpen('apply');
  const payload = getPayload('apply');
  const def = getApplicationDef(payload?.serviceId);

  const totalSteps = 3; // details → documents (+ appointment if any) → review
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState({});
  const [docStatus, setDocStatus] = useState({});
  const [appt, setAppt] = useState({ office: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (open) { setStep(1); setFields({}); setDocStatus({}); setAppt({ office: '', date: '', time: '' }); setSubmitting(false); setDone(false); }
  }, [open, payload?.serviceId]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const dateOptions = useMemo(() => buildEidDateOptions(), []);
  const agency = def ? AGENCIES[def.agency] : null;
  const mark = agency?.mark || 'var(--brand-600)';

  if (!open || !def) return null;

  const setField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const uploadDoc = (id) => {
    setDocStatus((s) => ({ ...s, [id]: 'uploading' }));
    const t = setTimeout(() => setDocStatus((s) => ({ ...s, [id]: 'uploaded' })), 500);
    timers.current.push(t);
  };

  const fieldsOk = def.fields.every((f) => !f.required || String(fields[f.key] || '').trim());
  const docsOk = def.documents.every((d) => !d.required || docStatus[d.id] === 'uploaded');
  const apptOk = !def.appointment || (appt.office && appt.date && appt.time);

  const submit = () => {
    setSubmitting(true);
    const t = setTimeout(() => {
      const application = {
        serviceId: def.id, type: def.id, agency: def.agency, title: def.title,
        status: 'Submitted', step: 1, totalSteps: def.appointment ? 4 : 3,
        submittedOn: todayISO(),
        eta: def.appointment ? formatEidDate(appt.date) : null,
        fields: { ...fields },
        documents: def.documents.map((d) => ({
          name: d.label,
          status: docStatus[d.id] === 'uploaded' ? 'Uploaded' : (d.required ? 'Missing' : 'Optional'),
        })),
        appointment: def.appointment ? { ...appt } : null,
        pendingActions: [],
      };
      const id = addApplication(application);
      addNotification({
        agency: def.agency,
        icon: agency?.icon || 'file-text',
        title: `${def.title} application submitted`,
        body: def.appointment
          ? `We received it. Your appointment is booked for ${formatEidDate(appt.date)} at ${appt.time}.`
          : 'We received it and started the review. We\'ll update you here.',
        applicationId: id,
      });
      setSubmitting(false);
      setDone(true);
    }, 700);
    timers.current.push(t);
  };

  const canContinue = step === 1 ? fieldsOk : (docsOk && apptOk);

  const supportButton = (
    <button
      className="press focus-ring" onClick={() => openApplyHelp(showToast)} aria-label="Help"
      style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: mark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <Icon name="help-circle" size={17} color="#fff" />
    </button>
  );

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('apply')} title={def.title} subtitle={agency?.name} headerRight={supportButton}>
      <style>{'@keyframes applySpin { to { transform: rotate(360deg); } } .apply-spin { animation: applySpin 0.9s linear infinite; }'}</style>

      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, paddingTop: 20 }}>
          <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={30} color="var(--status-success)" />
          </span>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--fg-1)' }}>Application submitted</h2>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 300 }}>
            Your {def.title} application is in. You can follow it in My Applications, and we&apos;ll notify you as it moves.
            {def.appointment && appt.date ? ` Your appointment is ${formatEidDate(appt.date)} at ${appt.time}.` : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
            <Button onClick={() => { closeOverlay('apply'); navigate('applications'); }}>See my applications</Button>
            <Button variant="outline" onClick={() => closeOverlay('apply')}>Done</Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-3)' }}>
              Step {step} of {totalSteps} · {step === 1 ? 'Your details' : step === 2 ? (def.appointment ? 'Documents & appointment' : 'Documents') : 'Review & submit'}
            </span>
            <StepProgress step={step} total={totalSteps} color={mark} />
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{def.blurb}</p>
              {def.fields.map((f) => (
                <FieldRow key={f.key} field={f} value={fields[f.key] || ''} onChange={setField(f.key)} />
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Required documents</h3>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>Attach a photo or scan of each. Bring the originals if an appointment is booked.</p>
              </div>
              {def.documents.map((d) => {
                const status = docStatus[d.id] || 'missing';
                const uploaded = status === 'uploaded';
                return (
                  <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Icon name={uploaded ? 'check-circle-2' : 'file-text'} size={18} color={uploaded ? 'var(--status-success)' : 'var(--fg-3)'} style={{ marginTop: 1, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
                          {d.label}{!d.required && <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · optional</span>}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-3)' }}>{d.issuer}</span>
                        {d.hint && <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fg-3)' }}>{d.hint}</span>}
                      </span>
                    </div>
                    <button
                      className="press focus-ring" onClick={() => uploadDoc(d.id)} disabled={status === 'uploading'}
                      style={{ minHeight: 40, borderRadius: 10, border: `1px solid ${uploaded ? 'var(--status-success)' : 'var(--surface-border)'}`, background: uploaded ? 'var(--status-success-bg)' : 'var(--surface-1)', color: uploaded ? 'var(--status-success)' : 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      {status === 'uploading' ? (<><span className="apply-spin" style={{ width: 13, height: 13, border: '2px solid var(--surface-border)', borderTopColor: 'var(--fg-2)', borderRadius: 999, display: 'inline-block' }} />Uploading…</>)
                        : uploaded ? (<><Icon name="refresh-cw" size={13} />Replace</>)
                          : (<><Icon name="upload" size={13} />Upload</>)}
                    </button>
                  </div>
                );
              })}

              {def.appointment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>{def.appointment.label}</h3>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>{def.appointment.note}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SERVICE_CENTRES.map((c) => {
                      const active = appt.office === c.name;
                      return (
                        <button key={c.id} className="press focus-ring" onClick={() => setAppt((a) => ({ ...a, office: c.name }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 54, padding: '10px 13px', borderRadius: 12, border: `1px solid ${active ? mark : 'var(--surface-border)'}`, background: active ? `color-mix(in oklch, ${mark} 12%, transparent)` : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{c.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{c.address}</span>
                          </span>
                          {active && <Icon name="check" size={16} color={mark} />}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px' }}>
                    {dateOptions.map((dt) => {
                      const active = appt.date === dt.iso;
                      return (
                        <button key={dt.iso} className="press focus-ring" onClick={() => !dt.isFull && setAppt((a) => ({ ...a, date: dt.iso }))} disabled={dt.isFull}
                          style={{ flexShrink: 0, width: 54, minHeight: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 13, border: `1px solid ${active ? mark : 'var(--surface-border)'}`, background: active ? mark : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)', cursor: dt.isFull ? 'not-allowed' : 'pointer', opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800 }}>{dt.dayAbbr}</span>
                          <span style={{ fontSize: 17, fontWeight: 800 }}>{dt.dateNum}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EID_TIME_OPTIONS.map((t) => {
                      const active = appt.time === t;
                      return (
                        <button key={t} className="press focus-ring" onClick={() => setAppt((a) => ({ ...a, time: t }))}
                          style={{ minHeight: 38, padding: '0 15px', borderRadius: 999, border: `1px solid ${active ? mark : 'var(--surface-border)'}`, background: active ? mark : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === totalSteps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Review & submit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: 14, overflow: 'hidden' }}>
                {def.fields.filter((f) => String(fields[f.key] || '').trim()).map((f) => {
                  const raw = fields[f.key];
                  const display = f.type === 'select' ? (f.options.find((o) => o.value === raw)?.label || raw) : raw;
                  return (
                    <div key={f.key} style={{ display: 'flex', gap: 12, padding: '11px 14px', borderBottom: '1px solid var(--surface-hairline)' }}>
                      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-3)' }}>{f.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right' }}>{display}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: 12, padding: '11px 14px', borderBottom: def.appointment ? '1px solid var(--surface-hairline)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-3)' }}>Documents</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right' }}>
                    {def.documents.filter((d) => docStatus[d.id] === 'uploaded').length} of {def.documents.length} attached
                  </span>
                </div>
                {def.appointment && (
                  <div style={{ display: 'flex', gap: 12, padding: '11px 14px' }}>
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-3)' }}>Appointment</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right' }}>{appt.date ? `${formatEidDate(appt.date)} · ${appt.time}` : '—'}</span>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>
                By submitting you confirm these details are true. False information can delay or void your application.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {step > 1 && <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < totalSteps && <Button style={{ flex: 2, opacity: canContinue ? 1 : 0.5 }} disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Continue</Button>}
            {step === totalSteps && <Button style={{ flex: 2 }} disabled={submitting} onClick={submit}>{submitting ? 'Submitting…' : 'Submit application'}</Button>}
          </div>
        </>
      )}
    </PageOverlay>
  );
}

function openApplyHelp(showToast) {
  showToast('Bring your original documents to any appointment. Need help? Ask Gov once you\'re signed in.');
}
