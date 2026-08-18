import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { AGENCIES, SERVICE_DIRECTORY } from '../state/mockData';
import Icon from '../components/ui/Icon';
import Surface from '../components/ui/Surface';
import ListRow from '../components/ui/ListRow';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import NotificationBell from '../components/ui/NotificationBell';

// Short blurbs per category — the source design writes these per-agency;
// mockData only carries name/icon/services, so they're invented here.
const CATEGORY_DESC = {
  'cat-id': 'Identity documents and civil records, issued by MoPS.',
  'cat-social': 'Contributions, benefits and pension, from NIS.',
  'cat-utilities': 'Bills, usage and outages, from GPL.',
  'cat-immigration': 'Passports and travel documents, from Immigration.',
  'cat-finance': 'Cash grants and support, from the Ministry of Finance.',
  'cat-revenue': 'Tax registration and filing, from GRA.',
  'cat-housing': 'House lots and water connections.',
};

// Per-service icon overrides — falls back to the parent category's icon
// when a service isn't named here.
const SERVICE_ICONS = {
  'National e-ID Card': 'id-card',
  'Birth certificate copy': 'file-text',
  'Change of name': 'pen-line',
  'NIS registration': 'badge-check',
  'Sickness Benefit': 'thermometer',
  'Maternity Benefit': 'baby',
  'Funeral Grant': 'flower-2',
  'Pension estimate': 'piggy-bank',
  'Pay electricity bill': 'receipt',
  'Report an outage': 'zap-off',
  'New connection application': 'plug-zap',
  'Guyana Passport': 'plane',
  'Cash Grant': 'banknote',
  'TIN registration': 'hash',
  'File annual return': 'file-text',
  'House lot application': 'home',
  'Water connection': 'droplets',
};

// Maps a service name to the real overlay flow it should open. Anything not
// listed here has no built flow yet, so it just surfaces a toast.
function resolveServiceAction(name, { openOverlay, showToast }) {
  switch (name) {
    case 'National e-ID Card':
      return () => openOverlay('eid');
    case 'NIS registration':
      return () => openOverlay('nisReg');
    case 'Sickness Benefit':
      return () => openOverlay('benefit', { type: 'sickness' });
    case 'Maternity Benefit':
      return () => openOverlay('benefit', { type: 'maternity' });
    case 'Funeral Grant':
      return () => openOverlay('benefit', { type: 'funeral' });
    case 'Pay electricity bill':
      return () => openOverlay('gplPay');
    case 'Report an outage':
      return () => openOverlay('gplOutage');
    case 'Guyana Passport':
      return () => openOverlay('apply', { serviceId: 'passport' });
    case 'Cash Grant':
      return () => openOverlay('apply', { serviceId: 'cashGrant' });
    default:
      return () => showToast(`${name} — coming soon`);
  }
}

function flattenServices() {
  return SERVICE_DIRECTORY.flatMap((cat) =>
    cat.services.map((name) => ({
      id: `${cat.id}::${name}`,
      name,
      categoryId: cat.id,
      categoryName: cat.name,
      agency: cat.agency,
      comingSoon: !!cat.comingSoon,
      icon: SERVICE_ICONS[name] || cat.icon,
    }))
  );
}

export default function Services() {
  const { openOverlay, showToast } = useAppState();
  const [viewMode, setViewMode] = useState('agency'); // 'agency' | 'service'
  const [search, setSearch] = useState('');
  const [openCat, setOpenCat] = useState(SERVICE_DIRECTORY[0].id); // accordion: which agency is expanded

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

      <SegmentedTabs
        tabs={[{ value: 'agency', label: 'By agency' }, { value: 'service', label: 'By service' }]}
        active={viewMode}
        onChange={setViewMode}
      />

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
              Nothing matched. Try a word like bill, pension, appointment or e-ID.
            </div>
          )}
        </Surface>
      ) : viewMode === 'service' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {flat
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((svc) => {
              const agency = AGENCIES[svc.agency];
              return (
                <button
                  key={svc.id}
                  className={svc.comingSoon ? '' : 'press focus-ring'}
                  onClick={svc.comingSoon ? undefined : () => handleServiceTap(svc)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                    minHeight: 112, padding: 14, border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-xl)',
                    background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)', cursor: svc.comingSoon ? 'default' : 'pointer',
                    textAlign: 'left', fontFamily: 'inherit', opacity: svc.comingSoon ? 0.55 : 1,
                  }}
                >
                  <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)', background: `color-mix(in oklch, ${agency?.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={svc.icon} size={17} color={agency?.mark} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, lineHeight: 1.3, color: 'var(--fg-1)' }}>{svc.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: agency?.mark }}>
                      {svc.comingSoon ? 'Coming soon' : svc.categoryName}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SERVICE_DIRECTORY.map((cat) => {
            const agency = AGENCIES[cat.agency];
            const services = flat.filter((s) => s.categoryId === cat.id);
            const expanded = openCat === cat.id;
            return (
              <div key={cat.id} style={{ border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden' }}>
                <button
                  className="press focus-ring"
                  onClick={() => setOpenCat(expanded ? null : cat.id)}
                  aria-expanded={expanded}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: `color-mix(in oklch, ${agency?.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={cat.icon} size={19} color={agency?.mark} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>{cat.name}</span>
                      {cat.comingSoon && (
                        <span style={{ flexShrink: 0, minHeight: 18, padding: '0 7px', borderRadius: 999, background: 'var(--surface-4)', color: 'var(--fg-3)', fontSize: 9.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Soon</span>
                      )}
                    </span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-3)' }}>
                      {`${services.length} service${services.length === 1 ? '' : 's'}`}
                    </span>
                  </span>
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="var(--fg-3)" />
                </button>

                {expanded && (
                  <div style={{ borderTop: '1px solid var(--surface-hairline)' }}>
                    {CATEGORY_DESC[cat.id] && (
                      <p style={{ margin: 0, padding: '11px 14px 5px', fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>
                        {CATEGORY_DESC[cat.id]}
                      </p>
                    )}
                    {services.map((svc, i) => (
                      <ListRow
                        key={svc.id}
                        icon={svc.icon}
                        iconColor={svc.comingSoon ? 'var(--fg-4)' : agency?.mark}
                        iconBg={svc.comingSoon ? 'var(--surface-4)' : `color-mix(in oklch, ${agency?.mark} 14%, transparent)`}
                        title={svc.name}
                        subtitle={svc.comingSoon ? 'Coming soon' : undefined}
                        onClick={svc.comingSoon ? undefined : () => handleServiceTap(svc)}
                        chevron={!svc.comingSoon}
                        style={{ borderBottom: i < services.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '12px 14px', opacity: svc.comingSoon ? 0.55 : 1 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
