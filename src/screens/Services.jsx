import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { AGENCIES, SERVICE_DIRECTORY } from '../state/mockData';
import Icon from '../components/ui/Icon';
import Surface from '../components/ui/Surface';
import ListRow from '../components/ui/ListRow';
import NotificationBell from '../components/ui/NotificationBell';
import { flattenServices, resolveServiceAction } from '../lib/serviceCatalog';

// One browse axis only: services, grouped into categories, with the owning
// agency shown as a label on each card (backlog 3.1 — no Agencies tab). The
// cards carry no "View all" links (3.2); tapping one opens the full-screen
// category drill-down (3.3).
export default function Services() {
  const { openOverlay, showToast } = useAppState();
  const [search, setSearch] = useState('');

  const flat = flattenServices();
  const q = search.trim().toLowerCase();
  const searchResults = q
    ? flat.filter((s) => `${s.name} ${s.categoryName}`.toLowerCase().includes(q)).slice(0, 8)
    : [];

  function handleServiceTap(svc) {
    if (svc.comingSoon) return;
    resolveServiceAction(svc.name, { openOverlay, showToast })();
  }

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
          placeholder="Search a service — pay a bill, book a visit…"
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
              iconColor={r.comingSoon ? 'var(--fg-4)' : AGENCIES[r.agency]?.mark}
              iconBg={r.comingSoon ? 'var(--surface-4)' : `color-mix(in oklch, ${AGENCIES[r.agency]?.mark} 14%, transparent)`}
              title={r.name}
              subtitle={r.categoryName + (r.comingSoon ? ' · Coming soon' : '')}
              onClick={r.comingSoon ? undefined : () => handleServiceTap(r)}
              chevron={!r.comingSoon}
              style={{ borderBottom: '1px solid var(--surface-hairline)', opacity: r.comingSoon ? 0.55 : 1 }}
            />
          ))}
          {searchResults.length === 0 && (
            <div style={{ padding: '16px 15px', fontSize: 'var(--text-2xs)', lineHeight: 1.5, color: 'var(--fg-3)' }}>
              Nothing matched. Try a word like bill, pension, appointment or passport.
            </div>
          )}
        </Surface>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SERVICE_DIRECTORY.map((cat) => {
            const agency = AGENCIES[cat.agency];
            return (
              <button
                key={cat.id}
                className="press focus-ring"
                onClick={() => openOverlay('category', { id: cat.id })}
                aria-label={`${cat.name} — ${cat.services.length} services`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                  minHeight: 124, padding: 14, border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-xl)',
                  background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)', background: `color-mix(in oklch, ${agency?.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={cat.icon} size={17} color={agency?.mark} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, lineHeight: 1.3, color: 'var(--fg-1)' }}>{cat.name}</span>
                    {cat.comingSoon && (
                      <span style={{ flexShrink: 0, minHeight: 17, padding: '0 6px', borderRadius: 999, background: 'var(--surface-4)', color: 'var(--fg-3)', fontSize: 9, fontWeight: 800, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Soon</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>
                    {`${cat.services.length} service${cat.services.length === 1 ? '' : 's'}`}
                  </span>
                  {/* The owning agency as a label, not a browse axis (3.1) */}
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: agency?.mark }}>
                    {agency?.shortName}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
