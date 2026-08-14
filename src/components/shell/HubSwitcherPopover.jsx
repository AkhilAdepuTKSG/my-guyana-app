import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';
import Icon from '../ui/Icon';

// Dropdown-style popover shared by every agency hub header (NIS/MoPS/GPL):
// jump to another connected agency, or browse the full services directory.
export default function HubSwitcherPopover({ open, onClose }) {
  const { persona, navigate, screen } = useAppState();
  if (!open) return null;

  const connected = persona.connectedAgencies.map((id) => AGENCIES[id]).filter(Boolean);

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 90 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 64, left: 16, right: 16,
          background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--surface-border)',
          padding: 8, animation: 'hubPop var(--dur-fast) var(--ease-emphasis)',
        }}
      >
        {connected.map((agency) => (
          <button
            key={agency.id}
            className="press focus-ring"
            onClick={() => { navigate(agency.id); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: agency.id === screen ? 'var(--surface-4)' : 'none', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'left',
            }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: agency.mark, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: agency.id === screen ? 700 : 500 }}>{agency.name}</span>
            {agency.id === screen && <Icon name="check" size={16} color="var(--agency-accent)" />}
          </button>
        ))}
        <div style={{ height: 1, background: 'var(--surface-hairline)', margin: '6px 4px' }} />
        <button
          className="press focus-ring"
          onClick={() => { navigate('services'); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'left' }}
        >
          <Icon name="layout-grid" size={16} color="var(--fg-2)" />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Browse all services</span>
        </button>
      </div>
    </div>
  );
}
