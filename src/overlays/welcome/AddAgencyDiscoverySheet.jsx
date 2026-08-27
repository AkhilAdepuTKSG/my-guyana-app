import { useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';
import { AGENCY_HUBS, agencyCategoryId, SERVICE_ACCESS, SERVICE_ACCESS_ORDER } from '../../lib/serviceCatalog';

// "Your services" — the Final design's sheet (overlay key kept as 'addAgency'
// for every existing caller). Grid view: the citizen-facing services as square
// tiles with a pin badge (pinned services lead Home, up to six) and an alert
// count. List view: every agency connected from the government record with a
// pin toggle, then anything still to add. Opened from Home's "See all" and as
// John's landing right after sign-up (backlog 1.5 / 2.1).
const MAX_PINNED = 6;

export default function AddAgencyDiscoverySheet() {
  const {
    isOpen, closeOverlay, openOverlay, navigate, persona, showToast, notifications,
    pinnedAgencies, togglePinAgency, agencyUsage, recordAgencyUse,
  } = useAppState();
  const open = isOpen('addAgency');
  const [view, setView] = useState('grid');

  const connected = persona.connectedAgencies || [];
  const candidates = Object.values(AGENCIES).filter((a) => !connected.includes(a.id));
  const available = candidates.filter((a) => !a.comingSoon);
  const comingSoon = candidates.filter((a) => a.comingSoon);

  const alertsFor = (id) => notifications.filter((n) => !n.read && n.agency === id).length;

  const yours = connected
    .map((id) => AGENCIES[id])
    .filter(Boolean)
    .sort((a, b) => {
      const pa = pinnedAgencies.includes(a.id) ? 0 : 1;
      const pb = pinnedAgencies.includes(b.id) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      const ua = agencyUsage[a.id] || 0;
      const ub = agencyUsage[b.id] || 0;
      if (ua !== ub) return ub - ua;
      return a.name.localeCompare(b.name);
    });

  const openAgency = (id) => {
    const def = AGENCIES[id];
    if (!connected.includes(id)) {
      if (def?.comingSoon) { showToast(`${SERVICE_ACCESS[id]?.name || def.shortName} is coming to My Guyana soon`); return; }
      closeOverlay('addAgency');
      openOverlay('onboard', { agency: id });
      return;
    }
    recordAgencyUse(id);
    closeOverlay('addAgency');
    if (AGENCY_HUBS.includes(id)) { navigate(id); return; }
    const catId = agencyCategoryId(id);
    if (catId) { openOverlay('category', { id: catId }); return; }
    showToast(`${def?.shortName || 'This agency'} services are coming to My Guyana`);
  };

  const pin = (id) => {
    if (!connected.includes(id)) { showToast('Connect this service first, then pin it to your Home'); return; }
    togglePinAgency(id);
  };

  const iconBtn = (name, active, onClick, label) => (
    <button
      className="press focus-ring" onClick={onClick} aria-label={label} aria-pressed={active}
      style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: active ? 'var(--surface-1)' : 'none', color: active ? 'var(--fg-1)' : 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: active ? 'var(--shadow-sm)' : 'none' }}
    >
      <Icon name={name} size={17} />
    </button>
  );

  return (
    <Sheet open={open} onClose={() => closeOverlay('addAgency')} maxHeight="92%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Your services</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-2)' }}>
              You can pin up to {MAX_PINNED} in your Home.{pinnedAgencies.length ? ` Pinned ${pinnedAgencies.length} of ${MAX_PINNED}.` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 12, background: 'var(--surface-4)', flexShrink: 0 }}>
            {iconBtn('layout-grid', view === 'grid', () => setView('grid'), 'Grid view')}
            {iconBtn('list', view === 'list', () => setView('list'), 'List view')}
          </div>
          <button
            className="press focus-ring" onClick={() => closeOverlay('addAgency')} aria-label="Close"
            style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '22px 12px', padding: '6px 0 12px' }}>
            {SERVICE_ACCESS_ORDER.map((id) => {
              const svc = SERVICE_ACCESS[id];
              const on = connected.includes(id);
              const isPinned = pinnedAgencies.includes(id);
              const alerts = alertsFor(id);
              return (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <button
                      className="press focus-ring" onClick={() => openAgency(id)} aria-label={`${svc.name}${on ? '' : ' — not connected yet'}`}
                      style={{
                        width: 72, height: 72, borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: `color-mix(in oklch, ${svc.color} 14%, transparent)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.6,
                      }}
                    >
                      <Icon name={svc.icon} size={28} color={svc.color} />
                    </button>
                    {alerts > 0 && (
                      <span aria-label={`${alerts} alert${alerts === 1 ? '' : 's'}`} style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-1)' }}>
                        {alerts}
                      </span>
                    )}
                    <button
                      className="press focus-ring" onClick={() => pin(id)}
                      aria-label={isPinned ? `Unpin ${svc.name} from Home` : `Pin ${svc.name} to Home`} aria-pressed={isPinned}
                      style={{
                        position: 'absolute', right: -8, bottom: -6, width: 30, height: 30, borderRadius: 999, cursor: 'pointer',
                        border: isPinned ? 'none' : '1px solid var(--surface-border)',
                        background: isPinned ? '#0a1424' : 'var(--surface-1)', color: isPinned ? '#fff' : 'var(--fg-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <Icon name={isPinned ? 'pin' : 'pin-off'} size={13} />
                    </button>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--fg-1)' : 'var(--fg-3)', textAlign: 'center', lineHeight: 1.2 }}>{svc.name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {yours.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>
                  Connected from your government record · {yours.length}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {yours.map((a) => {
                    const isPinned = pinnedAgencies.includes(a.id);
                    const label = SERVICE_ACCESS[a.id]?.name;
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16, background: 'var(--surface-1)', border: `1px solid ${isPinned ? 'var(--brand-600)' : 'var(--surface-border)'}` }}>
                        <button
                          className="press focus-ring" onClick={() => openAgency(a.id)}
                          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                        >
                          <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: `color-mix(in oklch, ${a.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={SERVICE_ACCESS[a.id]?.icon || a.icon} size={17} color={a.mark} />
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label || a.name}</span>
                            <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {label ? a.name : isPinned ? 'Pinned to your Home' : (agencyUsage[a.id] || 0) > 0 ? 'Recently used' : 'Connected'}
                            </span>
                          </span>
                        </button>
                        <button
                          className="press focus-ring" onClick={() => pin(a.id)}
                          aria-label={isPinned ? `Unpin ${a.shortName}` : `Pin ${a.shortName} to your Home`} aria-pressed={isPinned}
                          style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 999, cursor: 'pointer', border: isPinned ? 'none' : '1px solid var(--surface-border)', background: isPinned ? '#0a1424' : 'var(--surface-2)', color: isPinned ? '#fff' : 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name={isPinned ? 'pin' : 'pin-off'} size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {available.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Available to add</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {available.map((a) => (
                    <button
                      key={a.id} className="press focus-ring" onClick={() => openAgency(a.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 12px', borderRadius: 16, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    >
                      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: `color-mix(in oklch, ${a.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={a.icon} size={17} color={a.mark} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
                      <span style={{ flexShrink: 0, minHeight: 32, padding: '0 12px', borderRadius: 999, background: 'var(--brand-600)', color: '#fff', fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>Add</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {comingSoon.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Coming soon</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comingSoon.map((a) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 16, border: '1px dashed var(--surface-border)', background: 'var(--surface-2)', opacity: 0.8 }}>
                      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={a.icon} size={17} color="var(--fg-3)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-2)' }}>{SERVICE_ACCESS[a.id]?.name || a.name}</span>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-3)' }}>Soon</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
