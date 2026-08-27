import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import NotificationBell from '../components/ui/NotificationBell';
import { AGENCIES, NOTIFICATIONS, REGIONS } from '../state/mockData';
import { AGENCY_HUBS, agencyCategoryId, SERVICE_ACCESS } from '../lib/serviceCatalog';
import { missingPersonalFields } from '../lib/profileFields';
import { useApi, useUserId } from '../hooks/useApi';
import { listAll } from '../api/applications';

// ---------------------------------------------------------------------------
// Local helpers / mock-derived data. Home reads persona + shared fixtures but
// keeps its own small, screen-specific constants rather than growing mockData.js.
// ---------------------------------------------------------------------------

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatMoney(n) {
  return `$${Number(n).toLocaleString('en-US')}`;
}

function formatShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// Hero "socket" tiles (per the Final design): citizen-facing service names,
// not agency acronyms. Which agencies fill the sockets is dynamic (backlog
// 2.1) — pinned first, then most-frequently-used, then this recommended trio
// for a first-time citizen. Colors are the design's socket treatment (bright
// on the dark hero); agencies outside the trio derive from their agency mark.
const RECOMMENDED_AGENCIES = ['mops', 'nis', 'gpl'];

// The design's "Complete your profile" banner and next-step card are kept in
// code but switched off on request: profile completion is carried by the red
// dot on the avatar → profile sheet → Personal information, and the e-ID visit
// lives in Appointments / Applications. Flip to true to show them again.
const SHOW_HOME_NUDGES = false;

// One shared empty array, so an unloaded application list keeps the same
// identity between renders.
const EMPTY_APPLICATIONS = [];

const SOCKET_DEFS = {
  mops: { label: 'Digital ID', icon: 'id-card', color: '#ff9ebb', bg: 'rgba(190,60,110,0.24)', ring: 'rgba(255,158,187,0.45)' },
  nis: { label: 'Social Security', icon: 'shield-check', color: '#4ade9b', bg: 'rgba(0,155,103,0.20)', ring: 'rgba(74,222,155,0.5)' },
  gpl: { label: 'Electricity', icon: 'zap', color: '#fbbf24', bg: 'rgba(180,83,9,0.26)', ring: 'rgba(251,191,36,0.45)' },
};

const ELIGIBILITY_DEFS = [
  {
    id: 'maternity', need: 'nis', icon: 'baby', title: 'Maternity benefit',
    reason: 'Your recent contribution record may meet the requirements.', action: 'Check eligibility',
  },
  {
    id: 'pension', need: 'nis', icon: 'landmark', title: 'Your pension progress',
    reason: (p) => `You have ${p.contributions.paid} of ${p.contributions.required} contributions on record.`,
    action: 'View progress',
  },
  {
    id: 'gpl-discount', need: 'gpl', icon: 'percent', title: 'Pensioner electricity discount',
    reason: 'GPL offers a reduced tariff once your NIS pension starts.', action: 'Learn more',
  },
];

export default function Home() {
  const { navigate, openOverlay, showToast, persona, user, updateUser, pinnedAgencies, agencyUsage, recordAgencyUse } = useAppState();
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);
  // Everything the citizen has applied for, across all three services.
  const userId = useUserId();
  const applicationsQuery = useApi(() => listAll(userId), [userId], { enabled: !!userId, initial: [] });
  // Stable across renders so the memos below are not invalidated every time.
  const liveApplications = applicationsQuery.data ?? EMPTY_APPLICATIONS;

  const connected = persona.connectedAgencies || [];

  // Required personal details the government record could not supply — drives
  // the red dot on the avatar and the banner. Both open the profile sheet, whose
  // badged Personal information row leads to the full page (backlog 2.3–2.5).
  const missingPersonal = missingPersonalFields(user, persona);
  const openProfileOrCompletion = () => openOverlay('profile');

  // --- Which agencies lead the Home (backlog 2.1) ---
  // Pinned first; when nothing is pinned, the most-frequently-used; and for a
  // first-time citizen with neither, the system-recommended trio.
  const pinned = pinnedAgencies.filter((id) => connected.includes(id));
  const mostUsed = useMemo(() => connected
    .filter((id) => (agencyUsage[id] || 0) > 0)
    .sort((a, b) => (agencyUsage[b] || 0) - (agencyUsage[a] || 0)), [connected, agencyUsage]);
  // Pinned services fill up to six sockets (the design's cap); otherwise the
  // top three most-used, or the recommended trio for a first-time citizen.
  const featured = pinned.length
    ? pinned.slice(0, 6)
    : (mostUsed.length ? mostUsed : RECOMMENDED_AGENCIES).slice(0, 3);

  // Open an agency: its hub screen when one exists, otherwise its services
  // category — and count the use either way (drives most-frequently-used).
  const openAgency = (id) => {
    recordAgencyUse(id);
    if (AGENCY_HUBS.includes(id)) { navigate(id); return; }
    const catId = agencyCategoryId(id);
    if (catId) { openOverlay('category', { id: catId }); return; }
    showToast(`${AGENCIES[id]?.shortName || 'This agency'} services are coming to My Guyana`);
  };
  // Any connected agency (including MoPS) counts — once the citizen adds one, the
  // dial replaces the "your agencies will gather here" empty state.
  const hasNoAgencies = connected.length === 0;
  const firstName = persona.name.split(' ')[0];
  const regionName = REGIONS.find((r) => r.id === persona.region)?.name || '';
  const dayGreeting = getDayGreeting();
  const heroStatusLabel = persona.eidStatus === 'issued' ? 'Identity verified · e-ID active' : 'Identity verified';
  const showHowItWorks = connected.length <= 1;

  // Only true while the next-step card is shown — otherwise the bill surfaces in the alerts list.
  const billIsNextStep = SHOW_HOME_NUDGES && persona.eidStatus === 'issued' && persona.gpl?.status === 'unpaid';

  const nextStep = useMemo(() => {
    if (persona.eidStatus === 'applied') {
      return {
        icon: 'calendar-check', eyebrow: 'Booked', title: 'Finish your e-ID',
        sub: 'Attend your Service Centre visit', cta: 'View',
        action: () => navigate('calendar'),
      };
    }
    if (persona.eidStatus !== 'issued') {
      return {
        icon: 'fingerprint', eyebrow: 'Start here', title: 'Apply for your e-ID',
        sub: 'Your digital identity — about 5 minutes', cta: 'Start',
        action: () => openOverlay('eid'),
      };
    }
    if (billIsNextStep) {
      return {
        icon: 'receipt', eyebrow: 'Due soon', title: `Electricity bill ${formatMoney(persona.gpl.balance)}`,
        sub: `Due ${formatShortDate(persona.gpl.dueDate)}`, cta: 'Pay',
        action: () => openOverlay('gplPay'),
      };
    }
    // Nothing urgent left. Accessing the e-ID lives in the Vault/profile, not
    // on Home (backlog 2.2) — no card renders and the content below reflows.
    return null;
  }, [persona, billIsNextStep, navigate, openOverlay]);

  // ONE source of truth for "needs attention" — feeds both the list below and
  // the alert dots on the dial nodes, so they can never disagree.
  const attentionItems = useMemo(() => {
    const items = [];
    NOTIFICATIONS.filter((n) => !n.read && connected.includes(n.agency)).forEach((n) => {
      items.push({
        id: n.id, agencyId: n.agency, icon: n.icon,
        agency: AGENCIES[n.agency]?.shortName || n.agency.toUpperCase(),
        title: n.title, sub: n.body, cta: 'Review', tone: n.agency === 'nis' ? 'error' : 'info',
        open: () => openOverlay('notifications'),
      });
    });
    // Live applications that are waiting on the citizen — a reviewing agency
    // has asked for something, or a draft was never submitted.
    liveApplications
      .filter((a) => a.status === 'actionNeeded' || a.status === 'draft')
      .forEach((a) => {
        items.push({
          id: `${a.id}-action`, agencyId: a.agencyId, icon: 'triangle-alert',
          agency: a.agencyShortName,
          title: a.status === 'draft' ? `Finish your ${a.title.toLowerCase()} application` : `${a.agencyShortName} needs something from you`,
          sub: a.title, cta: 'Review', tone: a.status === 'draft' ? 'warning' : 'error',
          open: () => (a.status === 'draft'
            ? openOverlay('serviceApply', { serviceId: a.serviceId, applicationId: a.id })
            : openOverlay('serviceTrack', { group: a.group, id: a.id })),
        });
      });
    // The bill amount is told once: when the next-step card already leads
    // with it, it drops out of this list so the two never repeat themselves.
    if (persona.gpl?.status === 'unpaid' && !billIsNextStep) {
      items.push({
        id: 'gpl-bill', agencyId: 'gpl', icon: 'receipt', agency: 'GPL',
        title: `${formatMoney(persona.gpl.balance)} due ${formatShortDate(persona.gpl.dueDate)}`,
        sub: `Electricity bill`, cta: 'Pay', tone: 'warning',
        open: () => openOverlay('gplPay'),
      });
    }
    return items;
  }, [connected, persona, billIsNextStep, openOverlay, liveApplications]);

  const attentionByAgency = useMemo(() => {
    const m = {};
    attentionItems.forEach((it) => { m[it.agencyId] = (m[it.agencyId] || 0) + 1; });
    return m;
  }, [attentionItems]);

  const toneColors = {
    error: { color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
    warning: { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    info: { color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  };

  // What the citizen has in flight, straight from the applications endpoint —
  // the same rows the Applications tab and the profile section show.
  const ongoingApps = useMemo(() => liveApplications
    .filter((a) => !['approved', 'rejected', 'withdrawn'].includes(a.status))
    .slice(0, 3)
    .map((a) => {
      const mark = a.agencyMark || '#142b44';
      return {
        ...a,
        color: mark.startsWith('#') ? mark : '#142b44',
        iconBg: mark.startsWith('#') ? hexToRgba(mark, 0.12) : 'var(--surface-2)',
        stepBars: Array.from({ length: a.totalSteps }, (_, i) => (i < a.step ? mark : 'var(--surface-4)')),
      };
    }), [liveApplications]);

  const suggestions = useMemo(() => ELIGIBILITY_DEFS
    .filter((sg) => connected.includes(sg.need) && !dismissedSuggestions.includes(sg.id))
    .map((sg) => {
      const mark = AGENCIES[sg.need]?.mark || '#142b44';
      return {
        ...sg,
        agencyLabel: AGENCIES[sg.need]?.shortName,
        color: mark,
        bg: hexToRgba(mark, 0.12),
        reason: typeof sg.reason === 'function' ? sg.reason(persona) : sg.reason,
      };
    }), [connected, dismissedSuggestions, persona]);

  const suggestionAction = (sg) => {
    if (sg.id === 'gpl-discount') { showToast('Coming soon: Pensioner electricity discount'); return; }
    if (sg.id === 'pension') { navigate('nis'); return; }
    openOverlay('benefit', { type: sg.id });
  };

  return (
    <>
      {/* Header — full-bleed navy bar, bleeding past the shell's ambient padding. */}
      <div style={{
        margin: '-20px -20px 0', padding: '16px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 10, background: 'var(--brand-800)',
      }}>
        <button
          className="press focus-ring" onClick={openProfileOrCompletion}
          aria-label={missingPersonal.length > 0 ? `Your profile — ${missingPersonal.length} required ${missingPersonal.length === 1 ? 'detail' : 'details'} missing` : 'Your profile, region and settings'}
          style={{
            position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11,
            height: 52, padding: '6px 12px 6px 6px', borderRadius: 999,
            background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          {missingPersonal.length > 0 && (
            <span aria-hidden="true" style={{
              position: 'absolute', top: 4, left: 36, width: 13, height: 13, borderRadius: 999,
              background: 'var(--status-error)', border: '2px solid var(--surface-1)', zIndex: 1,
            }} />
          )}
          <span aria-hidden="true" style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--agency-accent)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>{persona.initials}</span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{
              fontSize: 15, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{persona.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
              color: 'var(--fg-3)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{regionName}</span>
          </span>
          <Icon name="chevron-down" size={16} color="var(--fg-4)" />
        </button>
        <NotificationBell size={44} iconSize={18} iconColor="var(--fg-1)" />
      </div>

      {/* Hero — dark, full-bleed. Carries the "her government ecosystem" dial
          plus the greeting; nothing else competes for attention here. */}
      <div style={{
        margin: '0 -20px', padding: '24px 20px 28px', background: 'var(--hero-navy-gradient)',
        color: '#fff', display: 'flex', flexDirection: 'column', gap: 18,
        borderRadius: '0 0 24px 24px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.22, color: '#fff', letterSpacing: '-0.015em' }}>
            {dayGreeting}, {firstName}
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>
            Your government, connected around you.
          </p>
          <span style={{
            display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 7, marginTop: 3,
            padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.16)',
          }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: '#4ade9b' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{heroStatusLabel}</span>
          </span>
        </div>

        {/* The citizen's sockets (Final design): the services pinned to Home,
            as square tiles with citizen-facing names — greeting above, tiles
            below, "See all" as the door to everything else. */}
        {hasNoAgencies ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px 2px' }}>
            <span aria-hidden="true" style={{
              width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0,
            }}>{persona.initials}</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
              Your services will gather here as you connect agencies.
            </span>
          </div>
        ) : (
          <div
            role="group" aria-label="Your government: the services you pinned to Home"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 64px)', justifyContent: 'center', gap: '20px 52px', margin: '16px 0' }}
          >
            {featured.map((id) => {
              const agency = AGENCIES[id];
              const def = SOCKET_DEFS[id] || {
                label: SERVICE_ACCESS[id]?.name || agency?.shortName, icon: SERVICE_ACCESS[id]?.icon || agency?.icon || 'building-2',
                color: '#fff',
                bg: hexToRgba(agency?.mark || '#4577d0', 0.3),
                ring: hexToRgba(agency?.mark || '#4577d0', 0.55),
              };
              const on = connected.includes(id);
              const isPinned = pinned.includes(id);
              const hasAlert = on && (attentionByAgency[id] || 0) > 0;
              return (
                <button
                  key={id}
                  className="press focus-ring"
                  aria-label={`${def.label || agency?.name}${isPinned ? ' — pinned' : ''}${on ? '' : ' — not connected yet'}`}
                  onClick={() => (on ? openAgency(id) : openOverlay('addAgency'))}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span aria-hidden="true" style={{
                    position: 'relative', width: 54, height: 54, borderRadius: 17,
                    background: on ? def.bg : 'rgba(255,255,255,0.05)',
                    border: on ? `1.5px solid ${def.ring}` : '1.5px dashed rgba(255,255,255,0.3)',
                    color: on ? def.color : 'rgba(255,255,255,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={def.icon} size={23} color={on ? def.color : 'rgba(255,255,255,0.55)'} />
                    {hasAlert && (
                      <span aria-hidden="true" style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 999, background: 'var(--status-error)', border: '2px solid #091A2B' }} />
                    )}
                    {isPinned && (
                      <span aria-hidden="true" style={{
                        position: 'absolute', top: -4, left: -4, width: 16, height: 16, borderRadius: 999,
                        background: '#0a1424', border: '1.5px solid rgba(255,255,255,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="pin" size={9} color="#fff" />
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? '#fff' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{def.label || agency?.shortName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* See all — opens "Your services": every service, pin up to six (Final design). */}
        <button
          className="press focus-ring" onClick={() => openOverlay('addAgency')}
          aria-label="See all your services"
          style={{
            minHeight: 40, padding: '0 15px', borderRadius: 18, background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.005em' }}>See all</span>
        </button>

        {showHowItWorks && (
          <button
            className="press focus-ring" onClick={() => openOverlay('welcome')}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '12px 14px',
              borderRadius: 16, background: 'linear-gradient(120deg, rgba(214,79,79,0.35), rgba(47,95,191,0.35))',
              border: '1px solid rgba(255,255,255,0.16)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{
              width: 32, height: 32, flexShrink: 0, borderRadius: 999, background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="compass" size={16} color="#fff" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#fff' }}>New here? See how it works</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>Takes a minute</span>
            </span>
            <Icon name="arrow-right" size={15} color="rgba(255,255,255,0.75)" />
          </button>
        )}
      </div>

      <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Complete-your-profile banner (Final design) — shown while the
            profile has missing fields, dismissible. Opens the same profile the
            top-nav avatar opens, where the pending sections are badged
            (backlog 2.3 / 2.4). */}
        {SHOW_HOME_NUDGES && user && missingPersonal.length > 0 && !user.profileBannerDismissed && (
          <div style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--brand-200, var(--surface-border))', borderRadius: 18, background: 'var(--brand-50)', padding: 15, display: 'flex', alignItems: 'center', gap: 13 }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="user-round" size={19} color="#fff" />
            </span>
            <button
              className="press focus-ring" onClick={() => openOverlay('profile')}
              style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit' }}
            >
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Complete your profile</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>
                {`Add your ${missingPersonal.map((f) => f.label.toLowerCase()).join(', ')} so government services can reach you.`}
              </span>
            </button>
            <button
              className="press focus-ring" onClick={() => updateUser({ profileBannerDismissed: true })} aria-label="Dismiss"
              style={{ flexShrink: 0, width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={16} color="var(--fg-3)" />
            </button>
          </div>
        )}

        {/* Next step nudge — only while something is actually pending */}
        {SHOW_HOME_NUDGES && nextStep && (
        <button
          className="press focus-ring" onClick={nextStep.action}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--surface-border)',
            borderRadius: 18, background: 'var(--surface-1)', padding: 16, display: 'flex',
            alignItems: 'center', gap: 13, boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span aria-hidden="true" style={{
            width: 42, height: 42, flexShrink: 0, borderRadius: 13, background: 'rgba(20,43,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={nextStep.icon} size={20} color="#142b44" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              {nextStep.eyebrow}
            </span>
            <span style={{ display: 'block', marginTop: 3, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>{nextStep.title}</span>
            <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>{nextStep.sub}</span>
          </span>
          <span style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, minHeight: 36, padding: '0 13px',
            borderRadius: 999, background: 'var(--brand-600)', color: '#fff', fontSize: 12.5, fontWeight: 800,
          }}>
            {nextStep.cta}<Icon name="arrow-right" size={14} color="#fff" />
          </span>
        </button>
        )}

        {/* Eligible benefits and grants — the approved label (backlog 2.6).
            The account alerts and the eligibility suggestions live under this
            one section; the cards themselves are unchanged. */}
        {(attentionItems.length > 0 || suggestions.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)' }}>Eligible benefits and grants</h2>
            {attentionItems.length > 0 && (
              <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
                {attentionItems.map((at, i) => {
                  const tone = toneColors[at.tone] || toneColors.info;
                  return (
                    <button
                      key={at.id} className="press focus-ring" onClick={at.open}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none',
                        borderBottom: i < attentionItems.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                        background: 'none', padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <span aria-hidden="true" style={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: tone.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name={at.icon} size={17} color={tone.color} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: tone.color }}>
                          {at.agency}
                        </span>
                        <span style={{ display: 'block', marginTop: 2, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.3 }}>{at.title}</span>
                        <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-2)' }}>{at.sub}</span>
                      </span>
                      <span style={{
                        flexShrink: 0, minHeight: 34, padding: '0 13px', borderRadius: 999, background: 'var(--surface-4)',
                        color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center',
                      }}>{at.cta}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {suggestions.map((sg) => (
              <div key={sg.id} className="surface" style={{ padding: 16, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span aria-hidden="true" style={{
                    width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: sg.bg, color: sg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={sg.icon} size={18} color={sg.color} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: sg.color }}>
                      {sg.agencyLabel}
                    </span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 15, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.3 }}>{sg.title}</span>
                    <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{sg.reason}</span>
                  </span>
                  <button
                    className="press focus-ring" aria-label="Dismiss suggestion"
                    onClick={() => setDismissedSuggestions((prev) => [...prev, sg.id])}
                    style={{
                      width: 28, height: 28, flexShrink: 0, borderRadius: 999, border: 'none', background: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg-4)',
                    }}
                  >
                    <Icon name="x" size={15} color="var(--fg-4)" />
                  </button>
                </div>
                <button
                  className="press focus-ring" onClick={() => suggestionAction(sg)}
                  style={{
                    display: 'flex', alignItems: 'stretch', width: '100%', height: 44, border: 'none', borderRadius: 12,
                    background: 'var(--brand-50)', cursor: 'pointer', overflow: 'hidden', padding: 0,
                  }}
                >
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-800)', fontSize: 13.5, fontWeight: 700 }}>
                    {sg.action}
                  </span>
                  <span aria-hidden="true" style={{ width: 44, height: 44, flexShrink: 0, background: sg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="arrow-right" size={15} color="#fff" />
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Onboarding-style empty state, in place of a populated ecosystem. */}
        {hasNoAgencies && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 16px 16px', borderRadius: 12,
            background: 'linear-gradient(180deg, rgba(140,147,207,0.2), var(--surface-2) 60%)',
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--brand-700)' }}>My Guyana is here for you</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)' }}>
              As you use services, everything gathers here — no need to remember which office handles what.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: 'route', color: 'var(--status-info)', bg: 'var(--status-info-bg)', title: 'Every application in one place', body: 'Follow anything you have applied for, across any agency, without chasing each one separately.' },
                { icon: 'bell-ring', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', title: 'Alerts that reach you', body: 'A payment coming due, a document missing, a decision ready — it surfaces here first.' },
                { icon: 'lightbulb', color: 'var(--brand-600)', bg: 'var(--brand-100)', title: 'Suggestions as you go', body: 'Based on your record, we’ll point out benefits and services you may be entitled to.' },
              ].map((p) => (
                <div key={p.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span aria-hidden="true" style={{
                    width: 32, height: 32, flexShrink: 0, borderRadius: 10, background: p.bg, color: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={p.icon} size={16} color={p.color} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: p.color, lineHeight: 1.35 }}>{p.title}</span>
                    <span style={{ display: 'block', marginTop: 3, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{p.body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ongoing Applications */}
        {ongoingApps.length > 0 && (
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)' }}>Ongoing Applications</h2>
        )}
        {ongoingApps.map((oa) => (
          <div key={oa.id} className="surface" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{
                width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: oa.iconBg, color: oa.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={oa.icon} size={19} color={oa.color} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: 'var(--fg-1)' }}>{oa.title}</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: oa.color }}>{oa.statusLabel}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {oa.stepBars.map((bg, i) => (
                <span key={i} aria-hidden="true" style={{ flex: 1, height: 5, borderRadius: 999, background: bg }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)' }}>Step {oa.step} of {oa.totalSteps}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)' }}>{oa.agencyShortName}</span>
            </div>
            <button
              className="press focus-ring"
              onClick={() => (oa.status === 'draft'
                ? openOverlay('serviceApply', { serviceId: oa.serviceId, applicationId: oa.id })
                : openOverlay('serviceTrack', { group: oa.group, id: oa.id }))}
              style={{
                display: 'flex', alignItems: 'stretch', width: '100%', height: 48, border: 'none', borderRadius: 14,
                background: 'var(--brand-50)', cursor: 'pointer', overflow: 'hidden', padding: 0,
              }}
            >
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-800)', fontSize: 14, fontWeight: 700 }}>
                Continue
              </span>
              <span aria-hidden="true" style={{ width: 48, height: 48, flexShrink: 0, background: oa.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrow-right" size={16} color="#fff" />
              </span>
            </button>
          </div>
        ))}

      </div>
    </>
  );
}
