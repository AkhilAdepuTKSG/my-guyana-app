import { useEffect, useMemo, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import StepProgress from '../../components/ui/StepProgress';
import { useAppState } from '../../state/AppStateContext';
import { SERVICE_CENTRES } from '../../state/mockData';
import EidAbout from './EidAbout';
import EidStep1 from './EidStep1';
import EidStep2 from './EidStep2';
import EidStep3 from './EidStep3';
import EidSuccess from './EidSuccess';
import { EID_CITIZENSHIP_OPTIONS, buildEidDocDefs, buildEidDateOptions } from './eidData';
import { recognizeImage, parseFields } from '../../lib/ocr';

const EMPTY_FIELDS = {
  fullName: '', nationalId: '', address: '', phone: '', email: '',
  citizenship: 'birth', motherName: '', fatherName: '', spouseName: '',
};
const EMPTY_APPOINTMENT = { office: '', date: '', time: '' };

const STEP_META = {
  1: { label: 'Your details' },
  2: { label: 'Documents & appointment' },
  3: { label: 'Review & submit' },
};

// The full e-ID application wizard: about (with sub-tabs) -> step 1
// (personal details, with a faked "scan ID" autofill) -> step 2 (documents
// + Service Centre/date/time picker) -> step 3 (review) -> success.
// All data is local component state backed by mock lookups — nothing here
// touches the shared AppStateContext beyond the 'eid' overlay open/close key.
export default function EidApplicationFlow() {
  const { isOpen, closeOverlay, openOverlay, navigate, persona, requireOtp } = useAppState();
  const open = isOpen('eid');

  const [step, setStep] = useState('about');
  const [aboutTab, setAboutTab] = useState('why');
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanText, setScanText] = useState('');
  const [scanError, setScanError] = useState('');
  const [docStatus, setDocStatus] = useState({});
  const [appointment, setAppointment] = useState(EMPTY_APPOINTMENT);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef([]);

  // Reset the whole flow every time it's (re)opened, so a second demo run
  // starts clean — mirrors the prototype's openEid() resetting state.
  useEffect(() => {
    if (open) {
      setStep('about');
      setAboutTab('why');
      setFields({ ...EMPTY_FIELDS, fullName: persona?.name || '' });
      setOptionalOpen(false);
      setScanned(false);
      setScanning(false);
      setScanPct(0);
      setScanText('');
      setScanError('');
      setDocStatus({});
      setAppointment(EMPTY_APPOINTMENT);
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const dateOptions = useMemo(() => buildEidDateOptions(), []);

  const updateField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const onScanFile = async (file) => {
    if (!file) return;
    setScanning(true); setScanned(false); setScanError(''); setScanText(''); setScanPct(0);
    try {
      const text = await recognizeImage(file, setScanPct);
      const parsed = parseFields(text);
      setFields((f) => ({
        ...f,
        fullName: f.fullName || parsed.fullName || '',
        nationalId: f.nationalId || parsed.documentNumber || '',
        address: f.address || parsed.address || '',
      }));
      setScanText(text.replace(/\s+/g, ' ').trim().slice(0, 220));
      setScanned(true);
    } catch {
      setScanError('Could not read that image. Enter the details by hand.');
    } finally {
      setScanning(false);
    }
  };

  const docs = useMemo(() => (
    buildEidDocDefs(fields.citizenship).map((d) => ({ ...d, status: docStatus[d.id] || 'missing' }))
  ), [fields.citizenship, docStatus]);

  const onUploadDoc = (id) => {
    setDocStatus((ds) => ({ ...ds, [id]: 'uploading' }));
    const t = setTimeout(() => setDocStatus((ds) => ({ ...ds, [id]: 'uploaded' })), 500);
    timers.current.push(t);
  };

  const canSubmitDetails = Boolean(fields.fullName.trim() && fields.address.trim() && fields.phone.trim() && fields.nationalId.trim());
  const canSubmitDocs = docs.every((d) => d.isOptional || d.status === 'uploaded');
  const canSubmitAppointment = canSubmitDocs && Boolean(appointment.office && appointment.date && appointment.time);
  const citizenshipLabel = (EID_CITIZENSHIP_OPTIONS.find((o) => o.id === fields.citizenship) || {}).label || '';

  const handleClose = () => closeOverlay('eid');
  const goBack = () => setStep((s) => (s === 1 ? 'about' : (typeof s === 'number' ? s - 1 : 'about')));
  const submit = () => {
    setSubmitting(true);
    const t = setTimeout(() => {
      setSubmitting(false);
      setStep('success');
    }, 700);
    timers.current.push(t);
  };
  const seeApplication = () => { closeOverlay('eid'); navigate('applications'); };
  const backToMops = () => closeOverlay('eid');

  const supportButton = (
    <button
      className="press focus-ring" onClick={() => openOverlay('askGov')} aria-label="Support"
      style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <Icon name="sparkles" size={17} color="#fff" />
    </button>
  );

  return (
    <PageOverlay open={open} onClose={handleClose} title="e-ID" agency="mops" headerRight={supportButton}>
      <style>{'@keyframes eidSpin { to { transform: rotate(360deg); } } .eid-spin { animation: eidSpin 0.9s linear infinite; }'}</style>

      {step === 'about' && (
        <EidAbout tab={aboutTab} onTabChange={setAboutTab} onStart={() => setStep(1)} />
      )}

      {typeof step === 'number' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-3)' }}>Step {step} of 3 · {STEP_META[step].label}</span>
          <StepProgress step={step} total={3} />
        </div>
      )}

      {step === 1 && (
        <EidStep1
          fields={fields} updateField={updateField} scanned={scanned} scanning={scanning}
          scanPct={scanPct} scanText={scanText} scanError={scanError} onScanFile={onScanFile}
          optionalOpen={optionalOpen} onToggleOptional={() => setOptionalOpen((v) => !v)}
        />
      )}

      {step === 2 && (
        <EidStep2
          docs={docs} onUpload={onUploadDoc} centres={SERVICE_CENTRES} appointment={appointment}
          onSelectCentre={(name) => setAppointment((a) => ({ ...a, office: name }))}
          onUseLocation={() => setAppointment((a) => ({ ...a, office: SERVICE_CENTRES[0]?.name || a.office }))}
          dateOptions={dateOptions}
          onSelectDate={(iso) => setAppointment((a) => ({ ...a, date: iso }))}
          onSelectTime={(t) => setAppointment((a) => ({ ...a, time: t }))}
        />
      )}

      {step === 3 && (
        <EidStep3 fields={fields} citizenshipLabel={citizenshipLabel} appointment={appointment} />
      )}

      {typeof step === 'number' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={goBack}>Back</Button>
          {step === 1 && <Button style={{ flex: 2, opacity: canSubmitDetails ? 1 : 0.5 }} disabled={!canSubmitDetails} onClick={() => setStep(2)}>Continue</Button>}
          {step === 2 && <Button style={{ flex: 2, opacity: canSubmitAppointment ? 1 : 0.5 }} disabled={!canSubmitAppointment} onClick={() => setStep(3)}>Continue</Button>}
          {step === 3 && <Button style={{ flex: 2 }} disabled={submitting} onClick={() => requireOtp({ title: 'Submit your e-ID application', confirmLabel: 'Submit application', onConfirm: submit })}>{submitting ? 'Submitting…' : 'Submit application'}</Button>}
        </div>
      )}

      {step === 'success' && (
        <EidSuccess appointment={appointment} onSeeApplication={seeApplication} onBackToMops={backToMops} />
      )}
    </PageOverlay>
  );
}
