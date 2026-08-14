import { useState } from 'react';
import { useAppState } from '../../state/AppStateContext';
import Icon from '../ui/Icon';
import SegmentedTabs from '../ui/SegmentedTabs';
import HubSwitcherPopover from './HubSwitcherPopover';

// Header shared by every agency hub screen (NIS/MoPS/GPL): back pill,
// title + chevron that opens the hub switcher, bell icon, and an optional
// Overview/Services segmented control.
export default function HubHeader({ title, subtitle, tab, onTabChange }) {
  const { navigate, openOverlay } = useAppState();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 2 : 14 }}>
        <button
          className="press focus-ring"
          onClick={() => navigate('home')}
          aria-label="Back to home"
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevron-left" size={18} color="var(--fg-2)" />
        </button>
        <button
          className="press focus-ring"
          onClick={() => setSwitcherOpen((v) => !v)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', textAlign: 'left' }}
        >
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-1)' }}>{title}</span>
          <Icon name="chevron-down" size={16} color="var(--fg-3)" />
        </button>
        <button
          className="press focus-ring"
          onClick={() => openOverlay('notifications')}
          aria-label="Notifications"
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="bell" size={17} color="var(--fg-2)" />
        </button>
      </div>
      {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginBottom: 14, marginLeft: 44 }}>{subtitle}</div>}
      {tab && (
        <div style={{ marginBottom: 16 }}>
          <SegmentedTabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'services', label: 'Services' }]} active={tab} onChange={onTabChange} />
        </div>
      )}
      <HubSwitcherPopover open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </div>
  );
}
