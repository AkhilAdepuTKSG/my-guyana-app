import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { AGENCIES } from '../state/mockData';
import Icon from '../components/ui/Icon';
import Surface from '../components/ui/Surface';
import ListRow from '../components/ui/ListRow';
import NotificationBell from '../components/ui/NotificationBell';
import { useApi } from '../hooks/useApi';
import { getSingleWindowOverview } from '../api/catalog';
import {
  flattenServices, flattenSeededServices, resolveServiceAction, SERVICE_GROUPS,
} from '../lib/serviceCatalog';

// The services catalogue. Two browse routes, one list:
//   • the Single Window leads, because land-development approvals are a single
//     process across several agencies rather than a set of separate errands;
//   • everything else is a tile, whether its flow is a seeded service or one of
//     the older bespoke overlays.
// Search covers both sources, so a citizen never has to know the difference.

export default function Services() {
  const { openOverlay, showToast } = useAppState();
  const [search, setSearch] = useState('');

  const seeded = useApi(() => flattenSeededServices(), [], { initial: [] });
  const singleWindow = useApi(() => getSingleWindowOverview(), []);

  const legacy = useMemo(() => flattenServices(), []);
  // Every seeded service gets a tile, Single Window included: the grouped
  // section explains how they fit together, but each service is still a service
  // and is reached the same way as any other.
  const seededTiles = seeded.data || [];
  const searchIndex = [...legacy, ...(seeded.data || [])];

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? searchIndex
      .filter((s) => `${s.name} ${s.categoryName} ${s.summary || ''}`.toLowerCase().includes(q))
      .slice(0, 10)
    : [];

  const openService = (svc) => {
    if (svc.comingSoon) return;
    if (svc.source === 'seeded') {
      openOverlay('serviceView', { serviceId: svc.serviceId });
      return;
    }
    resolveServiceAction(svc.name, { openOverlay, showToast })();
  };

  const swAgencies = singleWindow.data?.agencies || [];
  const swCount = singleWindow.data?.services?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ds-h2">Services</div>
        <NotificationBell />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 48, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--surface-border)', background: 'var(--surface-1)' }}>
        <Icon name="search" size={17} color="var(--fg-3)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a service — grant, permit, certificate…"
          aria-label="Search services"
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--fg-1)', fontFamily: 'inherit' }}
        />
        {!!search && (
          <button
            className="press focus-ring"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{ width: 26, height: 26, flexShrink: 0, border: 'none', borderRadius: 999, background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      {q ? (
        <Surface style={{ overflow: 'hidden', padding: 0 }}>
          {searchResults.map((r) => (
            <ListRow
              key={r.id}
              icon={r.icon}
              iconColor={r.comingSoon ? 'var(--fg-4)' : AGENCIES[r.agency]?.mark || 'var(--brand-600)'}
              iconBg={r.comingSoon ? 'var(--surface-4)' : `color-mix(in oklch, ${AGENCIES[r.agency]?.mark || 'var(--brand-600)'} 14%, transparent)`}
              title={r.name}
              subtitle={r.categoryName + (r.comingSoon ? ' · Coming soon' : '')}
              onClick={r.comingSoon ? undefined : () => openService(r)}
              chevron={!r.comingSoon}
              style={{ borderBottom: '1px solid var(--surface-hairline)', opacity: r.comingSoon ? 0.55 : 1 }}
            />
          ))}
          {searchResults.length === 0 && (
            <div style={{ padding: '16px 15px', fontSize: 'var(--text-2xs)', lineHeight: 1.5, color: 'var(--fg-3)' }}>
              Nothing matched. Try a word like grant, water, permit, birth or passport.
            </div>
          )}
        </Surface>
      ) : (
        <>
          {/* --- Single Window: one process, several agencies --------------- */}
          {/* {swCount > 0 && (
            <button
              className="press focus-ring"
              onClick={() => openOverlay('singleWindow')}
              aria-label="Single Window — land development approvals"
              style={{
                display: 'flex', flexDirection: 'column', gap: 13, width: '100%', padding: 17,
                border: 'none', borderRadius: 'var(--radius-2xl)',
                background: 'var(--hero-navy-gradient, linear-gradient(160deg, #142b44 0%, #0e2237 100%))',
                color: '#fff', boxShadow: 'var(--shadow-lg)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden="true" style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="building-2" size={19} color="#fff" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.01em' }}>Single Window</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
                    CH&amp;PA SWAS · {swCount} services
                  </span>
                </span>
                <Icon name="chevron-right" size={19} color="rgba(255,255,255,0.7)" />
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>
                Building permits, water and power connections, and construction utilities. Apply once — we route it to every
                agency that has to approve it and show you where it is. Each one is also a service in its own right below.
              </p>
              {swAgencies.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {swAgencies.map((a) => (
                    <span
                      key={a.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.13)', color: '#fff', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap',
                      }}
                    >
                      <Icon name={a.icon} size={11} color="#fff" />
                      {a.shortName}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )} */}

          {/* --- Everything else, as tiles ---------------------------------- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...seededTiles, ...legacy]
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((svc) => {
                const agency = AGENCIES[svc.agency];
                const mark = agency?.mark || 'var(--brand-600)';
                const label = svc.source === 'seeded'
                  ? SERVICE_GROUPS[svc.group]?.name || svc.categoryName
                  : svc.categoryName;
                return (
                  <button
                    key={svc.id}
                    className={svc.comingSoon ? '' : 'press focus-ring'}
                    onClick={svc.comingSoon ? undefined : () => {
                      if (svc.source === 'seeded') { openService(svc); return; }
                      openOverlay('category', { id: svc.categoryId });
                    }}
                    aria-label={svc.comingSoon ? `${svc.name} — coming soon` : svc.name}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                      minHeight: 112, padding: 14, border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-xl)',
                      background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)', cursor: svc.comingSoon ? 'default' : 'pointer',
                      textAlign: 'left', fontFamily: 'inherit', opacity: svc.comingSoon ? 0.55 : 1,
                    }}
                  >
                    <span aria-hidden="true" style={{
                      width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)',
                      background: `color-mix(in oklch, ${mark} 14%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={svc.icon} size={17} color={mark} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, lineHeight: 1.3, color: 'var(--fg-1)' }}>{svc.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: svc.comingSoon ? 'var(--fg-4)' : mark }}>
                        {svc.comingSoon ? 'Coming soon' : label}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
