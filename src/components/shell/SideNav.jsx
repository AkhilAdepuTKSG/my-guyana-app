import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { SCREEN_PATHS } from '../../state/routes';

// The application's navigation.
//
// Real links, not buttons: each one has an address, so the browser's back
// button, middle-click and "open in new tab" all behave the way a citizen
// expects from a website. `NavLink` marks the current one itself, from the URL,
// which is why nothing here tracks an "active" flag of its own.

/** @type {{to: string, label: string, icon: string, end?: boolean}[]} */
export const NAV_ITEMS = [
  { to: SCREEN_PATHS.home, label: 'Home', icon: 'house', end: true },
  { to: SCREEN_PATHS.services, label: 'Services', icon: 'layout-grid' },
  { to: SCREEN_PATHS.applications, label: 'Applications', icon: 'file-text' },
  { to: SCREEN_PATHS.calendar, label: 'Schedule', icon: 'calendar-days' },
  { to: SCREEN_PATHS.vault, label: 'Vault', icon: 'folder-lock' },
  { to: SCREEN_PATHS.wallet, label: 'Wallet', icon: 'wallet' },
];

/**
 * @param {{width: number, collapsed?: boolean, onNavigate?: () => void}} props
 */
export default function SideNav({ width, collapsed = false, onNavigate }) {
  return (
    <nav
      aria-label="Main"
      style={{
        width, flexShrink: 0, height: '100%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: collapsed ? '16px 8px' : '16px 12px',
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--surface-hairline)',
        boxSizing: 'border-box',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className="press focus-ring"
          // Collapsed, the icon is all there is, so the name has to reach the
          // citizen some other way.
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            minHeight: collapsed ? 44 : 46,
            padding: collapsed ? 0 : '0 14px',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none', fontFamily: 'inherit',
            background: isActive ? 'var(--nav-active-bg, #eef2f6)' : 'transparent',
            color: isActive ? 'var(--fg-1)' : 'var(--fg-2)',
            fontSize: 14.5, fontWeight: isActive ? 700 : 600,
          })}
        >
          {({ isActive }) => (
            <>
              <Icon
                name={item.icon}
                size={19}
                color={isActive ? 'var(--fg-1)' : 'var(--fg-3)'}
                strokeWidth={isActive ? 2.3 : 2}
              />
              {!collapsed && item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
