import { useEffect } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { useApi } from '../../hooks/useApi';
import { getServiceDetail } from '../../api/catalog';
import { useMyApplications, openTargetFor } from '../../hooks/useMyApplications';
import {
  SectionHeading, InfoPanel, Card, StepList, BulletList, FeeTable,
  LoadingState, ErrorState,
} from '../../components/service/ServicePieces';
import { formatGyd, formatTimeframe } from '../../lib/format';

// The View screen every service opens with: what it is, who can apply, what you
// need before you start, what it costs, how long it takes, and which agencies
// will see it. One component serves all three groups — everything on it comes
// from the seeded service record, so no service has a bespoke overview screen.

export default function ServiceView() {
  const { isOpen, getPayload, closeOverlay, openOverlay } = useAppState();
  const open = isOpen('serviceView');
  const payload = getPayload('serviceView');
  const serviceId = payload && typeof payload === 'object' ? payload.serviceId : null;

  const detail = useApi(
    () => getServiceDetail(serviceId),
    [serviceId],
    { enabled: open && !!serviceId }
  );

  // What the citizen already has for this service. The one call the whole app
  // reads, so this screen can never disagree with My Applications.
  const mine = useMyApplications(open);

  // Applying, tracking and the GRO lookup all open on top of this screen, and
  // all change what the citizen has. Coming back from any of them re-reads, so
  // this screen never goes on offering "Apply" for something already applied
  // for. It reloads rather than switching the read off, so what is already on
  // screen stays put while the new answer arrives.
  const covered = isOpen('serviceApply') || isOpen('serviceTrack') || isOpen('groLookup') || isOpen('groCertificate');
  const { reload } = mine;
  useEffect(() => {
    if (open && !covered) reload();
  }, [open, covered, reload]);

  if (!open) return null;

  const service = detail.data?.service;
  const agency = detail.data?.agency;
  const accent = agency?.mark || 'var(--brand-600)';
  // The configured amounts the service publishes — the pension and its
  // transportation grant. Any service that seeds them gets the panel.
  const benefits = (service?.configRows || []).filter((row) => row.showOnView);
  const existing = (mine.applications || []).filter((a) => a.serviceId === serviceId);
  const draft = existing.find((a) => a.status === 'draft');
  // Anything already submitted. If one exists, this screen must open it rather
  // than offering to apply again — sending the citizen into a form that the
  // eligibility gate will refuse is a dead end, not a choice.
  const submitted = existing.find((a) => a.status !== 'draft');

  const openExisting = () => {
    if (!submitted) return;
    const target = openTargetFor(submitted);
    openOverlay(target.overlay, target.payload);
  };

  // The one action this screen offers, decided by what the citizen already has.
  const primary = (() => {
    if (!service) return null;
    if (submitted) {
      return {
        label: service.group === 'gro' && submitted.hasCertificate
          ? 'View my certificate'
          : 'View my application',
        run: openExisting,
      };
    }
    if (service.group === 'gro') {
      return { label: 'Enter my registration number', run: () => openOverlay('groLookup', { serviceId: service.id }) };
    }
    if (draft) {
      return {
        label: 'Resume my application',
        run: () => openOverlay('serviceApply', { serviceId: service.id, applicationId: draft.id }),
      };
    }
    return {
      label: `Apply for ${service.name.toLowerCase()}`,
      run: () => openOverlay('serviceApply', { serviceId: service.id, applicationId: null }),
    };
  })();

  const supportButton = service && (
    <button
      className="press focus-ring"
      onClick={() => openOverlay('askGov', { serviceId: service.id, serviceTitle: service.name })}
      aria-label={`Ask Gov about ${service.name}`}
      style={{
        width: 34, height: 34, borderRadius: 999, border: 'none', background: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <Icon name="sparkles" size={17} color="#fff" />
    </button>
  );

  const footer = service && (
    <div style={{
      padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
      display: 'flex', flexDirection: 'column', gap: 9,
    }}>
      <Button fullWidth style={{ background: accent }} onClick={primary?.run}>
        {primary?.label}
      </Button>
      {/* A second GRO certificate is a different registration number, so that
          service keeps its lookup available alongside the one already collected. */}
      {submitted && service.group === 'gro' && (
        <Button fullWidth variant="outline" onClick={() => openOverlay('groLookup', { serviceId: service.id })}>
          Look up another registration number
        </Button>
      )}
      {submitted && (
        <span style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>
          {`Reference ${submitted.ref} · ${submitted.statusLabel}`}
        </span>
      )}
    </div>
  );

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('serviceView')}
      title={service?.name || 'Service'}
      subtitle={agency?.name}
      headerRight={supportButton}
      footer={footer}
    >
      {detail.loading ? (
        <LoadingState label="Loading this service…" />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : service ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* --- Hero ---------------------------------------------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-lg)',
                  background: `color-mix(in oklch, ${accent} 14%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name={service.icon} size={23} color={accent} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--fg-1)' }}>
                  {service.name}
                </h1>
                <span style={{ display: 'block', marginTop: 3, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent }}>
                  {agency?.shortName}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>{service.summary}</p>

            {/* At-a-glance: cost and time, the two things people ask first */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <GlanceTile
                icon="banknote"
                label="To apply"
                value={formatGyd(detail.data.feesPayableNow, { free: 'Free' })}
                accent={accent}
              />
              <GlanceTile
                icon="clock"
                label="Decision in"
                value={formatTimeframe(service.timeframeDays)}
                accent={accent}
              />
            </div>
          </div>

          {/* --- What you receive ------------------------------------------
              Rendered from the service's own configuration rows, so a change of
              rate is a seed change and this screen follows automatically. Only
              rows the Ministry marks as public appear. */}
          {benefits.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="What you receive"
                title="The payment"
                description="Set by the Ministry. These are the current rates."
                accent={accent}
              />
              <Card>
                {benefits.map((row, i) => (
                  <div key={row.id} style={{
                    display: 'flex', alignItems: 'baseline', gap: 11, padding: '13px 14px',
                    borderBottom: i < benefits.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
                        {row.label}
                      </span>
                      {row.note && (
                        <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>
                          {row.note}
                        </span>
                      )}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: accent }}>
                      {configValueLabel(row)}
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* --- Overview ------------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionHeading eyebrow="Overview" title="What this is" accent={accent} />
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--fg-2)' }}>{service.overview}</p>
          </section>

          {/* --- How it works --------------------------------------------- */}
          {service.steps?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionHeading eyebrow="The process" title="How it works" accent={accent} />
              <StepList steps={service.steps} accent={accent} />
            </section>
          )}

          {/* --- Before you start ------------------------------------------ */}
          {service.prerequisites?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="Before you start"
                title="What you must already hold"
                description="These are checked before anything else. You confirm each one as part of the application."
                accent={accent}
              />
              <Card>
                {service.prerequisites.map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', gap: 11, padding: '13px 14px',
                    borderBottom: i < service.prerequisites.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  }}>
                    <Icon name="key-round" size={16} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: 'var(--fg-1)' }}>{p.label}</span>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{p.detail}</p>
                      <span style={{ display: 'block', marginTop: 4, fontSize: 11.5, color: 'var(--fg-4)' }}>Issued by {p.issuedBy}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* --- Eligibility ----------------------------------------------- */}
          {service.eligibilityNotes?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading eyebrow="Eligibility" title="Who can apply" accent={accent} />
              <BulletList items={service.eligibilityNotes} icon="check" color={accent} />
            </section>
          )}

          {/* --- Documents -------------------------------------------------- */}
          {service.documents?.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="Requirements"
                title="What you will need"
                description="Anything already in your Vault can be attached without uploading it again."
                accent={accent}
              />
              <Card>
                {service.documents.map((d, i) => (
                  <div key={d.id} style={{
                    display: 'flex', gap: 11, padding: '12px 14px',
                    borderBottom: i < service.documents.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  }}>
                    <Icon
                      name={d.required ? 'file-check-2' : 'file'}
                      size={16}
                      color={d.required ? accent : 'var(--fg-4)'}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
                        {d.label}
                        {!d.required && <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · optional</span>}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>{d.issuer}</span>
                      {d.hint && <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>{d.hint}</span>}
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* --- Fees -------------------------------------------------------- */}
          {detail.data.fees.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionHeading eyebrow="Fees" title="What it costs" accent={accent} />
              <FeeTable fees={detail.data.fees} accent={accent} />
            </section>
          )}

          {/* --- Agencies involved -------------------------------------------- */}
          {detail.data.routes.length > 1 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="Single Window"
                title="Who reviews it"
                description="You apply once. We route it to each of these and show you where it has reached — you never contact them yourself."
                accent={accent}
              />
              <Card>
                {detail.data.routes.map((route, i) => (
                  <div key={route.id} style={{
                    display: 'flex', gap: 11, padding: '12px 14px',
                    borderBottom: i < detail.data.routes.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--radius-md)',
                        background: `color-mix(in oklch, ${route.agency?.mark || accent} 14%, transparent)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon name={route.agency?.icon || 'building-2'} size={15} color={route.agency?.mark || accent} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--fg-1)' }}>
                        {route.agency?.shortName || route.agencyId}
                        {route.appliesWhen === 'emptyPlot' && (
                          <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · empty plots only</span>
                        )}
                      </span>
                      <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{route.purpose}</p>
                      <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--fg-4)' }}>
                        {route.slaDays} working-day target
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* --- Timeframe ------------------------------------------------------ */}
          <InfoPanel tone="accent" accent={accent} icon="clock" title={`Decision in ${formatTimeframe(service.timeframeDays)}`}>
            {service.timeframeNote}
          </InfoPanel>

          <div style={{ height: 4 }} />
        </div>
      ) : null}
    </PageOverlay>
  );
}

/**
 * One configured value, written the way a citizen reads it — an amount with its
 * cadence, a count with its unit. The type comes from the row, so the screen
 * does not need to know what any particular key means.
 * @param {import('../../data/types').ServiceConfig} row
 */
function configValueLabel(row) {
  const per = row.unit ? `/${row.unit}` : '';
  switch (row.valueType) {
    case 'money': return `${formatGyd(Number(row.value) || 0)}${per}`;
    case 'years': return `${row.value} ${Number(row.value) === 1 ? 'year' : 'years'}`;
    case 'weeks': return `${row.value} ${Number(row.value) === 1 ? 'week' : 'weeks'}`;
    case 'days': return `${row.value} ${Number(row.value) === 1 ? 'day' : 'days'}`;
    case 'number': return String(row.value);
    default: return String(row.value);
  }
}

function GlanceTile({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6, padding: '13px 14px',
      border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-1)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        <Icon name={icon} size={13} color={accent} />
        {label}
      </span>
      <span style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>{value}</span>
    </div>
  );
}
