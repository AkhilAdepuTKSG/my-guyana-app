import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import NotificationBell from '../components/ui/NotificationBell';
import { AGENCIES, NOTIFICATIONS, ONGOING_APPLICATIONS, REGIONS } from '../state/mockData';

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

// Same "socket" family as the source dial: a fixed, ordered set of slots
// around the citizen. Colors match the design's dial/socket-tile treatment
// (bright on dark hero) rather than the app-wide navy accent.
const DIAL_ORDER = ['nis', 'gpl', 'mops'];
const DIAL_DEFS = {
  nis: { color: '#4ade9b', bg: 'rgba(0,155,103,0.20)', ring: 'rgba(74,222,155,0.5)' },
  gpl: { color: '#9ea3ff', bg: 'rgba(100,104,220,0.24)', ring: 'rgba(158,163,255,0.45)' },
  mops: { color: '#ff9ebb', bg: 'rgba(190,60,110,0.24)', ring: 'rgba(255,158,187,0.45)' },
};
const DIAL_BOX = { width: 272, height: 202, cx: 136, cy: 144, r: 86, size: 60 };

function arcPosition(index, count) {
  const t = count === 1 ? 0.5 : index / (count - 1);
  const angle = ((200 + (340 - 200) * t) * Math.PI) / 180;
  return {
    left: Math.round(DIAL_BOX.cx + DIAL_BOX.r * Math.cos(angle) - DIAL_BOX.size / 2),
    top: Math.round(DIAL_BOX.cy + DIAL_BOX.r * Math.sin(angle) - DIAL_BOX.size / 2),
  };
}

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
  const { navigate, openOverlay, showToast, persona, user } = useAppState();
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);

  const connected = persona.connectedAgencies || [];
  // Any connected agency (including MoPS) counts — once the citizen adds one, the
  // dial replaces the "your agencies will gather here" empty state.
  const hasNoAgencies = connected.length === 0;
  const firstName = persona.name.split(' ')[0];
  const regionName = REGIONS.find((r) => r.id === persona.region)?.name || '';
  const dayGreeting = getDayGreeting();
  const heroStatusLabel = persona.eidStatus === 'issued' ? 'Identity verified · e-ID active' : 'Identity verified';
  const showHowItWorks = connected.length <= 1;

  const socketCaption = connected.length === 0
    ? 'Tap an agency to bring it into My Guyana'
    : `${connected.length} ${connected.length === 1 ? 'agency' : 'agencies'} connected`;

  const agencyRowTitle = connected.length === 0 ? 'Connect your first agency' : 'Add another agency';
  const agencyRowSub = connected.length === 0
    ? 'NIS, electricity, appointments and more'
    : `Browse everything you can connect, or manage the ${connected.length} you have`;

  const billIsNextStep = persona.eidStatus === 'issued' && persona.gpl?.status === 'unpaid';

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
    return {
      icon: 'user-lock', eyebrow: 'Ready', title: 'Access your e-ID here',
      sub: 'Open it in your Wallet', cta: 'View', action: () => navigate('wallet'),
    };
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
    ONGOING_APPLICATIONS
      .filter((a) => connected.includes(a.agency) && (a.pendingActions || []).length > 0)
      .forEach((a) => {
        a.pendingActions.forEach((pa, i) => {
          items.push({
            id: `${a.id}-pa-${i}`, agencyId: a.agency, icon: 'triangle-alert',
            agency: AGENCIES[a.agency]?.shortName || a.agency.toUpperCase(),
            title: pa.label, sub: a.title, cta: 'Review', tone: 'error',
            open: () => openOverlay('track', { id: a.id }),
          });
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
  }, [connected, persona, billIsNextStep, openOverlay]);

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

  const ongoingApps = useMemo(() => ONGOING_APPLICATIONS
    .filter((a) => connected.includes(a.agency))
    .map((a) => {
      const mark = AGENCIES[a.agency]?.mark || '#142b44';
      return {
        ...a,
        color: mark,
        iconBg: hexToRgba(mark, 0.12),
        icon: AGENCIES[a.agency]?.icon || 'file-text',
        stepBars: Array.from({ length: a.totalSteps }, (_, i) => (i < a.step ? mark : 'var(--surface-4)')),
      };
    }), [connected]);

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
          className="press focus-ring" onClick={() => openOverlay('profile')}
          aria-label="Your profile, region and settings"
          style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11,
            height: 52, padding: '6px 12px 6px 6px', borderRadius: 999,
            background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
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
      }}>
        {hasNoAgencies ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px 2px',
          }}>
            <span aria-hidden="true" style={{
              width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0,
            }}>{persona.initials}</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
              Your agencies will gather here as you connect them.
            </span>
          </div>
        ) : (
          <div
            role="group" aria-label="Your government ecosystem: agencies connected to your My Guyana"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ position: 'relative', width: DIAL_BOX.width, height: DIAL_BOX.height, margin: '0 auto' }}>
              {DIAL_ORDER.map((id, i) => {
                const agency = AGENCIES[id];
                const def = DIAL_DEFS[id];
                const on = connected.includes(id);
                const pos = arcPosition(i, DIAL_ORDER.length);
                const hasAlert = on && (attentionByAgency[id] || 0) > 0;
                return (
                  <div key={id} style={{
                    position: 'absolute', left: pos.left, top: pos.top, width: DIAL_BOX.size,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                    <button
                      className="press focus-ring"
                      aria-label={`${agency.name}${on ? ' — connected' : ' — not connected yet'}`}
                      onClick={() => (on ? navigate(id) : openOverlay('addAgency'))}
                      style={{
                        position: 'relative', width: DIAL_BOX.size, height: DIAL_BOX.size, borderRadius: '999px',
                        background: on ? def.bg : 'rgba(255,255,255,0.05)',
                        border: on ? `1.5px solid ${def.ring}` : '1.5px dashed rgba(255,255,255,0.3)',
                        color: on ? def.color : 'rgba(255,255,255,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      <Icon name={agency.icon} size={24} color={on ? def.color : 'rgba(255,255,255,0.55)'} />
                      {hasAlert && (
                        <span aria-hidden="true" style={{
                          position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '999px',
                          background: '#e11d2e', border: '2px solid #0a1424',
                        }} />
                      )}
                    </button>
                    <span style={{
                      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      color: on ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
                    }}>{agency.shortName}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
              {socketCaption}
            </p>
          </div>
        )}

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

        {showHowItWorks && (
          <button
            className="press focus-ring" onClick={() => openOverlay('welcome')}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '12px 14px',
              borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
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

      {/* Add-an-agency row — overlaps the hero's bottom edge, constant height
          no matter how many agencies are already connected. */}
      <button
        className="press focus-ring" onClick={() => openOverlay('addAgency')}
        aria-label={agencyRowTitle}
        style={{
          position: 'relative', marginTop: -16, width: '100%', minHeight: 64, padding: '13px 15px',
          borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-md)', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span aria-hidden="true" style={{
          width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: 'var(--brand-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="plus" size={19} color="var(--brand-600)" />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand-600)', letterSpacing: '-0.005em' }}>{agencyRowTitle}</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>{agencyRowSub}</span>
        </span>
        <Icon name="chevron-right" size={16} color="var(--brand-600)" />
      </button>

      <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Complete-your-profile prompt — shown to citizens who registered with a
            document other than an e-ID (session.user.profileComplete === false). */}
        {user && user.profileComplete === false && (
          <button
            className="press focus-ring" onClick={() => openOverlay('completeProfile')}
            aria-label="Complete your profile"
            style={{
              width: '100%', padding: '15px 16px', borderRadius: 18, background: 'var(--brand-600)',
              border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 13, color: '#fff',
            }}
          >
            <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="user-round-pen" size={20} color="#fff" />
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800 }}>Complete your profile</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>
                {user.eidApplied ? 'e-ID booked. Add a few details to open your records.' : 'Add a few details to open your personal records and services.'}
              </span>
            </span>
            <Icon name="arrow-right" size={17} color="rgba(255,255,255,0.9)" />
          </button>
        )}

        {/* Next step nudge */}
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

        {/* Needs your attention */}
        {attentionItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)', flex: 1 }}>Needs your attention</h2>
              <span style={{
                flexShrink: 0, minWidth: 24, height: 24, padding: '0 8px', borderRadius: 999,
                background: 'var(--status-error-bg)', color: 'var(--status-error)', fontSize: 12.5, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{attentionItems.length}</span>
            </div>
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
                <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: oa.color }}>{oa.status}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {oa.stepBars.map((bg, i) => (
                <span key={i} aria-hidden="true" style={{ flex: 1, height: 5, borderRadius: 999, background: bg }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)' }}>Step {oa.step} of {oa.totalSteps}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-3)' }}>Expected {oa.eta}</span>
            </div>
            <button
              className="press focus-ring" onClick={() => openOverlay('track', { id: oa.id })}
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

        {/* You may be eligible */}
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--fg-1)' }}>You may be eligible</h2>
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

      </div>
    </>
  );
}
