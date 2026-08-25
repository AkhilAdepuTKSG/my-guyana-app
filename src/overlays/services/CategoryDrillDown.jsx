import { useEffect, useState } from 'react';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, SERVICE_DIRECTORY } from '../../state/mockData';
import Icon from '../../components/ui/Icon';
import ListRow from '../../components/ui/ListRow';
import { SERVICE_ICONS, resolveServiceAction } from '../../lib/serviceCatalog';

// Full-screen category drill-down (backlog 3.3/3.4): tapping a category or a
// service tile takes over the ENTIRE screen — bottom nav included — and shows
// only that category's services. The only chrome is the back arrow and a
// search field — no screen header, no bell, no tabs. Flows launched from here
// are ordinary overlays at the same layer or above and cover it in turn.
export default function CategoryDrillDown() {
  const { isOpen, closeOverlay, getPayload, openOverlay, showToast } = useAppState();
  const open = isOpen('category');
  const payload = getPayload('category');
  const categoryId = payload && typeof payload === 'object' ? payload.id : null;

  const [search, setSearch] = useState('');
  useEffect(() => {
    if (open) setSearch('');
  }, [open, categoryId]);

  if (!open) return null;

  const cat = SERVICE_DIRECTORY.find((c) => c.id === categoryId) || SERVICE_DIRECTORY[0];
  const agency = AGENCIES[cat.agency];
  const q = search.trim().toLowerCase();
  const services = cat.services
    .map((name) => ({ name, icon: SERVICE_ICONS[name] || cat.icon, comingSoon: !!cat.comingSoon }))
    .filter((s) => !q || s.name.toLowerCase().includes(q));

  const openService = (svc) => {
    if (svc.comingSoon) return;
    resolveServiceAction(svc.name, { openOverlay, showToast })();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column',
      animation: 'pageSlideIn var(--dur-slow) var(--ease-emphasis)',
    }}>
      {/* The only chrome: back + search (3.4) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', flexShrink: 0, background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
        <button
          className="press focus-ring"
          onClick={() => closeOverlay('category')}
          aria-label="Back to services"
          style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minHeight: 44, padding: '0 13px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--surface-border)', background: 'var(--surface-2)' }}>
          <Icon name="search" size={16} color="var(--fg-3)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${cat.name}`}
            aria-label={`Search ${cat.name} services`}
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--fg-1)', fontFamily: 'inherit' }}
          />
          {!!search && (
            <button
              className="press focus-ring"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{ width: 24, height: 24, flexShrink: 0, border: 'none', borderRadius: 999, background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Only this category's services — the owning agency as a grouping label (3.1) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px calc(28px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: agency?.mark, flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)', flex: 1, minWidth: 0 }}>{cat.name}</h1>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: agency?.mark }}>
            {agency?.shortName}
          </span>
        </div>

        <div style={{ border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden' }}>
          {services.map((svc, i) => (
            <ListRow
              key={svc.name}
              icon={svc.icon}
              iconColor={svc.comingSoon ? 'var(--fg-4)' : agency?.mark}
              iconBg={svc.comingSoon ? 'var(--surface-4)' : `color-mix(in oklch, ${agency?.mark} 14%, transparent)`}
              title={svc.name}
              subtitle={svc.comingSoon ? 'Coming soon' : undefined}
              onClick={svc.comingSoon ? undefined : () => openService(svc)}
              chevron={!svc.comingSoon}
              style={{ borderBottom: i < services.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px', opacity: svc.comingSoon ? 0.55 : 1 }}
            />
          ))}
          {services.length === 0 && (
            <div style={{ padding: '16px 15px', fontSize: 'var(--text-2xs)', lineHeight: 1.5, color: 'var(--fg-3)' }}>
              Nothing in {cat.name} matched “{search.trim()}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
