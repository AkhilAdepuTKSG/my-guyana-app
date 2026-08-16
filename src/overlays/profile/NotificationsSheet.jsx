import { useEffect, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, NOTIFICATIONS } from '../../state/mockData';

export default function NotificationsSheet() {
  const { isOpen, closeOverlay, notifications, dismissNotification, markNotificationsRead } = useAppState();
  const open = isOpen('notifications');
  // Only the pre-seeded demo notifications need a local dismissed list; the
  // citizen's own (persisted) notifications are dismissed through the store.
  const [dismissedSeed, setDismissedSeed] = useState([]);

  // Opening the sheet resets the demo items and clears the unread badge.
  useEffect(() => {
    if (open) { setDismissedSeed([]); markNotificationsRead(); }
  }, [open, markNotificationsRead]);

  const ownIds = new Set(notifications.map((n) => n.id));
  const items = [
    ...notifications,
    ...NOTIFICATIONS.filter((n) => !dismissedSeed.includes(n.id)),
  ];
  const hasItems = items.length > 0;

  const dismiss = (id) => {
    if (ownIds.has(id)) dismissNotification(id);
    else setDismissedSeed((prev) => [...prev, id]);
  };
  const clearAll = () => {
    notifications.forEach((n) => dismissNotification(n.id));
    setDismissedSeed(NOTIFICATIONS.map((n) => n.id));
  };

  return (
    <Sheet open={open} onClose={() => closeOverlay('notifications')} maxHeight="75%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 className="ds-h1" style={{ fontSize: 21, margin: 0, letterSpacing: '-0.02em', flex: 1, minWidth: 0 }}>Notifications</h2>
          {hasItems && (
            <button className="press focus-ring" onClick={clearAll} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              Clear all
            </button>
          )}
          <button
            className="press focus-ring"
            onClick={() => closeOverlay('notifications')}
            aria-label="Close"
            style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {hasItems ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((n) => {
              const color = AGENCIES[n.agency]?.mark || 'var(--fg-3)';
              return (
                <div
                  key={n.id}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 11,
                    padding: '13px 40px 13px 14px', borderRadius: 16,
                    background: `color-mix(in oklch, ${color} 10%, transparent)`,
                    border: `1px solid color-mix(in oklch, ${color} 34%, transparent)`,
                  }}
                >
                  <Icon name={n.icon} size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--fg-1)' }}>{n.title}</span>
                    <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'var(--fg-2)' }}>{n.body}</span>
                    <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--fg-4)' }}>{n.time}</span>
                  </span>
                  <button
                    className="press focus-ring"
                    onClick={() => dismiss(n.id)}
                    aria-label="Dismiss"
                    style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name="x" size={14} color="var(--fg-2)" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 12px', textAlign: 'center' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell-off" size={20} color="var(--fg-3)" />
            </span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>You're all caught up</p>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Nothing needs your attention right now.</p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
