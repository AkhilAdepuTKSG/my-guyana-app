import { useEffect, useMemo, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StepProgress from '../../components/ui/StepProgress';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, SERVICE_CENTRES } from '../../state/mockData';
import { getApplicationDef } from '../../state/requirements';
import { buildEidDateOptions, EID_TIME_OPTIONS, formatEidDate } from '../eid/eidData';
import { recognizeImage, parseFields } from '../../lib/ocr';
import { findSlotClash, appointmentPurpose, dateClashSummary } from '../../lib/appointments';

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Pre-fill an application's fields from the citizen's government record, matching
// each field by what it asks for (name parts, date of birth, place of birth, …).
function prefillFromGov(def, gov, fullName) {
  if (!def || !gov) return {};
  const out = {};
  def.fields.forEach((f) => {
    const k = f.key.toLowerCase();
    if (f.type === 'date' && /birth|dob/.test(k) && gov.dob) out[f.key] = gov.dob;
    else if (k.includes('surname') && gov.lastName) out[f.key] = gov.lastName;
    else if ((k.includes('given') || /first/.test(k)) && gov.firstName) out[f.key] = gov.firstName;
    else if ((k === 'fullname' || k === 'name') && fullName) out[f.key] = fullName;
    else if (k.includes('placeofbirth') && gov.placeOfBirth) out[f.key] = gov.placeOfBirth;
    else if (k.includes('address') && gov.address) out[f.key] = gov.address;
  });
  return out;
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
  const { isOpen, getPayload, closeOverlay, openOverlay, navigate, user, persona, applications, appointments, addApplication, addAppointment, addNotification, showToast, requireOtp } = useAppState();
  const open = isOpen('apply');
  const payload = getPayload('apply');
  const def = getApplicationDef(payload?.serviceId);

  const totalSteps = 3; // details → documents (+ appointment if any) → review
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState({});
  const [docStatus, setDocStatus] = useState({});
  const [docFiles, setDocFiles] = useState({}); // { [docId]: { name, url, size } }
  const [appt, setAppt] = useState({ office: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [eligPassed, setEligPassed] = useState(false); // eligibility gate cleared (backlog 3.8)
  const [scan, setScan] = useState({ status: 'idle', pct: 0, text: '', error: '' });
  const timers = useRef([]);
  const fileRef = useRef(null);
  const docInputRef = useRef(null);
  const pendingDocId = useRef(null);

  // Free any object URLs we made for document previews.
  const revokeDocUrls = () => { Object.values(docFiles).forEach((f) => f?.url && URL.revokeObjectURL(f.url)); };

  useEffect(() => {
    if (open) {
      revokeDocUrls();
      setStep(1);
      // Start from what government already has, then any preset the caller
      // passed (e.g. Ask Gov's "Renew your passport" → applicationType: 'renewal').
      setFields({ ...prefillFromGov(def, user?.gov, user?.name), ...((payload && payload.preset) || {}) });
      setDocStatus({}); setDocFiles({}); setAppt({ office: '', date: '', time: '' });
      setSubmitting(false); setDone(false); setEligPassed(false); setScan({ status: 'idle', pct: 0, text: '', error: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload?.serviceId]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); revokeDocUrls(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dateOptions = useMemo(() => buildEidDateOptions(), []);
  const agency = def ? AGENCIES[def.agency] : null;
  const mark = agency?.mark || 'var(--brand-600)';

  if (!open || !def) return null;

  const setField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  // Real OCR: read a photographed document and pre-fill what we can. Everything
  // stays on-device (see lib/ocr.js).
  const onScanFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScan({ status: 'scanning', pct: 0, text: '', error: '' });
    try {
      const text = await recognizeImage(file, (pct) => setScan((s) => ({ ...s, pct })));
      const parsed = parseFields(text);
      setFields((f) => {
        const next = { ...f };
        def.fields.forEach((fl) => {
          if (next[fl.key]) return; // never overwrite what the citizen already typed
          const k = fl.key.toLowerCase();
          if (fl.type === 'date' && parsed.dob) next[fl.key] = parsed.dob;
          else if (k.includes('surname') && parsed.surname) next[fl.key] = parsed.surname;
          else if ((k.includes('given') || k.includes('first')) && parsed.givenNames) next[fl.key] = parsed.givenNames;
          else if ((k.includes('fullname') || k === 'name') && parsed.fullName) next[fl.key] = parsed.fullName;
          else if (k.includes('address') && parsed.address) next[fl.key] = parsed.address;
          else if (/number|account/.test(k) && parsed.documentNumber) next[fl.key] = parsed.documentNumber;
        });
        return next;
      });
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 220);
      setScan({ status: 'done', pct: 100, text: preview, error: '' });
      showToast(preview ? 'Scanned — we filled what we could. Check the details.' : 'We couldn\'t read much. Enter the details by hand.');
    } catch {
      setScan({ status: 'error', pct: 0, text: '', error: 'Could not read that image. Try a clearer photo, or enter the details by hand.' });
    }
  };
  // Real file upload: open the picker for a specific document, then attach the
  // chosen file. There is no backend, so we keep the file locally (name + a
  // preview URL) and mark it attached.
  const pickDoc = (id) => { pendingDocId.current = id; docInputRef.current?.click(); };
  const onDocFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const id = pendingDocId.current;
    if (!file || !id) return;
    setDocStatus((s) => ({ ...s, [id]: 'uploaded' }));
    setDocFiles((prev) => {
      if (prev[id]?.url) URL.revokeObjectURL(prev[id].url);
      return { ...prev, [id]: { name: file.name, url: URL.createObjectURL(file), size: file.size } };
    });
  };
  const removeDoc = (id) => {
    setDocFiles((prev) => {
      if (prev[id]?.url) URL.revokeObjectURL(prev[id].url);
      const next = { ...prev }; delete next[id]; return next;
    });
    setDocStatus((s) => { const next = { ...s }; delete next[id]; return next; });
  };
  // "Add from Vault" — a static placeholder that pretends to pull a document the
  // citizen already stored in their Vault, so they don't re-upload what
  // government holds. No backend, so we attach a stand-in record.
  const attachFromVault = (id, label) => {
    setDocFiles((prev) => {
      if (prev[id]?.url) URL.revokeObjectURL(prev[id].url);
      return { ...prev, [id]: { name: `${label} (from Vault)`, url: null, size: null, source: 'vault' } };
    });
    setDocStatus((s) => ({ ...s, [id]: 'uploaded' }));
    showToast('Added from your Vault');
  };
  const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

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
          file: docFiles[d.id]?.name || null,
          status: docStatus[d.id] === 'uploaded' ? 'Uploaded' : (d.required ? 'Missing' : 'Optional'),
        })),
        appointment: def.appointment ? { ...appt } : null,
        pendingActions: [],
      };
      const id = addApplication(application);
      // A booked in-person visit becomes a real appointment in the Appointments tab.
      if (def.appointment && appt.date) {
        addAppointment({
          id: `appt-${def.id}`,
          agency: def.agency,
          title: `${def.title} appointment`,
          location: appt.office,
          date: appt.date,
          time: appt.time,
          applicationId: id,
        });
      }
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

  // Eligibility gate (backlog 3.8) — evaluated against the signed-in citizen's
  // real state. The application form stays locked until every rule passes.
  const eligRules = (def.eligibility || []).map((r) => ({ ...r, ok: r.passes({ user, persona, applications }) }));
  const eligOk = eligRules.every((r) => r.ok);
  const showEligibility = eligRules.length > 0 && !eligPassed;

  const runEligAction = (action) => {
    if (!action) return;
    if (action.screen) { closeOverlay('apply'); navigate(action.screen); return; }
    if (action.overlay) openOverlay(action.overlay, action.payload ?? true);
  };

  // Ask Gov, scoped to this service (backlog 4.2) — opening it from here gives
  // quick actions for this service; closing it lands right back on this screen.
  const supportButton = (
    <button
      className="press focus-ring"
      onClick={() => openOverlay('askGov', { serviceId: payload?.serviceId, serviceTitle: def.title })}
      aria-label={`Ask Gov about ${def.title}`}
      style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: mark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <Icon name="sparkles" size={17} color="#fff" />
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
            {def.appointment && appt.date && (
              <Button variant="outline" onClick={() => { closeOverlay('apply'); navigate('calendar'); openOverlay('apptDetail', { id: `appt-${def.id}` }); }}>View appointment</Button>
            )}
            <Button variant="outline" onClick={() => closeOverlay('apply')}>Done</Button>
          </div>
        </div>
      ) : showEligibility ? (
        /* Eligibility check before anything is asked for (backlog 3.8). */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Before you apply</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>
              {eligOk ? 'You appear eligible' : 'Checking your eligibility'}
            </h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              We checked these against your account and government record — nothing to look up yourself.
            </p>
          </div>

          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden' }}>
            {eligRules.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', borderBottom: i < eligRules.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}>
                <span aria-hidden="true" style={{
                  width: 26, height: 26, flexShrink: 0, borderRadius: 999, marginTop: 1,
                  background: r.ok ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={r.ok ? 'check' : 'x'} size={14} color={r.ok ? 'var(--status-success)' : 'var(--status-error)'} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)' }}>
                    {r.ok ? r.passLabel : r.failLabel}
                  </span>
                  {!r.ok && r.failHint && (
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{r.failHint}</span>
                  )}
                  {!r.ok && r.failAction && (
                    <button
                      className="press focus-ring" onClick={() => runEligAction(r.failAction)}
                      style={{ marginTop: 8, minHeight: 36, padding: '0 13px', border: 'none', borderRadius: 999, background: mark, color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {r.failAction.label}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {eligOk ? (
              <Button fullWidth onClick={() => setEligPassed(true)} style={{ background: mark }}>Start my application</Button>
            ) : (
              <Button fullWidth variant="outline" onClick={() => closeOverlay('apply')}>Close for now</Button>
            )}
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

              <input ref={fileRef} type="file" accept="image/*" onChange={onScanFile} style={{ display: 'none' }} />
              <button
                className="press focus-ring" onClick={() => fileRef.current?.click()} disabled={scan.status === 'scanning'}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '13px 15px', borderRadius: 16, border: `1.5px dashed ${mark}`, background: `color-mix(in oklch, ${mark} 8%, transparent)`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: mark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {scan.status === 'scanning'
                    ? <span className="apply-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: 999, display: 'inline-block' }} />
                    : <Icon name="scan-text" size={20} color="#fff" />}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>
                    {scan.status === 'scanning' ? `Reading document… ${scan.pct}%` : 'Scan a document to fill this in'}
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>
                    {scan.status === 'scanning' ? 'This runs on your phone — nothing is uploaded' : 'Photograph your ID and we read the details off it'}
                  </span>
                </span>
              </button>
              {scan.status === 'done' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 12, background: 'var(--status-success-bg)', border: '1px solid color-mix(in oklch, var(--status-success) 35%, transparent)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>
                    <Icon name="check-circle-2" size={15} color="var(--status-success)" />Read from your document
                  </span>
                  {scan.text
                    ? <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>“{scan.text}{scan.text.length >= 220 ? '…' : ''}”</span>
                    : <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Not much text detected — please fill the fields below.</span>}
                </div>
              )}
              {scan.status === 'error' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, background: 'var(--status-error-bg)' }}>
                  <Icon name="triangle-alert" size={15} color="var(--status-error)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fg-1)' }}>{scan.error}</span>
                </div>
              )}

              {def.fields.map((f) => (
                <FieldRow key={f.key} field={f} value={fields[f.key] || ''} onChange={setField(f.key)} />
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Required documents</h3>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>IDs and certificates connect straight from your Vault. Anything only you hold — a photo or proof of address — is attached as a photo, scan or PDF. Bring the originals if an appointment is booked.</p>
              </div>
              <input ref={docInputRef} type="file" accept="image/*,application/pdf" onChange={onDocFile} style={{ display: 'none' }} />
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
                    {uploaded ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, background: 'var(--status-success-bg)', border: '1px solid color-mix(in oklch, var(--status-success) 30%, transparent)' }}>
                          <Icon name={docFiles[d.id]?.source === 'vault' ? 'folder-lock' : 'paperclip'} size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docFiles[d.id]?.name || 'Attached'}</span>
                          {docFiles[d.id]?.source === 'vault'
                            ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', flexShrink: 0 }}>From Vault</span>
                            : docFiles[d.id]?.size != null && <span style={{ fontSize: 11, color: 'var(--fg-3)', flexShrink: 0 }}>{fmtSize(docFiles[d.id].size)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {docFiles[d.id]?.url && (
                            <a className="press focus-ring" href={docFiles[d.id].url} target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, minHeight: 38, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <Icon name="eye" size={13} />View
                            </a>
                          )}
                          {d.source !== 'vault' && (
                            <button className="press focus-ring" onClick={() => pickDoc(d.id)}
                              style={{ flex: 1, minHeight: 38, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <Icon name="refresh-cw" size={13} />Replace
                            </button>
                          )}
                          <button className="press focus-ring" onClick={() => removeDoc(d.id)} aria-label={`Remove ${d.label}`}
                            style={{ width: 40, minHeight: 38, flexShrink: 0, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--status-error)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="trash-2" size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* IDs and certificates government already holds are connected
                         from the Vault — never uploaded. Everything else (a photo,
                         proof of address, a pay slip) is uploaded. */
                      d.source === 'vault' ? (
                        <button className="press focus-ring" onClick={() => attachFromVault(d.id, d.label)}
                          style={{ width: '100%', minHeight: 40, borderRadius: 10, border: `1px solid color-mix(in oklch, ${mark} 35%, var(--surface-border))`, background: `color-mix(in oklch, ${mark} 8%, transparent)`, color: mark, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Icon name="folder-lock" size={13} />Connect with Vault
                        </button>
                      ) : (
                        <button className="press focus-ring" onClick={() => pickDoc(d.id)}
                          style={{ width: '100%', minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Icon name="upload" size={13} />{d.required ? 'Upload file' : 'Add file'}
                        </button>
                      )
                    )}
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
                      const summary = dateClashSummary(appointments, { location: appt.office, date: dt.iso, times: EID_TIME_OPTIONS });
                      return (
                        <button key={dt.iso} className="press focus-ring" onClick={() => !dt.isFull && setAppt((a) => ({ ...a, date: dt.iso }))} disabled={dt.isFull}
                          title={summary.hasBooking ? 'You already have a booking this day' : undefined}
                          style={{ position: 'relative', flexShrink: 0, width: 54, minHeight: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 13, border: `1px solid ${active ? mark : 'var(--surface-border)'}`, background: active ? mark : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)', cursor: dt.isFull ? 'not-allowed' : 'pointer', opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit' }}>
                          {summary.hasBooking && (
                            <span aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 999, background: active ? '#fff' : 'var(--status-warning)' }} />
                          )}
                          <span style={{ fontSize: 10.5, fontWeight: 800 }}>{dt.dayAbbr}</span>
                          <span style={{ fontSize: 17, fontWeight: 800 }}>{dt.dateNum}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EID_TIME_OPTIONS.map((t) => {
                      const active = appt.time === t;
                      const clash = findSlotClash(appointments, { location: appt.office, date: appt.date, time: t });
                      return (
                        <button key={t} className="press focus-ring" disabled={!!clash} onClick={() => { if (!clash) setAppt((a) => ({ ...a, time: t })); }}
                          style={{ minHeight: 38, padding: clash ? '5px 13px' : '0 15px', borderRadius: clash ? 12 : 999, border: `1px solid ${active ? mark : 'var(--surface-border)'}`, background: active ? mark : clash ? 'var(--surface-2)' : 'var(--surface-1)', color: active ? '#fff' : clash ? 'var(--fg-3)' : 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: clash ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <span>{t}</span>
                          {clash && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--status-warning)' }}>Booked · {appointmentPurpose(clash)}</span>}
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
            {step === totalSteps && <Button style={{ flex: 2 }} disabled={submitting} onClick={() => requireOtp({ title: `Submit your ${def.title} application`, confirmLabel: 'Submit application', onConfirm: submit })}>{submitting ? 'Submitting…' : 'Submit application'}</Button>}
          </div>
        </>
      )}
    </PageOverlay>
  );
}

