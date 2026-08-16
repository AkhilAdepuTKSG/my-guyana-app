import Icon from './Icon';
import { useAppState } from '../../state/AppStateContext';

// The notification bell + unread badge, shared across every screen header so
// the count (from the persisted notifications store) stays consistent. Style
// props keep each screen's existing bell look.
export default function NotificationBell({ size = 38, iconSize = 17, iconColor = 'var(--fg-2)', bordered = true, bg = 'var(--surface-1)' }) {
  const { openOverlay, unreadCount } = useAppState();
  return (
    <button
      className="press focus-ring"
      onClick={() => openOverlay('notifications')}
      aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        border: bordered ? '1px solid var(--surface-border)' : 'none', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <Icon name="bell" size={iconSize} color={iconColor} />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}`,
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
