import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/AppStateContext';
import Icon from '../ui/Icon';
import coatOfArms from '../../assets/guyana-coat-of-arms.png';

// The application bar: who this is, one search across everything, and the
// controls that belong to the citizen rather than to any one page.
//
// It spans the window above both the sidebar and the content, the way a web
// application's bar does — the brand sits over the navigation, the search over
// the page.
export default function TopNav({ height = 64, onToggleAssistant, assistantOpen }) {
  const { persona, user, unreadCount, openOverlay, theme, toggleTheme } = useAppState();
  const routerNavigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    // Search lives on the Services screen, which already has the index and the
    // filtering; this hands it the query rather than duplicating either.
    routerNavigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  return (
    <header style={{
      height, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--surface-hairline)',
    }}>
      {/* Brand */}
      <button
        className="press focus-ring"
        onClick={() => routerNavigate('/')}
        aria-label="My Guyana — home"
        style={{
          display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}
      >
        <span aria-hidden="true" style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 9,
          border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={coatOfArms} alt="" style={{ width: 24, height: 'auto', display: 'block' }} />
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>
          My Guyana
        </span>
      </button>

      {/* One search across services and agencies, centred like the reference. */}
      <form onSubmit={submitSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', maxWidth: 560, minHeight: 42, padding: '0 16px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--surface-border)', background: 'var(--surface-2)',
        }}>
          <Icon name="search" size={17} color="var(--fg-3)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, agencies"
            aria-label="Search services and agencies"
            style={{
              flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none',
              fontSize: 14, color: 'var(--fg-1)', fontFamily: 'inherit',
            }}
          />
        </label>
      </form>

      {/* Citizen-level controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          className="press focus-ring"
          onClick={onToggleAssistant}
          aria-pressed={assistantOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px',
            borderRadius: 'var(--radius-pill)', border: 'none',
            background: 'var(--hero-navy-gradient)', color: '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name="message-circle" size={16} color="#fff" />
          Ask Gov
        </button>

        <IconButton name="search" label="Search" onClick={() => routerNavigate('/services')} />

        <IconButton
          name={theme === 'dark' ? 'sun' : 'moon'}
          label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={toggleTheme}
        />

        <IconButton
          name="bell"
          label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          onClick={() => openOverlay('notifications')}
          badge={unreadCount}
        />

        <button
          className="press focus-ring"
          onClick={() => openOverlay('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
            padding: '0 12px 0 6px', borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <span aria-hidden="true" style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--hero-navy-gradient)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11.5, fontWeight: 800,
          }}>
            {persona?.initials || 'ME'}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
              {persona?.name || user?.name || 'Citizen'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--fg-4)',
            }}>
              Citizen
            </span>
          </span>
          <Icon name="chevron-down" size={15} color="var(--fg-3)" />
        </button>
      </div>
    </header>
  );
}

function IconButton({ name, label, onClick, badge }) {
  return (
    <button
      className="press focus-ring"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        position: 'relative', width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
        border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <Icon name={name} size={17} color="var(--fg-2)" />
      {badge > 0 && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 5px',
          borderRadius: 999, background: 'var(--status-error)', color: '#fff',
          border: '2px solid var(--surface-1)',
          fontSize: 10, fontWeight: 800, lineHeight: '14px', textAlign: 'center',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
