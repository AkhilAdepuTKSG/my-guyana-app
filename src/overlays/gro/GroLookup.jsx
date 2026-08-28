import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import StatusPill from '../../components/ui/StatusPill';
import { useAppState } from '../../state/AppStateContext';
import { useApi, useAction, useUserId } from '../../hooks/useApi';
import { getServiceDetail } from '../../api/catalog';
import { lookupRegistration, listRequests, findRegistrationsFor } from '../../api/gro';
import { statusLabel, statusTone } from '../../api/applications';
import {
  SectionHeading, InfoPanel, Card, LoadingState, ErrorState, EmptyState,
} from '../../components/service/ServicePieces';
import { formatGyd, formatDate } from '../../lib/format';

// The GRO entry point.
//
// Registration is done inside the General Register Office, not here — so the
// citizen does not fill in a registration form. They hold a registration number
// and this screen resolves it: it finds the register entry, shows where it has
// reached, and takes them to the certificate once it is approved.

const ACCENT = '#7d3550';

// Format hints only. Every one of these is a register entry that is not held
// against anybody's National ID, so a citizen who copies the example to see
// what happens gets a real result rather than "that belongs to someone else".
const EXAMPLES = {
  svc_gro_birth: 'B/EC/2024/009341',
  svc_gro_death: 'D/EC/2024/001188',
  svc_gro_marriage: 'M/GT/2021/000734',
};

const TYPE_BY_SERVICE = {
  svc_gro_birth: 'birth',
  svc_gro_death: 'death',
  svc_gro_marriage: 'marriage',
};

const SUBJECT_KEYS = ['childName', 'deceasedName', 'partyOneName', 'brideName', 'groomName'];

/** The name a register entry is about, whichever kind it is. */
function subjectOf(registration) {
  const r = registration?.record || {};
  const named = SUBJECT_KEYS.map((k) => r[k]).filter(Boolean);
  if (r.partyOneName && r.partyTwoName) return `${r.partyOneName} & ${r.partyTwoName}`;
  return named[0] || registration?.regNo || 'Register entry';
}

export default function GroLookup() {
  const { isOpen, getPayload, closeOverlay, openOverlay, user, showToast } = useAppState();
  const open = isOpen('groLookup');
  const payload = getPayload('groLookup');
  const serviceId = payload && typeof payload === 'object' ? payload.serviceId : null;
  const userId = useUserId();

  const detail = useApi(() => getServiceDetail(serviceId), [serviceId], { enabled: open && !!serviceId });
  const requests = useApi(() => listRequests(userId), [userId], { enabled: open && !!userId, initial: [] });

  // What the register already holds in this citizen's name. Where there is one,
  // they never have to find their number.
  const nationalId = user?.gov?.nationalId || null;
  const onRecord = useApi(
    () => findRegistrationsFor({ nationalId, type: TYPE_BY_SERVICE[serviceId] || null }),
    [nationalId, serviceId, open],
    { enabled: open && !!nationalId, initial: [] }
  );

  const [regNo, setRegNo] = useState('');
  const [tier, setTier] = useState('standard');

  const lookup = useAction(lookupRegistration);

  useEffect(() => {
    if (open) { setRegNo(''); setTier('standard'); lookup.clearError(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId]);

  if (!open) return null;

  const service = detail.data?.service;
  const fees = detail.data?.fees || [];
  const standardFee = fees.find((f) => f.kind === 'standard');
  const expeditedFee = fees.find((f) => f.kind === 'expedited');
  // Only this certificate type's previous lookups belong on this screen.
  const mine = (requests.data || []).filter((r) => !service || `svc_gro_${r.type}` === service.id);

  const submit = async (number = regNo) => {
    if (!String(number).trim()) { showToast('Enter your registration number'); return; }
    const result = await lookup.run({
      userId,
      regNo: number,
      nationalId,
      tier,
    });
    if (!result) return;

    requests.reload();
    closeOverlay('groLookup');
    if (result.registration.status === 'approved') {
      openOverlay('groCertificate', { requestId: result.request.id });
    } else {
      openOverlay('serviceTrack', { group: 'gro', id: result.request.id });
    }
  };

  const footer = service && (
    <div style={{
      padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
    }}>
      <Button fullWidth style={{ background: ACCENT }} onClick={() => submit()} disabled={lookup.pending}>
        {lookup.pending ? 'Looking it up…' : 'Find my registration'}
      </Button>
    </div>
  );

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('groLookup')}
      title={service?.name || 'Certificate'}
      subtitle="General Register Office"
      footer={footer}
    >
      {detail.loading ? (
        <LoadingState label="Opening the register…" />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : !service ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* --- Already in your name --------------------------------------
              The register is the state's own record. Where it already holds an
              entry against this citizen, making them go and find the number
              first would be asking them for something the state gave them. */}
          {(onRecord.data || []).length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeading
                eyebrow="In your name"
                title={(onRecord.data || []).length === 1
                  ? 'The register already holds this for you'
                  : 'The register already holds these for you'}
                description="Registered against your National ID. Open one to follow it and collect the certificate — no number needed."
                accent={ACCENT}
              />
              {(onRecord.data || []).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="press focus-ring"
                  onClick={() => submit(r.regNo)}
                  disabled={lookup.pending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px',
                    border: `1.5px solid ${ACCENT}`, borderRadius: 'var(--radius-lg)',
                    background: `color-mix(in oklch, ${ACCENT} 7%, transparent)`,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <Icon name="file-badge" size={18} style={{ color: ACCENT, flexShrink: 0 }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{subjectOf(r)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em', color: 'var(--fg-3)' }}>
                      {r.regNo}
                    </span>
                  </span>
                  <StatusPill tone={statusTone(r.status === 'approved' ? 'approved' : 'inReview')}>
                    {r.status === 'approved' ? 'Ready' : 'In progress'}
                  </StatusPill>
                </button>
              ))}
            </section>
          )}

          <SectionHeading
            eyebrow="Your registration number"
            title={(onRecord.data || []).length > 0
              ? 'Or enter a different number'
              : 'Start with the number on your slip'}
            description="The GRO registers the entry and issues this number. Enter it and we will find the entry, show you where it has reached, and give you the certificate once it is approved."
            accent={ACCENT}
          />

          {/* --- The number ------------------------------------------------ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="gro-reg-no" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>
              Registration number
            </label>
            <input
              id="gro-reg-no"
              value={regNo}
              onChange={(e) => { setRegNo(e.target.value.toUpperCase()); lookup.clearError(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={EXAMPLES[service.id] || 'B/GT/1990/004512'}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!!lookup.error}
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 56, padding: '14px 16px',
                border: `1.5px solid ${lookup.error ? 'var(--status-error)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--radius-md)', background: 'var(--surface-2)',
                fontFamily: 'var(--font-mono)', fontSize: 17, letterSpacing: '0.06em',
                color: 'var(--fg-1)', outline: 'none',
              }}
            />
            <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>
              Spacing, dashes and slashes do not matter — {EXAMPLES[service.id]} and {EXAMPLES[service.id]?.replace(/\//g, ' ')} both work.
            </span>
          </div>

          {lookup.error && (
            <InfoPanel tone="error" icon="triangle-alert" title="We could not use that number">
              {lookup.error.message}
            </InfoPanel>
          )}

          {/* --- Handling tier ---------------------------------------------- */}
          {(standardFee || expeditedFee) && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeading eyebrow="Handling" title="How quickly do you need it?" accent={ACCENT} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[standardFee, expeditedFee].filter(Boolean).map((fee) => {
                  const value = fee.kind;
                  const active = tier === value;
                  return (
                    <button
                      key={fee.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className="press focus-ring"
                      onClick={() => setTier(value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', padding: '13px 14px',
                        border: `1.5px solid ${active ? ACCENT : 'var(--surface-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        background: active ? `color-mix(in oklch, ${ACCENT} 8%, transparent)` : 'var(--surface-1)',
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      }}
                    >
                      <span aria-hidden="true" style={{
                        width: 20, height: 20, flexShrink: 0, marginTop: 2, borderRadius: 999,
                        border: `1.5px solid ${active ? ACCENT : 'var(--surface-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {active && <span style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }} />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{fee.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>{formatGyd(fee.amountGyd)}</span>
                        </span>
                        {fee.note && (
                          <span style={{ display: 'block', marginTop: 3, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{fee.note}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <InfoPanel tone="neutral" icon="shield-check" title="Only you can see it">
            When the registration is approved, your certified copy is filed in your Vault under your own account. Nobody else can open it.
          </InfoPanel>

          {/* --- Previous lookups -------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionHeading eyebrow="Your requests" title={`${service.name}s you have looked up`} accent={ACCENT} />
            {requests.loading ? (
              <LoadingState label="Loading your requests…" />
            ) : mine.length === 0 ? (
              <EmptyState
                icon="book-open"
                title="Nothing looked up yet"
                body="Once you enter a registration number it stays here, so you can come back to it without typing it again."
              />
            ) : (
              <Card>
                {mine.map((r, i) => (
                  <button
                    key={r.id}
                    className="press focus-ring"
                    onClick={() => {
                      closeOverlay('groLookup');
                      if (r.status === 'approved') openOverlay('groCertificate', { requestId: r.id });
                      else openOverlay('serviceTrack', { group: 'gro', id: r.id });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px',
                      border: 'none', borderBottom: i < mine.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <span aria-hidden="true" style={{
                      width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)',
                      background: `color-mix(in oklch, ${ACCENT} 14%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={service.icon} size={16} color={ACCENT} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>
                        {r.regNo}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>
                        Looked up {formatDate(r.createdAt)}
                      </span>
                    </span>
                    <StatusPill tone={statusTone(r.status)}>
                      {r.status === 'approved' && r.certificateId ? 'Ready' : statusLabel(r.status)}
                    </StatusPill>
                  </button>
                ))}
              </Card>
            )}
          </section>

          <div style={{ height: 4 }} />
        </div>
      )}
    </PageOverlay>
  );
}
