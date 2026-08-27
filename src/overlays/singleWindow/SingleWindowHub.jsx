import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import StatusPill from '../../components/ui/StatusPill';
import { useAppState } from '../../state/AppStateContext';
import { useApi, useUserId } from '../../hooks/useApi';
import { getSingleWindowOverview } from '../../api/catalog';
import { listAll, statusLabel, statusTone } from '../../api/applications';
import {
  SectionHeading, InfoPanel, Card, LoadingState, ErrorState,
} from '../../components/service/ServicePieces';
import { formatGyd, formatTimeframe } from '../../lib/format';

// The Single Window section.
//
// Land-development approvals are not separate errands — they are one process
// that touches several agencies. This groups every Single Window service in one
// place, names the agencies that review them, and states the two things that
// gate all of them, before a citizen starts anything.

const ACCENT = '#b45f16';

export default function SingleWindowHub() {
  const { isOpen, closeOverlay, openOverlay } = useAppState();
  const open = isOpen('singleWindow');
  const userId = useUserId();

  const overview = useApi(() => getSingleWindowOverview(), [], { enabled: open });
  const mine = useApi(() => listAll(userId), [userId], { enabled: open && !!userId, initial: [] });

  if (!open) return null;

  const services = overview.data?.services || [];
  const agencies = overview.data?.agencies || [];
  const myApplications = (mine.data || []).filter((a) => a.group === 'singleWindow');

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('singleWindow')}
      title="Single Window"
      subtitle="Central Housing & Planning Authority"
    >
      {overview.loading ? (
        <LoadingState label="Loading the Single Window…" />
      ) : overview.error ? (
        <ErrorState error={overview.error} onRetry={overview.reload} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* --- What this is ------------------------------------------------ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-lg)',
                  background: `color-mix(in oklch, ${ACCENT} 14%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="building-2" size={23} color={ACCENT} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--fg-1)' }}>
                  Single Window
                </h1>
                <span style={{ display: 'block', marginTop: 3, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: ACCENT }}>
                  CH&amp;PA SWAS
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)' }}>
              One window for the approvals you need to develop land — the building permit, the water connection, the power
              connection, and temporary utilities while you build. You apply once here and it is routed to every agency that
              has to sign it off, instead of you visiting each one.
            </p>
          </div>

          {/* --- The two prerequisites --------------------------------------- */}
          <InfoPanel tone="accent" accent={ACCENT} icon="key-round" title="Two things gate everything here">
            You must be able to show that you hold the land — a transport, title, lease or CH&amp;PA agreement of sale — and
            you must have outline planning permission from CH&amp;PA for what you intend to do with it. Every service below
            asks you to confirm both before it goes anywhere.
          </InfoPanel>

          {/* --- Your applications -------------------------------------------- */}
          {myApplications.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading eyebrow="In progress" title="Your Single Window applications" accent={ACCENT} />
              <Card>
                {myApplications.map((a, i) => (
                  <button
                    key={a.id}
                    className="press focus-ring"
                    onClick={() => {
                      if (a.status === 'draft') openOverlay('serviceApply', { serviceId: a.serviceId, applicationId: a.id });
                      else openOverlay('serviceTrack', { group: a.group, id: a.id });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px',
                      border: 'none', borderBottom: i < myApplications.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <span aria-hidden="true" style={{
                      width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)',
                      background: `color-mix(in oklch, ${a.agencyMark} 14%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={a.icon} size={16} color={a.agencyMark} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.title}</span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>
                        {a.status === 'draft' ? 'Draft — not submitted' : a.ref}
                      </span>
                    </span>
                    <StatusPill tone={statusTone(a.status)}>{statusLabel(a.status)}</StatusPill>
                  </button>
                ))}
              </Card>
            </section>
          )}

          {/* --- The services ------------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionHeading
              eyebrow="Services"
              title="What you can apply for"
              description="Each one names the agencies that will review it and what it costs to submit."
              accent={ACCENT}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {services.map((service) => (
                <button
                  key={service.id}
                  className="press focus-ring"
                  onClick={() => openOverlay('serviceView', { serviceId: service.id })}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 12, width: '100%', padding: '15px 15px',
                    border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-xl)',
                    background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)',
                        background: `color-mix(in oklch, ${service.agency?.mark || ACCENT} 14%, transparent)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon name={service.icon} size={19} color={service.agency?.mark || ACCENT} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: 'var(--fg-1)' }}>
                        {service.name}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: service.agency?.mark || ACCENT }}>
                        {service.agency?.shortName}
                      </span>
                    </span>
                    <Icon name="chevron-right" size={18} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 10 }} />
                  </div>

                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{service.summary}</p>

                  {/* The reviewing agencies, as marks */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
                      Reviewed by
                    </span>
                    <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {service.reviewers.map((a) => (
                        <span
                          key={a.id}
                          title={a.name}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999,
                            background: `color-mix(in oklch, ${a.mark} 12%, transparent)`, color: a.mark,
                            fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap',
                          }}
                        >
                          <Icon name={a.icon} size={11} color={a.mark} />
                          {a.shortName}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 14, paddingTop: 10, borderTop: '1px solid var(--surface-hairline)' }}>
                    <MetaBit icon="banknote" label="To apply" value={formatGyd(service.feeFromGyd, { free: 'Free' })} />
                    <MetaBit icon="clock" label="Decision in" value={formatTimeframe(service.timeframeDays)} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* --- Every agency in the window ------------------------------------ */}
          {agencies.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionHeading
                eyebrow="The window"
                title="Agencies that review through here"
                description="You never have to contact any of them yourself. Each records its decision on your tracker."
                accent={ACCENT}
              />
              <Card>
                {agencies.map((a, i) => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderBottom: i < agencies.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  }}>
                    <span aria-hidden="true" style={{
                      width: 34, height: 34, flexShrink: 0, borderRadius: 'var(--radius-md)',
                      background: `color-mix(in oklch, ${a.mark} 14%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={a.icon} size={16} color={a.mark} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.name}</span>
                      <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-3)' }}>{a.shortName}</span>
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          )}

          <div style={{ height: 4 }} />
        </div>
      )}
    </PageOverlay>
  );
}

function MetaBit({ icon, label, value }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
        <Icon name={icon} size={11} color="var(--fg-4)" />
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-1)' }}>{value}</span>
    </span>
  );
}
