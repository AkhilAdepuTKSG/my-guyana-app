import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import { AGENCIES, REGIONS } from '../state/mockData';
import { AGENCY_HUBS, agencyCategoryId } from '../lib/serviceCatalog';
import { useMyApplications, openTargetFor } from '../hooks/useMyApplications';
import { useApi } from '../hooks/useApi';
import { listServices } from '../api/catalog';
import { useLayout } from '../hooks/useViewport';

// Home, on the web.
//
// The phone's Home is a single scroll of stacked cards, which is right for a
// phone. A window has two dimensions, so this is the same information in two
// columns: what the citizen came to do on the left, and the short answers they
// glance at — what is on today, their e-ID, the four places they go most — in a
// rail on the right.
//
// It reads the same state the phone screen does. Nothing here is a second
// source of truth; the agencies, the applications and the catalogue all come
// from where they already came from.

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** `Wed 2 Sept` — the reference's short form. */
function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** What an agency card says under its name. */
const AGENCY_BLURBS = {
  mops: 'Appointments, service centres',
  nis: 'Contributions, benefits',
  gpl: 'Bills, usage, outages',
  gro: 'Birth, death, marriage',
  gra: 'TIN, licence, tax returns',
  gwi: 'Water connections, bills',
  humanServices: 'Pensions, public assistance',
  housing: 'House lots, land',
  immigration: 'Passports, travel',
  mof: 'Grants and payments',
  chpa: 'Planning and permits',
};

export default function HomeWeb() {
  const {
    navigate, openOverlay, persona, user,
    appointments, recordAgencyUse,
  } = useAppState();
  const routerNavigate = useNavigate();
  const { applications } = useMyApplications();
  const { isWide } = useLayout();

  const connected = persona.connectedAgencies || [];
  const regionName = REGIONS.find((r) => r.id === persona.region)?.name || '';
  const firstName = (persona.name || 'Citizen').split(' ')[0];

  // Up to four agencies on the front page; the rest are a click away.
  const agencyCards = connected.slice(0, 4).map((id) => AGENCIES[id]).filter(Boolean);

  // What is genuinely waiting on the citizen: a draft to finish, or an
  // application an agency has come back to them about.
  const needsAttention = useMemo(
    () => applications.filter((a) => a.status === 'draft' || a.status === 'actionNeeded'),
    [applications]
  );

  // The catalogue's own order — `sortOrder` is what the seed uses to say which
  // services a citizen is most likely to want.
  const services = useApi(() => listServices(), [], { initial: [] });
  const popular = (services.data || []).slice(0, 4);

  const todays = (appointments || []).filter((a) => {
    const when = String(a.date || '').slice(0, 10);
    return when === new Date().toISOString().slice(0, 10);
  });

  const openAgency = (id) => {
    recordAgencyUse(id);
    if (AGENCY_HUBS.includes(id)) { navigate(id); return; }
    const catId = agencyCategoryId(id);
    if (catId) { openOverlay('category', { id: catId }); return; }
    // No legacy category: this agency's services are in the seeded catalogue
    // (Immigration, GRA, GRO, MHSSS…), so Services is where they are — landing
    // there beats telling a citizen that a service they can already apply for
    // is "coming soon".
    navigate('services');
  };

  return (
    <div style={{
      display: 'grid',
      // The rail is a fixed measure and the main column takes the rest, so the
      // rail never squeezes the reading column as the window grows.
      gridTemplateColumns: isWide ? 'minmax(0, 1fr) 400px' : 'minmax(0, 1fr) 360px',
      gap: 28, alignItems: 'start',
    }}>
      {/* ---------------- main column ---------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, minWidth: 0 }}>
        <section>
          {regionName && (
            <span style={{
              display: 'block', marginBottom: 8,
              fontSize: 11.5, fontWeight: 800, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: 'var(--fg-4)',
            }}>
              {regionName.replace('—', '–')}
            </span>
          )}
          <h1 style={{
            margin: 0, fontSize: 34, lineHeight: 1.12, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--fg-1)',
          }}>
            {greeting()}, {firstName}
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--fg-2)' }}>
            Everything government holds for you, in one place.
          </p>
          {persona.eidStatus === 'issued' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 16,
              padding: '7px 14px', borderRadius: 'var(--radius-pill)',
              background: 'var(--status-success-bg)',
              border: '1px solid color-mix(in oklch, var(--status-success) 30%, transparent)',
              fontSize: 12.5, fontWeight: 700, color: 'var(--status-success)',
            }}>
              <Icon name="check-circle-2" size={14} color="var(--status-success)" />
              e-ID connected · verified citizen
            </span>
          )}
        </section>

        {/* ---- Your agencies ---- */}
        <section>
          <SectionRow
            title="Your agencies"
            description="Open an agency to see your records with it, or add another."
            action={(
              <button
                className="press focus-ring"
                onClick={() => openOverlay('addAgency')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 42,
                  padding: '0 18px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
                  color: 'var(--fg-1)', fontSize: 13.5, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                <Icon name="plus" size={15} color="var(--fg-2)" />
                Add an agency
              </button>
            )}
          />
          {agencyCards.length === 0 ? (
            <EmptyCard
              icon="building-2"
              title="No agencies connected yet"
              body="Add the agencies you deal with and your records with them gather here."
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 16, marginTop: 18,
            }}>
              {agencyCards.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} onOpen={() => openAgency(agency.id)} />
              ))}
            </div>
          )}
        </section>

        {/* ---- Needs your attention ---- */}
        {needsAttention.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>
                Needs your attention
              </h2>
              <span aria-hidden="true" style={{
                minWidth: 22, height: 22, padding: '0 7px', borderRadius: 999,
                background: 'var(--status-error)', color: '#fff',
                fontSize: 12, fontWeight: 800, lineHeight: '22px', textAlign: 'center',
              }}>
                {needsAttention.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {needsAttention.map((app) => (
                <AttentionCard
                  key={app.id}
                  app={app}
                  onOpen={() => {
                    const target = openTargetFor(app);
                    openOverlay(target.overlay, target.payload);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ---- Popular services ---- */}
        <section>
          <SectionRow
            title="Popular services"
            action={(
              <button
                className="press focus-ring"
                onClick={() => routerNavigate('/services')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                  color: 'var(--fg-1)', textDecoration: 'underline', textUnderlineOffset: 3,
                  whiteSpace: 'nowrap',
                }}
              >
                Browse all services
              </button>
            )}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 16, marginTop: 18,
          }}>
            {popular.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onOpen={() => routerNavigate(`/services/${encodeURIComponent(service.id)}`)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ---------------- rail ---------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <RailCard
          title="Today"
          aside={<span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>{todayLabel()}</span>}
          footerLabel="Open Schedule"
          onFooter={() => routerNavigate('/schedule')}
        >
          {todays.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-3)' }}>Nothing scheduled for today.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todays.map((a) => (
                <li key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{[a.time, a.office].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ul>
          )}
        </RailCard>

        {persona.eidStatus === 'issued' && (
          <RailCard
            title="Your e-ID"
            footerLabel="Open it in the vault"
            onFooter={() => routerNavigate('/vault')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="fingerprint" size={19} color="var(--fg-2)" />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14.5, fontWeight: 700,
                  letterSpacing: '0.04em', color: 'var(--fg-1)',
                }}>
                  {user?.eidNo || persona.eidNo || '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Expires 2036-08-06</span>
              </span>
            </div>
          </RailCard>
        )}

        <RailCard title="Quick links">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Book an appointment', icon: 'calendar-plus', run: () => routerNavigate('/schedule') },
              { label: 'Document vault', icon: 'folder-lock', run: () => routerNavigate('/vault') },
              { label: 'Wallet', icon: 'wallet', run: () => routerNavigate('/wallet') },
              { label: 'My applications', icon: 'file-text', run: () => routerNavigate('/applications') },
            ].map((link, i, arr) => (
              <button
                key={link.label}
                className="press focus-ring"
                onClick={link.run}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  minHeight: 52, padding: '0 2px', background: 'none',
                  border: 'none',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <Icon name={link.icon} size={17} color="var(--fg-3)" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
                  {link.label}
                </span>
                <Icon name="chevron-right" size={16} color="var(--fg-4)" />
              </button>
            ))}
          </div>
        </RailCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionRow({ title, description, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>
          {title}
        </h2>
        {description && (
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-3)', maxWidth: 420 }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Card({ children, onClick, label }) {
  const inner = (
    <div style={{
      border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
  if (!onClick) return inner;
  return (
    <button
      className="press focus-ring"
      onClick={onClick}
      aria-label={label}
      style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
    >
      {inner}
    </button>
  );
}

function AgencyCard({ agency, onOpen }) {
  return (
    <Card onClick={onOpen} label={`Open ${agency.name}`}>
      <div style={{ padding: '16px 16px 14px', display: 'flex', gap: 13 }}>
        <span aria-hidden="true" style={{
          width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={agency.icon || 'building-2'} size={19} color={agency.mark || 'var(--fg-2)'} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
            {agency.name}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>
            {AGENCY_BLURBS[agency.id] || agency.shortName}
          </span>
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 16px', borderTop: '1px solid var(--surface-hairline)',
      }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>
          Open your records
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>
          Open
          <Icon name="chevron-right" size={14} color="var(--fg-1)" />
        </span>
      </div>
    </Card>
  );
}

function ServiceCard({ service, onOpen }) {
  return (
    <Card onClick={onOpen} label={`${service.name} — read and apply`}>
      <div style={{ padding: '16px', display: 'flex', gap: 13 }}>
        <span aria-hidden="true" style={{
          width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--radius-md)',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={service.icon || 'file-text'} size={18} color="var(--fg-2)" />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
            {service.name}
          </span>
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>
            {service.summary}
          </span>
        </span>
      </div>
    </Card>
  );
}

function AttentionCard({ app, onOpen }) {
  const unfinished = app.status === 'draft';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px',
      border: '1px solid var(--surface-border)',
      borderLeft: '3px solid var(--brand-600)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)',
    }}>
      <span aria-hidden="true" style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={app.icon || 'file-text'} size={19} color="var(--fg-2)" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--fg-4)',
        }}>
          {app.title} · {unfinished ? 'Unfinished' : 'Action needed'}
        </span>
        <span style={{ display: 'block', marginTop: 5, fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
          {unfinished ? `Your ${app.title} is half finished` : `${app.title} needs something from you`}
        </span>
        <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: 'var(--fg-3)' }}>
          {unfinished
            ? 'Pick up where you left off — everything you typed is still there.'
            : 'An agency has asked for something before it can go further.'}
        </span>
      </div>
      <button
        className="press focus-ring"
        onClick={onOpen}
        style={{
          flexShrink: 0, minHeight: 44, padding: '0 22px', borderRadius: 'var(--radius-lg)',
          border: 'none', background: 'var(--brand-800)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {unfinished ? 'Continue' : 'Open'}
      </button>
    </div>
  );
}

function RailCard({ title, aside, children, footerLabel, onFooter }) {
  return (
    <section style={{
      border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)', padding: '18px 20px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
      {footerLabel && (
        <button
          className="press focus-ring"
          onClick={onFooter}
          style={{
            display: 'block', width: '100%', marginTop: 16, paddingTop: 14,
            borderTop: '1px solid var(--surface-hairline)',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          {footerLabel}
        </button>
      )}
    </section>
  );
}

function EmptyCard({ icon, title, body }) {
  return (
    <div style={{
      marginTop: 18, padding: '22px 20px', textAlign: 'center',
      border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)',
    }}>
      <Icon name={icon} size={22} color="var(--fg-4)" />
      <span style={{ display: 'block', marginTop: 10, fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</span>
      <span style={{ display: 'block', marginTop: 5, fontSize: 13, color: 'var(--fg-3)' }}>{body}</span>
    </div>
  );
}
