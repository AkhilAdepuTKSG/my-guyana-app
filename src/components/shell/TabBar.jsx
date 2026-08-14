import { useAppState } from '../../state/AppStateContext';
import Icon from '../ui/Icon';

const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'services', label: 'Services', icon: 'layout-grid' },
  { id: 'calendar', label: 'Schedule', icon: 'calendar' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
];

// Screens not directly on the tab bar (nis/mops/gpl/vault) still highlight
// the closest primary tab so the bar never looks "orphaned".
function activeTabFor(screen) {
  if (['nis', 'mops', 'gpl'].includes(screen)) return 'home';
  if (screen === 'vault') return 'wallet';
  return screen;
}

export default function TabBar() {
  const { screen, navigate, openOverlay } = useAppState();
  const active = activeTabFor(screen);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
      display: 'flex', alignItems: 'center',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
      padding: '10px 8px calc(10px + env(safe-area-inset-bottom, 0px))',
    }}>
      {TABS.slice(0, 2).map((tab) => (
        <TabButton key={tab.id} tab={tab} active={active === tab.id} onClick={() => navigate(tab.id)} />
      ))}

      <div style={{ width: 64, display: 'flex', justifyContent: 'center' }}>
        <button
          className="press focus-ring"
          onClick={() => openOverlay('askGov')}
          aria-label="Ask Gov"
          style={{
            position: 'relative', top: -22,
            width: 58, height: 58, borderRadius: '50%', border: '4px solid var(--surface-1)',
            background: 'var(--hero-navy-gradient)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <Icon name="sparkles" size={22} color="#fff" />
        </button>
      </div>

      {TABS.slice(2).map((tab) => (
        <TabButton key={tab.id} tab={tab} active={active === tab.id} onClick={() => navigate(tab.id)} />
      ))}
    </div>
  );
}

function TabButton({ tab, active, onClick }) {
  return (
    <button
      className="press focus-ring"
      onClick={onClick}
      style={{
        flex: 1, background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, padding: '4px 2px', color: active ? 'var(--agency-accent)' : 'var(--fg-4)',
      }}
    >
      <Icon name={tab.icon} size={22} color={active ? 'var(--agency-accent)' : 'var(--fg-4)'} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
    </button>
  );
}
