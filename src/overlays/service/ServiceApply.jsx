import { useEffect, useMemo, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StepProgress from '../../components/ui/StepProgress';
import { useAppState } from '../../state/AppStateContext';
import { useApi, useAction, useUserId } from '../../hooks/useApi';
import { getServiceDetail } from '../../api/catalog';
import { fileUploadedDocument } from '../../api/vault';
import { useVaultAttach } from '../../hooks/useVaultAttach';
import { listAll } from '../../api/applications';
import * as cashGrants from '../../api/cashGrants';
import * as singleWindow from '../../api/singleWindow';
import * as gra from '../../api/gra';
import * as immigration from '../../api/immigration';
import * as oldAgePension from '../../api/oldAgePension';
import { evaluateEligibility } from '../../data/eligibilityRules';
import { validateFields, visibleFields, validateDocuments, validatePrerequisites } from '../../api/validate';
import FormField from '../../components/service/FormField';
import DocumentSlot from '../../components/service/DocumentSlot';
import DocumentProgress from '../../components/service/DocumentProgress';
import VaultPickerSheet from '../../components/service/VaultPickerSheet';
import AppointmentPicker, { appointmentComplete, appointmentLabel, appointmentWhen } from '../../components/service/AppointmentPicker';
import {
  SectionHeading, InfoPanel, Card, DetailRow, FeeTable, LoadingState, ErrorState,
} from '../../components/service/ServicePieces';
import { formatGyd, displayFieldValue, formatTimeframe } from '../../lib/format';

// The application engine. One flow serves Cash Grants and every Single Window
// service: it reads the seeded service record and renders an eligibility gate,
// the prerequisites, each gated section, the documents, and a review — so a new
// service is a seed entry, not a new screen.
//
// Drafts are saved as the citizen moves between steps, so closing the flow
// never loses work.

/** The API module that owns a group's applications. */
function apiFor(group) {
  if (group === 'cashGrants') return cashGrants;
  if (group === 'gra') return gra;
  if (group === 'immigration') return immigration;
  if (group === 'mhsss') return oldAgePension;
  return singleWindow;
}

/** A booking with nothing chosen yet. */
const NO_APPOINTMENT = { office: '', date: '', time: '' };

export default function ServiceApply() {
  const {
    isOpen, getPayload, closeOverlay, openOverlay, navigate,
    user, persona, showToast, requireOtp, addNotification,
    appointments, addAppointment,
  } = useAppState();

  const open = isOpen('serviceApply');
  const payload = getPayload('serviceApply');
  const serviceId = payload && typeof payload === 'object' ? payload.serviceId : null;
  const userId = useUserId();

  const detail = useApi(() => getServiceDetail(serviceId), [serviceId], { enabled: open && !!serviceId });
  // One shared attach-from-Vault behaviour, type-filtered (see useVaultAttach).
  const attachFromVaultItem = (field, match) => {
    setDocs((d) => ({
      ...d,
      [field.id]: {
        status: 'fromVault',
        fileName: match.fileName || match.title,
        size: match.sizeBytes ?? null,
        // Only a filed document has a row of its own; a card or a derived
        // record is connected by reference, with nothing to re-upload.
        vaultDocId: match.vaultDocId,
        type: match.type,
      },
    }));
    showToast(`${match.title} added from your Vault`);
  };
  const { vault, requestFromVault, pickerFor, pickerCandidates, pick, closePicker } =
    useVaultAttach({ onAttach: attachFromVaultItem, showToast, active: open });
  const mine = useApi(() => listAll(userId), [userId, serviceId], { enabled: open && !!userId, initial: [] });

  const service = detail.data?.service;
  const agency = detail.data?.agency;
  const accent = agency?.mark || 'var(--brand-600)';
  const group = service?.group;

  // --- form state -------------------------------------------------------
  const [applicationId, setApplicationId] = useState(null);
  const [fields, setFields] = useState({});
  const [prereqs, setPrereqs] = useState({});
  const [docs, setDocs] = useState({});
  // Only services that declare one ever show this; for everything else it stays
  // empty and is never read.
  const [appt, setAppt] = useState(NO_APPOINTMENT);
  const [touched, setTouched] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [eligibilityPassed, setEligibilityPassed] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const fileInput = useRef(null);
  const pendingDoc = useRef(null);
  const loadedFor = useRef(null);

  // Load the citizen's draft (or start a clean one) whenever the flow opens.
  useEffect(() => {
    if (!open || !service || !userId) return;
    const key = `${serviceId}:${payload?.applicationId || ''}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;

    let cancelled = false;
    const api = apiFor(service.group);
    const loadDraft = payload?.applicationId
      ? api.getApplication(payload.applicationId)
      : (service.group === 'cashGrants' ? api.getDraft(userId) : api.getDraft(userId, serviceId));

    Promise.resolve(loadDraft).then((draft) => {
      if (cancelled) return;
      setSubmitted(null);
      setStepIndex(0);
      setTouched({});
      setShowErrors(false);
      setEligibilityPassed(false);
      if (draft && draft.status === 'draft') {
        setApplicationId(draft.id);
        // Defaults fill in under whatever the citizen already answered, so a
        // draft saved before a field gained a default is not left blank.
        setFields({ ...fieldDefaults(service), ...(draft.fields || {}) });
        setPrereqs(draft.prerequisites || {});
        setDocs(Object.fromEntries((draft.documents || [])
          .filter((d) => d.status !== 'missing')
          .map((d) => [d.docId, { status: d.status, fileName: d.fileName, size: d.size, vaultDocId: d.vaultDocId }])));
        setAppt(draft.appointment ? { ...NO_APPOINTMENT, ...draft.appointment } : NO_APPOINTMENT);
      } else {
        setApplicationId(null);
        setFields({ ...fieldDefaults(service), ...prefillFromRecord(service, user, persona) });
        setPrereqs({});
        setDocs({});
        setAppt(NO_APPOINTMENT);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service, userId, serviceId, payload?.applicationId]);

  useEffect(() => {
    if (!open) loadedFor.current = null;
  }, [open]);

  // --- steps -------------------------------------------------------------
  const steps = useMemo(() => {
    if (!service) return [];
    const list = [];
    if (service.prerequisites?.length) list.push({ id: 'prerequisites', title: 'Before you start' });
    (service.sections || []).forEach((s) => list.push({ id: `section:${s.id}`, title: s.title, section: s }));
    if (service.documents?.length) list.push({ id: 'documents', title: 'Documents' });
    // A service that has to see the citizen in person books the visit here,
    // before the review, so the slot is one of the things being confirmed.
    if (service.appointment) list.push({ id: 'appointment', title: service.appointment.title || 'Appointment' });
    list.push({ id: 'review', title: 'Review and submit' });
    return list;
  }, [service]);

  const step = steps[stepIndex];

  // --- validation --------------------------------------------------------
  const requiredDocs = useMemo(
    () => (service ? apiFor(group).requiredDocumentsFor(service, fields) : []),
    [service, group, fields]
  );

  const sectionErrors = useMemo(() => {
    if (!service || !step?.section) return {};
    return validateFields(service.fields, fields, { sectionId: step.section.id }).errors;
  }, [service, fields, step]);

  const prereqErrors = useMemo(
    () => (service ? validatePrerequisites(service.prerequisites, prereqs).errors : {}),
    [service, prereqs]
  );

  const docCheck = useMemo(() => validateDocuments(requiredDocs, docs), [requiredDocs, docs]);

  const stepValid = (() => {
    if (!step) return false;
    if (step.id === 'prerequisites') return Object.keys(prereqErrors).length === 0;
    if (step.section) return Object.keys(sectionErrors).length === 0;
    if (step.id === 'documents') return docCheck.ok;
    if (step.id === 'appointment') return appointmentComplete(appt);
    return true;
  })();

  // --- eligibility -------------------------------------------------------
  const eligibility = useMemo(
    () => (service
      ? evaluateEligibility(service.eligibilityRuleIds, { user, persona, applications: mine.data || [], service })
      : []),
    [service, user, persona, mine.data]
  );
  const eligibilityOk = eligibility.every((r) => r.ok);
  const showEligibility = eligibility.length > 0 && !eligibilityPassed && !submitted;

  // --- actions -----------------------------------------------------------
  const saveDraft = useAction(async () => {
    if (!service || !userId) return null;
    const api = apiFor(service.group);
    const saved = service.group === 'cashGrants'
      ? await api.saveDraft({ userId, applicationId, fields, documents: docs })
      : await api.saveDraft({
        userId, serviceId, applicationId, fields, documents: docs, prerequisites: prereqs,
        ...(service.appointment ? { appointment: appt } : null),
      });
    if (saved?.id) setApplicationId(saved.id);
    return saved;
  });

  const fileToVault = useAction(async ({ file, doc }) => fileUploadedDocument({
    userId, file, doc, serviceName: service?.name,
  }));

  const submit = useAction(async () => {
    const api = apiFor(service.group);
    return service.group === 'cashGrants'
      ? api.submitApplication({ userId, applicationId, fields, documents: docs })
      : api.submitApplication({
        userId, serviceId, applicationId, fields, documents: docs, prerequisites: prereqs,
        ...(service.appointment ? { appointment: appt } : null),
      });
  });

  if (!open) return null;

  const setField = (key) => (value) => {
    setFields((f) => ({ ...f, [key]: value }));
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const goNext = async () => {
    if (!stepValid) {
      setShowErrors(true);
      showToast(
        step?.id === 'documents' ? 'Attach the documents marked required'
          : step?.id === 'appointment' ? 'Pick an office, a day and a time'
            : 'Check the highlighted answers'
      );
      return;
    }
    setShowErrors(false);
    await saveDraft.run();
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setShowErrors(false);
    if (stepIndex === 0) { closeOverlay('serviceApply'); return; }
    setStepIndex((i) => i - 1);
  };

  const saveAndClose = async () => {
    await saveDraft.run();
    showToast('Saved — you can pick this up any time');
    closeOverlay('serviceApply');
  };

  // An upload goes into the citizen's Vault first and is attached to the
  // application from there, so every document they hand over is theirs to reuse
  // and no service asks for the same paper twice.
  const pickFile = (docId) => { pendingDoc.current = docId; fileInput.current?.click(); };
  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const docId = pendingDoc.current;
    if (!file || !docId) return;
    const def = requiredDocs.find((d) => d.id === docId) || { id: docId, label: docId };
    const filed = await fileToVault.run({ file, doc: def });
    setDocs((d) => ({
      ...d,
      [docId]: {
        status: 'attached',
        fileName: file.name,
        size: file.size,
        vaultDocId: filed?.id ?? null,
      },
    }));
    if (filed) { vault.reload(); showToast(`${def.label} attached and saved to your Vault`); }
    else showToast(`${def.label} attached`);
  };
  // "From Vault" attaches the matching document straight away — no chooser —
  // the way the rest of the app does it. When the Vault has nothing that
  // answers this requirement, say so and point at the upload instead of
  // attaching something that is not what was asked for.
  const viewDoc = async (docId) => {
    const vaultDocId = docs[docId]?.vaultDocId;
    const row = vault.storedDocs.find((v) => v.id === vaultDocId);
    if (!row?.blob) { showToast('This document has no preview'); return; }
    const url = URL.createObjectURL(row.blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const removeDoc = (docId) => setDocs((d) => {
    const next = { ...d };
    delete next[docId];
    return next;
  });

  const confirmSubmit = () => {
    requireOtp({
      title: 'Confirm your application',
      message: `Enter the one-time code we sent you to submit your ${service.name.toLowerCase()} application.`,
      confirmLabel: 'Submit application',
      onConfirm: async () => {
        const result = await submit.run();
        if (!result) return;
        setSubmitted(result);
        // A booked visit is a commitment the citizen has to keep, so it becomes
        // a real entry in their Schedule rather than a line buried in the
        // application they would have to go looking for.
        if (result.appointment?.date) {
          addAppointment({
            id: `appt-${result.id}`,
            agency: service.agencyId,
            title: `${service.name} appointment`,
            location: result.appointment.office,
            date: result.appointment.date,
            time: result.appointment.time,
            applicationId: result.id,
          });
        }
        addNotification({
          agency: service.agencyId,
          icon: service.icon,
          title: `${service.name} application submitted`,
          body: result.appointment?.date
            ? `Reference ${result.ref}. Your visit is booked for ${appointmentLabel(result.appointment)}.`
            : `Reference ${result.ref}. We will update you here as it moves.`,
          applicationId: result.id,
        });
        mine.reload();
      },
    });
  };

  // --- chrome -------------------------------------------------------------
  const supportButton = service && (
    <button
      className="press focus-ring"
      onClick={() => openOverlay('askGov', { serviceId: service.id, serviceTitle: service.name })}
      aria-label={`Ask Gov about ${service.name}`}
      style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <Icon name="sparkles" size={17} color="#fff" />
    </button>
  );

  const footer = service && !submitted && !showEligibility && (
    <div style={{
      padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
      display: 'flex', flexDirection: 'column', gap: 9,
    }}>
      {step?.id === 'review' ? (
        <Button fullWidth style={{ background: accent }} onClick={confirmSubmit} disabled={submit.pending}>
          {submit.pending ? 'Submitting…' : 'Submit application'}
        </Button>
      ) : (
        <Button fullWidth style={{ background: accent }} onClick={goNext} disabled={saveDraft.pending}>
          Continue
        </Button>
      )}
      <div style={{ display: 'flex', gap: 9 }}>
        <Button variant="outline" style={{ flex: 1 }} onClick={goBack}>
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button variant="outline" style={{ flex: 1 }} onClick={saveAndClose} disabled={saveDraft.pending}>
          Save &amp; close
        </Button>
      </div>
    </div>
  );

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('serviceApply')}
      title={service?.name || 'Apply'}
      subtitle={agency?.name}
      headerRight={supportButton}
      footer={footer}
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        onChange={onFileChosen}
        style={{ display: 'none' }}
      />

      <VaultPickerSheet
        open={!!pickerFor}
        field={pickerFor}
        candidates={pickerCandidates}
        accent={accent}
        onPick={pick}
        onClose={closePicker}
      />

      {detail.loading ? (
        <LoadingState label="Opening the application…" />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : !service ? null : submitted ? (
        <SubmittedPanel
          service={service}
          application={submitted}
          accent={accent}
          onTrack={() => { closeOverlay('serviceApply'); openOverlay('serviceTrack', { group: service.group, id: submitted.id }); }}
          onApplications={() => { closeOverlay('serviceApply'); navigate('applications'); }}
          onDone={() => closeOverlay('serviceApply')}
        />
      ) : showEligibility ? (
        <EligibilityGate
          rules={eligibility}
          ok={eligibilityOk}
          accent={accent}
          service={service}
          onContinue={() => setEligibilityPassed(true)}
          onAction={(action) => {
            if (!action) return;
            if (action.screen) { closeOverlay('serviceApply'); navigate(action.screen); return; }
            if (action.overlay) openOverlay(action.overlay, action.payload ?? true);
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Where we are */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StepProgress step={stepIndex + 1} total={steps.length} color={accent} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                Step {stepIndex + 1} of {steps.length}
              </span>
              {applicationId && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--fg-4)' }}>
                  <Icon name="check" size={12} color="var(--status-success)" />
                  Draft saved
                </span>
              )}
            </div>
          </div>

          {step?.id === 'prerequisites' && (
            <PrerequisiteStep
              service={service}
              answers={prereqs}
              errors={showErrors ? prereqErrors : {}}
              accent={accent}
              onChange={setPrereqs}
            />
          )}

          {step?.section && (
            <SectionStep
              service={service}
              section={step.section}
              fields={fields}
              errors={sectionErrors}
              touched={touched}
              showErrors={showErrors}
              accent={accent}
              onChange={setField}
              onBlur={(key) => setTouched((t) => ({ ...t, [key]: true }))}
            />
          )}

          {step?.id === 'documents' && (
            <DocumentStep
              docs={requiredDocs}
              attachments={docs}
              missing={showErrors ? docCheck.missing : []}
              accent={accent}
              onPick={pickFile}
              onUseVault={requestFromVault}
              onView={viewDoc}
              onRemove={removeDoc}
            />
          )}

          {step?.id === 'appointment' && (
            <AppointmentStep
              service={service}
              value={appt}
              appointments={appointments}
              accent={accent}
              onChange={setAppt}
            />
          )}

          {step?.id === 'review' && (
            <ReviewStep
              service={service}
              detail={detail.data}
              fields={fields}
              prereqs={prereqs}
              docs={docs}
              appointment={appt}
              accent={accent}
              error={submit.error}
              onTrackExisting={(details) => {
                closeOverlay('serviceApply');
                openOverlay('serviceTrack', { group: details.group, id: details.existingId });
              }}
              onJumpTo={(sectionId) => {
                const idx = steps.findIndex((s) => s.section?.id === sectionId);
                if (idx >= 0) setStepIndex(idx);
              }}
            />
          )}

          <div style={{ height: 4 }} />
        </div>
      )}
    </PageOverlay>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Values a field starts on before the citizen touches it. A select whose first
 * option is a real choice (rather than a "Select..." placeholder) must start on
 * that choice — otherwise the control shows a value the form does not hold, and
 * the citizen is told a question is unanswered when it looks answered.
 * @param {import('../../data/types').Service} service
 * @returns {Record<string, string>}
 */
function fieldDefaults(service) {
  /** @type {Record<string, string>} */
  const out = {};
  (service?.fields || []).forEach((f) => {
    if (f.defaultValue !== undefined) out[f.key] = f.defaultValue;
  });
  return out;
}

/** Prefill from what government already holds, so nothing is asked twice. */
function prefillFromRecord(service, user, persona) {
  const gov = user?.gov;
  /** @type {Record<string, string>} */
  const out = {};
  (service.fields || []).forEach((f) => {
    const key = f.key;
    if (key === 'applicantName' && (user?.name || gov?.name)) out[key] = user?.name || gov?.name;
    // Services that ask for the name in parts — the passport is one — get the
    // parts, not the whole string.
    else if (key === 'surname' && (gov?.lastName || user?.lastName)) out[key] = gov?.lastName || user.lastName;
    else if (key === 'givenNames' && (gov?.firstName || user?.firstName)) out[key] = gov?.firstName || user.firstName;
    else if (key === 'placeOfBirth' && gov?.placeOfBirth) out[key] = gov.placeOfBirth;
    else if (key === 'nationalId' && gov?.nationalId) out[key] = gov.nationalId;
    else if (key === 'dob' && gov?.dob) out[key] = gov.dob;
    else if (key === 'phone' && gov?.phone) out[key] = gov.phone;
    else if (key === 'email' && gov?.email) out[key] = gov.email;
    else if (key === 'address' && gov?.address) out[key] = gov.address;
    else if (key === 'region' && (gov?.region || persona?.region)) out[key] = gov?.region || persona.region;
    else if (key === 'tin' && gov?.tin) out[key] = gov.tin;
    else if (key === 'passport' && gov?.passport) out[key] = gov.passport;
    else if (key === 'licenceNumber' && gov?.driversLicence) out[key] = gov.driversLicence;
    else if (key === 'accountHolder' && user?.name) out[key] = user.name;
    else if (key === 'siteContactName' && user?.name) out[key] = user.name;
    else if (key === 'siteContactPhone' && gov?.phone) out[key] = gov.phone;
  });
  return out;
}

/* -------------------------------------------------------------------------- */

function EligibilityGate({ rules, ok, accent, service, onContinue, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHeading
        eyebrow="Before you apply"
        title={ok ? 'You appear eligible' : 'A few things first'}
        description="We checked these against your account and your government record — there is nothing for you to look up."
        accent={accent}
      />

      <Card>
        {rules.map((rule, i) => (
          <div key={rule.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px',
            borderBottom: i < rules.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
          }}>
            <span aria-hidden="true" style={{
              width: 26, height: 26, flexShrink: 0, borderRadius: 999, marginTop: 1,
              background: rule.ok ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={rule.ok ? 'check' : 'x'} size={14} color={rule.ok ? 'var(--status-success)' : 'var(--status-error)'} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)' }}>
                {rule.ok ? rule.passLabel : rule.failLabel}
              </span>
              {/* What the rule found about this citizen — the date their
                  pension window opens, say. Telling somebody who is close
                  exactly when to come back beats refusing them flatly. */}
              {rule.detail && (
                <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{rule.detail}</p>
              )}
              {!rule.ok && rule.failHint && (
                <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{rule.failHint}</p>
              )}
              {!rule.ok && rule.failAction && (
                <button
                  className="press focus-ring"
                  onClick={() => onAction(rule.failAction)}
                  style={{
                    marginTop: 8, minHeight: 36, padding: '0 14px', border: 'none', borderRadius: 999,
                    background: accent, color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {rule.failAction.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {service.eligibilityNotes?.length > 0 && (
        <InfoPanel tone="neutral" icon="info" title="Also worth knowing">
          {service.eligibilityNotes[0]}
        </InfoPanel>
      )}

      <Button fullWidth style={{ background: ok ? accent : 'var(--surface-4)', color: ok ? '#fff' : 'var(--fg-4)' }} disabled={!ok} onClick={onContinue}>
        {ok ? 'Start my application' : 'Sort the items above first'}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PrerequisiteStep({ service, answers, errors, accent, onChange }) {
  const set = (id, patch) => onChange({ ...answers, [id]: { ...answers[id], ...patch } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading
        eyebrow="Before you start"
        title="What you must already hold"
        description="Nothing can be approved without these. Confirm each one and give us its reference number."
        accent={accent}
      />

      {service.prerequisites.map((p) => {
        const answer = answers[p.id] || {};
        const error = errors[p.id];
        const confirmed = !!answer.confirmed;
        return (
          <div
            key={p.id}
            style={{
              border: `1px solid ${error ? 'var(--status-error)' : confirmed ? 'var(--status-success)' : 'var(--surface-border)'}`,
              borderRadius: 'var(--radius-lg)',
              background: confirmed ? 'var(--status-success-bg)' : 'var(--surface-1)',
              padding: '14px', display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 11 }}>
              <Icon name="key-round" size={17} color={confirmed ? 'var(--status-success)' : accent} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{p.label}</span>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{p.detail}</p>
                <span style={{ display: 'block', marginTop: 4, fontSize: 11.5, color: 'var(--fg-4)' }}>Issued by {p.issuedBy}</span>
              </div>
            </div>

            <button
              type="button"
              className="press focus-ring"
              role="checkbox"
              aria-checked={confirmed}
              onClick={() => set(p.id, { confirmed: !confirmed })}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 46, padding: '10px 13px',
                border: `1.5px solid ${confirmed ? 'var(--status-success)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--radius-md)', background: 'var(--surface-1)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span aria-hidden="true" style={{
                width: 20, height: 20, flexShrink: 0, borderRadius: 6,
                border: `1.5px solid ${confirmed ? 'var(--status-success)' : 'var(--surface-border)'}`,
                background: confirmed ? 'var(--status-success)' : 'var(--surface-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {confirmed && <Icon name="check" size={13} color="#fff" />}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
                I hold this
              </span>
            </button>

            {p.evidenceRequired && confirmed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor={`prereq-${p.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>
                  {p.evidenceLabel}
                </label>
                <input
                  id={`prereq-${p.id}`}
                  value={answer.reference || ''}
                  onChange={(e) => set(p.id, { reference: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '11px 13px',
                    border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-1)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-1)', outline: 'none',
                  }}
                />
              </div>
            )}

            {error && (
              <span role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--status-error)' }}>
                <Icon name="triangle-alert" size={13} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionStep({ service, section, fields, errors, touched, showErrors, accent, onChange, onBlur }) {
  const inSection = visibleFields(service.fields, fields).filter((f) => f.sectionId === section.id);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHeading eyebrow="Your details" title={section.title} description={section.description} accent={accent} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {inSection.map((field) => (
          <FormField
            key={field.key}
            field={field}
            value={fields[field.key] ?? ''}
            error={(showErrors || touched[field.key]) ? errors[field.key] : undefined}
            accent={accent}
            onChange={onChange(field.key)}
            onBlur={() => onBlur(field.key)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AppointmentStep({ service, value, appointments, accent, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading
        eyebrow="In person"
        title={service.appointment.title || 'Book your visit'}
        description="This is the part that cannot be done online. Pick a time that suits you — you can change it later from your Schedule."
        accent={accent}
      />
      <AppointmentPicker
        appointment={service.appointment}
        agencyId={service.agencyId}
        value={value}
        appointments={appointments}
        accent={accent}
        onChange={onChange}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DocumentStep({ docs, attachments, missing, accent, onPick, onUseVault, onView, onRemove }) {
  const missingSet = new Set(missing);
  const done = docs.filter((d) => ['attached', 'fromVault'].includes(attachments[d.id]?.status)).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading
        eyebrow="Documents"
        title="Attach what we need"
        description="IDs and certificates connect straight from your Vault. Anything only you hold — a photo or proof of address — is attached as a photo, scan or PDF, and saved to your Vault so you are never asked for it twice."
        accent={accent}
      />
      <DocumentProgress docs={docs} attachments={attachments} accent={accent} />
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-3)' }}>
        {done} of {docs.length} attached
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((doc) => (
          <DocumentSlot
            key={doc.id}
            doc={doc}
            attachment={attachments[doc.id]}
            error={missingSet.has(doc.label) ? 'This one is required.' : undefined}
            accent={accent}
            onPick={() => onPick(doc.id)}
            onUseVault={() => onUseVault(doc)}
            onView={attachments[doc.id]?.vaultDocId ? () => onView(doc.id) : undefined}
            onRemove={() => onRemove(doc.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ReviewStep({ service, detail, fields, prereqs, docs, appointment, accent, error, onJumpTo, onTrackExisting }) {
  const asked = visibleFields(service.fields, fields);
  const pricing = service.group === 'singleWindow'
    ? singleWindow.priceApplication(detail.fees, fields)
    : { payableNow: detail.fees.filter((f) => f.mandatory), payableOnApproval: detail.fees.filter((f) => !f.mandatory), totalNow: detail.feesPayableNow, totalOnApproval: detail.feesPayableOnApproval };
  const route = service.group === 'singleWindow' ? singleWindow.routeFor(detail.routes, fields) : detail.routes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeading
        eyebrow="Review"
        title="Check this before it goes"
        description="Once submitted, changes have to go through the reviewing agency, so it is worth a read."
        accent={accent}
      />

      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoPanel
            tone={error.code === 'duplicate' ? 'warning' : 'error'}
            icon={error.code === 'duplicate' ? 'copy' : 'triangle-alert'}
            title={error.code === 'duplicate' ? 'You already have this application' : 'That could not be submitted'}
          >
            {error.message}
          </InfoPanel>
          {error.code === 'duplicate' && error.details?.existingId && (
            <Button variant="outline" fullWidth onClick={() => onTrackExisting(error.details)}>
              Track {error.details.existingRef}
            </Button>
          )}
        </div>
      )}

      {service.prerequisites?.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <SectionHeading eyebrow="What you hold" accent={accent} />
          <Card>
            {service.prerequisites.map((p, i) => (
              <DetailRow
                key={p.id}
                label={p.label}
                value={prereqs[p.id]?.reference || (prereqs[p.id]?.confirmed ? 'Confirmed' : '—')}
                mono={!!prereqs[p.id]?.reference}
                last={i === service.prerequisites.length - 1}
              />
            ))}
          </Card>
        </section>
      )}

      {(service.sections || []).map((section) => {
        const rows = asked.filter((f) => f.sectionId === section.id);
        if (!rows.length) return null;
        return (
          <section key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                {section.title}
              </span>
              <button
                className="press focus-ring"
                onClick={() => onJumpTo(section.id)}
                style={{ background: 'none', border: 'none', color: accent, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}
              >
                Change
              </button>
            </div>
            <Card>
              {rows.map((f, i) => (
                <DetailRow key={f.key} label={f.label} value={displayFieldValue(f, fields[f.key])} last={i === rows.length - 1} />
              ))}
            </Card>
          </section>
        );
      })}

      {service.documents?.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionHeading eyebrow="Documents" accent={accent} />
          <DocumentProgress docs={service.documents} attachments={docs} accent={accent} />
          <Card>
            {service.documents.map((d, i) => {
              const a = docs[d.id];
              const attached = a?.status === 'attached' || a?.status === 'fromVault';
              return (
                <DetailRow
                  key={d.id}
                  label={d.label}
                  value={attached
                    ? `${a.fileName || 'Attached'}${a.status === 'fromVault' ? ' · from Vault' : ''}`
                    : d.required ? 'Missing' : 'Not provided'}
                  last={i === service.documents.length - 1}
                />
              );
            })}
          </Card>
        </section>
      )}

      {service.appointment && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <SectionHeading eyebrow="Your visit" accent={accent} />
          <Card>
            <DetailRow label="Office" value={appointment?.office || '—'} />
            <DetailRow label="Date and time" value={appointmentWhen(appointment) || '—'} last />
          </Card>
        </section>
      )}

      {route.length > 1 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <SectionHeading
            eyebrow="Where this goes"
            description={`This application will be seen by ${route.length} agencies. You will see each decision here.`}
            accent={accent}
          />
          <Card>
            {route.map((r, i) => (
              <DetailRow
                key={r.id}
                label={`${i + 1}. ${r.agency?.shortName || r.agencyId}`}
                value={`${r.slaDays} working days`}
                last={i === route.length - 1}
              />
            ))}
          </Card>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeading eyebrow="Fees" accent={accent} />
        <FeeTable fees={[...pricing.payableNow, ...pricing.payableOnApproval]} accent={accent} />
      </section>

      <InfoPanel tone="accent" accent={accent} icon="clock" title={`Decision in ${formatTimeframe(service.timeframeDays)}`}>
        {service.timeframeNote} You pay {formatGyd(pricing.totalNow, { free: 'nothing' })} to submit.
      </InfoPanel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SubmittedPanel({ service, application, accent, onTrack, onApplications, onDone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, paddingTop: 20 }}>
      <span aria-hidden="true" style={{
        width: 64, height: 64, borderRadius: 999, background: 'var(--status-success-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={30} color="var(--status-success)" />
      </span>
      <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--fg-1)' }}>Application submitted</h2>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 310 }}>
        Your {service.name.toLowerCase()} application is in. Follow it in My Applications — we will notify you as it moves between agencies.
      </p>

      <div style={{
        width: '100%', marginTop: 4, padding: '13px 14px', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Your reference
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>{application.ref}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
        <Button fullWidth style={{ background: accent }} onClick={onTrack}>Track this application</Button>
        <Button fullWidth variant="outline" onClick={onApplications}>See all my applications</Button>
        <Button fullWidth variant="outline" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
