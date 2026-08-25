import { useAppState } from '../../state/AppStateContext';
import Icon from '../ui/Icon';

const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'services', label: 'Services', icon: 'layout-grid' },
  { id: 'calendar', label: 'Appointments', icon: 'calendar' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
];
const PRIMARY_IDS = TABS.map((t) => t.id);

export default function TabBar() {
  const { screen, navigate, openOverlay, closeOverlay, isOpen } = useAppState();

  // "Inside a flow" (backlog 3.5): the services category drill-down is open, or
  // the current screen is one reached from within a tab (agency hubs, Vault)
  // rather than a primary tab itself. In that state the Home slot becomes a
  // contextual Back; at the top level it is Home again.
  const drilledIn = isOpen('category');
  const inFlow = drilledIn || !PRIMARY_IDS.includes(screen);

  const goBack = () => {
    if (drilledIn) { closeOverlay('category'); return; } // back to the Services top level
    navigate('home'); // hub/Vault screens sit one level below Home
  };

  // The other tabs keep working everywhere — leaving via a tab first closes the
  // drill-down so navigation never happens underneath it.
  const goTab = (id) => {
    if (drilledIn) closeOverlay('category');
    navigate(id);
  };

  // While inside a flow the contextual Back is the highlighted, primary action;
  // on a primary tab the active highlight follows the screen as before.
  const renderTab = (tab) => {
    if (tab.id === 'home' && inFlow) {
      return (
        <TabButton
          key="back"
          tab={{ id: 'back', label: 'Back', icon: 'arrow-left' }}
          active
          onClick={goBack}
        />
      );
    }
    return <TabButton key={tab.id} tab={tab} active={!inFlow && screen === tab.id} onClick={() => goTab(tab.id)} />;
  };

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
      display: 'flex', alignItems: 'center',
      background: 'var(--surface-1)', borderTop: '1px solid var(--surface-hairline)',
      padding: '10px 8px calc(10px + env(safe-area-inset-bottom, 0px))',
    }}>
      {TABS.slice(0, 2).map(renderTab)}

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

      {TABS.slice(2).map(renderTab)}
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
