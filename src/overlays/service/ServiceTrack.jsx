import { useRef } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StatusPill from '../../components/ui/StatusPill';
import { useAppState } from '../../state/AppStateContext';
import { useApi, useAction, useUserId } from '../../hooks/useApi';
import { getDetail, statusLabel, statusTone } from '../../api/applications';
import { fileUploadedDocument } from '../../api/vault';
import { useVaultAttach } from '../../hooks/useVaultAttach';
import * as cashGrants from '../../api/cashGrants';
import * as singleWindow from '../../api/singleWindow';
import * as gra from '../../api/gra';
import * as immigration from '../../api/immigration';
import * as oldAgePension from '../../api/oldAgePension';

function apiForGroup(group) {
  if (group === 'cashGrants') return cashGrants;
  if (group === 'gra') return gra;
  if (group === 'immigration') return immigration;
  if (group === 'mhsss') return oldAgePension;
  return singleWindow;
}
import AgencyRoute, { routeSummary } from '../../components/service/AgencyRoute';
import StageList from '../../components/service/StageList';
import DocumentSlot from '../../components/service/DocumentSlot';
import DocumentProgress, { documentSummary } from '../../components/service/DocumentProgress';
import VaultPickerSheet from '../../components/service/VaultPickerSheet';
import { appointmentWhen } from '../../components/service/AppointmentPicker';
import {
  SectionHeading, InfoPanel, Card, DetailRow, FeeTable, LoadingState, ErrorState,
} from '../../components/service/ServicePieces';
import { formatGyd, formatDate, formatTimeframe, displayFieldValue } from '../../lib/format';
import { visibleFields } from '../../api/validate';

// The tracker. One screen for all three groups: it shows where an application
// has reached, which agency is holding it and why, what is still outstanding,
// and the full timeline of what has actually happened.

export default function ServiceTrack() {
  const { isOpen, getPayload, closeOverlay, openOverlay, navigate, showToast, requireOtp } = useAppState();
  const open = isOpen('serviceTrack');
  const payload = getPayload('serviceTrack');
  const group = payload && typeof payload === 'object' ? payload.group : null;
  const id = payload && typeof payload === 'object' ? payload.id : null;
  const userId = useUserId();

  const view = useApi(
    () => getDetail({ userId, group, id }),
    [userId, group, id],
    { enabled: open && !!userId && !!group && !!id }
  );

  // Same shared, type-filtered attach behaviour as the apply flow.
  const onVaultPicked = async (field, match) => {
    const result = await attach.run({ doc: field, vaultDoc: match });
    if (result) { showToast(`${match.title} added from your Vault`); view.reload(); }
  };
  const { vault, requestFromVault, pickerFor, pickerCandidates, pick, closePicker } =
    useVaultAttach({ onAttach: onVaultPicked, showToast, active: open });

  const fileInput = useRef(null);
  const pendingDoc = useRef(null);

  const data = view.data;
  const isGro = data?.kind === 'gro';
  const application = isGro ? data?.request : data?.application;
  const service = data?.service;
  const accent = (isGro ? '#7d3550' : data?.reviews?.[0]?.agency?.mark) || 'var(--brand-600)';
  // Which documents this application actually required, given its answers.
  const conditionalDocs = (!isGro && service && application)
    ? apiForGroup(group).requiredDocumentsFor(service, application.fields)
    : [];

  // Anything added here follows the same path as the apply flow: into the
  // citizen's Vault first, then attached to the application from there.
  const attach = useAction(async ({ doc, file, vaultDoc }) => {
    const api = apiForGroup(group);
    // Connecting from the Vault points at whatever is already there;
    // uploading files the document first and points at that.
    const filedId = vaultDoc
      ? vaultDoc.vaultDocId
      : (await fileUploadedDocument({ userId, file, doc, serviceName: service?.name })).id;
    return api.attachDocument({
      userId,
      applicationId: id,
      docId: doc.id,
      fileName: vaultDoc ? (vaultDoc.fileName || vaultDoc.title) : file.name,
      size: vaultDoc ? (vaultDoc.sizeBytes ?? null) : file.size,
      vaultDocId: filedId ?? null,
      fromVault: !!vaultDoc,
    });
  });

  const pay = useAction(async () => apiForGroup(group).payFees({ userId, applicationId: id }));

  if (!open) return null;

  const docDef = (docId) => conditionalDocs.find((d) => d.id === docId)
    || { id: docId, label: application?.documents?.find((d) => d.docId === docId)?.label || 'Document', issuer: '', required: true };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const docId = pendingDoc.current;
    if (!file || !docId) return;
    const result = await attach.run({ doc: docDef(docId), file });
    if (result) { showToast('Attached and saved to your Vault'); vault.reload(); view.reload(); }
  };


  const viewAttached = (doc) => {
    const row = vault.storedDocs.find((v) => v.id === doc.vaultDocId);
    if (!row?.blob) { showToast('This document has no preview'); return; }
    const url = URL.createObjectURL(row.blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const payNow = () => {
    requireOtp({
      title: 'Confirm the payment',
      message: `Enter the one-time code we sent you to pay ${formatGyd(application?.feeTotalGyd || 0)}.`,
      confirmLabel: 'Pay now',
      onConfirm: async () => {
        const result = await pay.run();
        if (result) { showToast('Payment received'); view.reload(); }
      },
    });
  };

  const title = isGro
    ? `${service?.name || 'Certificate'}`
    : application?.title || 'Application';

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('serviceTrack')}
      title={title}
      subtitle={application?.ref}
    >
      <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={onFileChosen} style={{ display: 'none' }} />

      <VaultPickerSheet
        open={!!pickerFor}
        field={pickerFor}
        candidates={pickerCandidates}
        accent={accent}
        onPick={pick}
        onClose={closePicker}
      />

      {view.loading ? (
        <LoadingState label="Checking where this has reached…" />
      ) : view.error ? (
        <ErrorState error={view.error} onRetry={view.reload} title="We could not open this application" />
      ) : !data ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* --- Status header ------------------------------------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                  Reference
                </span>
                <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--fg-1)' }}>
                  {application?.ref}
                </span>
              </div>
              <StatusPill tone={statusTone(application?.status)}>
                {isGro && application?.status === 'approved' && data.certificate ? 'Certificate ready' : statusLabel(application?.status)}
              </StatusPill>
            </div>

            {!isGro && data.reviews?.length > 0 && (
              <InfoPanel
                tone={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'accent'}
                accent={accent}
                icon={application.status === 'approved' ? 'badge-check' : 'route'}
                title={application.status === 'approved' ? 'Approved' : 'Where it is now'}
              >
                {application.status === 'rejected'
                  ? application.decisionNote
                  : routeSummary(data.reviews)}
              </InfoPanel>
            )}

            {isGro && data.registration && (
              <InfoPanel
                tone={data.canCollect ? 'success' : data.registration.status === 'rejected' ? 'error' : 'accent'}
                accent={accent}
                icon={data.canCollect ? 'badge-check' : 'book-open'}
                title={data.canCollect ? 'Your certificate is ready' : 'Registration in progress'}
              >
                {data.canCollect
                  ? 'The registration is approved. You can view your certified copy, download it, and it is filed in your Vault.'
                  : data.registration.status === 'rejected'
                    ? data.registration.rejectionReason
                    : `Registration ${data.registration.regNo} was lodged at the ${data.registration.registryDistrict} district registry. We will show the certificate here as soon as it is approved.`}
              </InfoPanel>
            )}
          </div>

          {/* --- GRO: stages and the certificate --------------------------- */}
          {isGro && (
            <>
              {data.canCollect && (
                <Button
                  fullWidth
                  style={{ background: accent }}
                  icon={<Icon name="file-badge" size={17} color="#fff" />}
                  onClick={() => openOverlay('groCertificate', { requestId: application.id })}
                >
                  View my certificate
                </Button>
              )}

              <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SectionHeading eyebrow="Progress" title="Where the registration has reached" accent={accent} />
                <StageList stages={data.stages} accent={accent} />
              </section>

              {data.registration && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <SectionHeading eyebrow="The register entry" accent={accent} />
                  <Card>
                    <DetailRow label="Registration number" value={data.registration.regNo} mono />
                    <DetailRow label="District registry" value={data.registration.registryDistrict} />
                    <DetailRow label="Registered on" value={formatDate(data.registration.registeredAt)} />
                    <DetailRow label="Handling" value={application.tier === 'expedited' ? 'Expedited' : 'Standard'} />
                    <DetailRow label="Fee" value={formatGyd(application.feeTotalGyd, { free: 'Free' })} last />
                  </Card>
                </section>
              )}
            </>
          )}

          {/* --- The in-person visit ---------------------------------------
              The one thing on this screen the citizen has to physically turn
              up to, so it sits above the routing rather than among the details. */}
          {!isGro && application.appointment?.date && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="In person"
                title="Your appointment"
                description="Bring the originals of every document you connected. The processing time runs from this visit."
                accent={accent}
              />
              <Card>
                <DetailRow label="Office" value={application.appointment.office || '—'} />
                <DetailRow label="Date and time" value={appointmentWhen(application.appointment) || '—'} />
                <DetailRow
                  label="Change it"
                  value="From your Schedule"
                  last
                />
              </Card>
              <Button
                fullWidth
                variant="outline"
                icon={<Icon name="calendar" size={17} color="var(--fg-3)" />}
                onClick={() => { closeOverlay('serviceTrack'); navigate('calendar'); }}
              >
                Open my Schedule
              </Button>
            </section>
          )}

          {/* --- Multi-agency routing -------------------------------------- */}
          {!isGro && data.reviews?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionHeading
                eyebrow={data.reviews.length > 1 ? 'Single Window routing' : 'Review'}
                title={data.reviews.length > 1 ? 'Which agency has it' : 'Who is reviewing this'}
                description={data.reviews.length > 1
                  ? 'You applied once. Each agency records its decision here — you never have to chase them.'
                  : undefined}
                accent={accent}
              />
              <AgencyRoute reviews={data.reviews} />
            </section>
          )}

          {/* --- Outstanding fee ------------------------------------------- */}
          {!isGro && application.feeStatus === 'unpaid' && application.feeTotalGyd > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoPanel tone="warning" icon="receipt" title={`${formatGyd(application.feeTotalGyd)} outstanding`}>
                This is the application fee. Your application stays with the reviewing agency until it is paid.
              </InfoPanel>
              <Button fullWidth style={{ background: accent }} onClick={payNow} disabled={pay.pending}>
                {pay.pending ? 'Processing…' : `Pay ${formatGyd(application.feeTotalGyd)}`}
              </Button>
            </section>
          )}

          {/* --- Documents -------------------------------------------------- */}
          {!isGro && application.documents?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="Documents"
                title="What we hold"
                description="Add anything an agency has asked for — it goes straight back to them, and into your Vault."
                accent={accent}
              />
              <DocumentProgress documents={application.documents} accent={accent} />
              {(() => {
                const summary = documentSummary({ documents: application.documents });
                if (!summary || summary.outstanding.length === 0) return null;
                return (
                  <InfoPanel tone="warning" icon="paperclip" title={`${summary.done} of ${summary.total} documents on file`}>
                    Still needed: {summary.outstanding.join(', ')}.
                  </InfoPanel>
                );
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {application.documents.map((doc) => {
                  // Use the same conditional list the apply flow enforced, so a
                  // document that became required for these answers is not shown
                  // back to the citizen as optional.
                  const def = docDef(doc.docId);
                  return (
                    <DocumentSlot
                      key={doc.docId}
                      doc={def}
                      attachment={doc.status === 'missing'
                        ? undefined
                        : { status: doc.status, fileName: doc.fileName, size: doc.size, vaultDocId: doc.vaultDocId }}
                      accent={accent}
                      onPick={() => { pendingDoc.current = doc.docId; fileInput.current?.click(); }}
                      onUseVault={() => requestFromVault(def)}
                      onView={doc.vaultDocId ? () => viewAttached(doc) : undefined}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* --- Cash grant award -------------------------------------------- */}
          {!isGro && group === 'cashGrants' && application.status === 'approved' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <SectionHeading eyebrow="Your award" accent={accent} />
              <Card>
                <DetailRow label="Amount" value={formatGyd(application.awardedAmountGyd || 0)} />
                <DetailRow label="Paid into" value={application.bankAccountLast4 ? `Account ending ${application.bankAccountLast4}` : '—'} />
                <DetailRow label="Basis" value={data.award?.basis || application.decisionNote || '—'} last />
              </Card>
            </section>
          )}

          {/* --- Pension award ------------------------------------------------ */}
          {!isGro && group === 'mhsss' && application.status === 'approved' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <SectionHeading
                eyebrow="Your pension"
                title="Awarded"
                description="Your award letter is filed in your Vault — only you can open it."
                accent={accent}
              />
              <Card>
                <DetailRow label="Monthly pension" value={formatGyd(application.monthlyBenefitGyd || 0)} />
                <DetailRow label="Transportation grant" value={`${formatGyd(application.transportGrantGyd || 0)} a year`} />
                <DetailRow label="Effective from" value={formatDate(application.awardStartsOn) || '—'} />
                <DetailRow
                  label="Paid to"
                  value={application.disbursementDetail?.last4
                    ? `${application.disbursementMethod === 'mmg' ? 'Wallet' : 'Account'} ending ${application.disbursementDetail.last4}`
                    : '—'}
                  last
                />
              </Card>
              <Button variant="outline" onClick={() => { closeOverlay('serviceTrack'); navigate('vault'); }}>
                Open my award letter in the Vault
              </Button>
            </section>
          )}

          {/* --- What you told us --------------------------------------------- */}
          {!isGro && service && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <SectionHeading eyebrow="What you told us" accent={accent} />
              <Card>
                {visibleFields(service.fields, application.fields)
                  .filter((f) => f.type !== 'checkbox')
                  .map((f, i, arr) => (
                    <DetailRow key={f.key} label={f.label} value={displayFieldValue(f, application.fields[f.key])} last={i === arr.length - 1} />
                  ))}
              </Card>
            </section>
          )}

          {/* --- Fees ----------------------------------------------------------- */}
          {!isGro && data.fees?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading eyebrow="Fees" accent={accent} />
              <FeeTable fees={data.pricing ? [...data.pricing.payableNow, ...data.pricing.payableOnApproval] : data.fees} accent={accent} />
            </section>
          )}

          {service && !isGro && (
            <InfoPanel tone="neutral" icon="clock">
              {service.timeframeNote || `A decision is normally made within ${formatTimeframe(service.timeframeDays)}.`}
            </InfoPanel>
          )}

          <div style={{ height: 4 }} />
        </div>
      )}
    </PageOverlay>
  );
}
