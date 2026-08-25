import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';

// Short one-line pitch for each agency in the discovery list — mockData only
// carries identity fields (name/icon/mark), so the descriptive copy lives here.
const BLURBS = {
  nis: 'Contributions, benefits and pension',
  mops: 'National e-ID, certificates and records',
  gpl: 'Bills, usage, outages and claims',
  gra: 'TIN registration and tax filing',
  immigration: 'Passports and travel documents',
  humanServices: 'Social security and welfare programmes',
  housing: 'House lots and water connections',
  appointments: 'Book appointments across agencies',
};

const ETA = {
  gra: 'Expected Q4 2026',
  immigration: 'Expected Q1 2027',
  humanServices: 'Expected 2027',
  housing: 'Expected 2027',
  appointments: 'Expected 2027',
};

export default function AddAgencyDiscoverySheet() {
  const { isOpen, closeOverlay, openOverlay, persona, showToast } = useAppState();
  const open = isOpen('addAgency');

  // Every live agency in the master list is connectable — nothing is
  // hand-picked down to a favoured few (backlog 1.5). Agencies without their
  // own hub connect through the generic flow and are reached via Services.
  const connected = persona.connectedAgencies || [];
  const candidates = Object.values(AGENCIES).filter((a) => !connected.includes(a.id));
  const available = candidates.filter((a) => !a.comingSoon);
  const comingSoon = candidates.filter((a) => a.comingSoon);

  const addAgency = (agencyId) => {
    closeOverlay('addAgency');
    openOverlay('onboard', { agency: agencyId });
  };

  return (
    <Sheet open={open} onClose={() => closeOverlay('addAgency')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 className="ds-h1" style={{ fontSize: 21, margin: 0, letterSpacing: '-0.02em' }}>Add an agency</h2>
            <p className="ds-caption" style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', margin: 0 }}>
              Agencies join My Guyana one at a time. Add the ones you use.
            </p>
          </div>
          <button
            className="press focus-ring"
            onClick={() => closeOverlay('addAgency')}
            aria-label="Close"
            style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {available.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Available now</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {available.map((a) => (
                <button
                  key={a.id}
                  className="press focus-ring"
                  onClick={() => addAgency(a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px', borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--surface-border)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: `color-mix(in oklch, ${a.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={a.icon} size={19} color={a.mark} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.name}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>{BLURBS[a.id] || `${a.shortName} services`}</span>
                  </span>
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 34, padding: '0 15px', borderRadius: 999, background: 'var(--brand-600)', color: '#fff', fontSize: 13, fontWeight: 800 }}>
                    Add
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="ds-caption" style={{ margin: 0, textAlign: 'center', color: 'var(--fg-3)', padding: '8px 0' }}>
            You've added every agency available right now.
          </p>
        )}

        {comingSoon.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>More agencies coming soon</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comingSoon.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--surface-border)' }}>
                  <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: `color-mix(in oklch, ${a.mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={a.icon} size={19} color={a.mark} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{a.name}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-3)' }}>{BLURBS[a.id] || `${a.shortName} services`} · {ETA[a.id] || 'Coming soon'}</span>
                  </span>
                  <button
                    className="press focus-ring"
                    onClick={() => showToast(`We'll notify you when ${a.shortName} joins My Guyana`)}
                    style={{ flexShrink: 0, minHeight: 38, padding: '0 16px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Notify me
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
