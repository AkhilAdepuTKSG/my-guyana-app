import { useEffect } from 'react';
import Icon from '../ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';

// Push-style notification card at the top of the screen. The newest
// notification flagged `push` slides in (the design's pushBannerIn motion) and
// disappears when tapped, or on its own after a few seconds. The notification
// itself stays in the bell, where the full action lives.
const AUTO_HIDE_MS = 8000;

export default function PushBanner() {
  const { notifications, markPushSeen, isAuthenticated } = useAppState();
  const n = isAuthenticated ? notifications.find((x) => x.push) : null;
  const id = n?.id;

  useEffect(() => {
    if (!id) return undefined;
    const t = setTimeout(() => markPushSeen(id), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [id, markPushSeen]);

  if (!n) return null;
  const agency = AGENCIES[n.agency];
  const mark = agency?.mark || 'var(--brand-600)';

  return (
    <div style={{ position: 'absolute', top: 10, left: 12, right: 12, zIndex: 1300, pointerEvents: 'none' }}>
      <button
        key={n.id}
        className="press focus-ring"
        onClick={() => markPushSeen(n.id)}
        aria-label={`${n.title}. Tap to dismiss`}
        style={{
          pointerEvents: 'auto', width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
          border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)',
          boxShadow: 'var(--shadow-xl)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          animation: 'pushBannerIn var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        <span aria-hidden="true" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: `color-mix(in oklch, ${mark} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={n.icon || agency?.icon || 'bell'} size={18} color={mark} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: mark }}>
            {agency?.shortName || 'My Guyana'} · just now
          </span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 14, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.3 }}>{n.title}</span>
          {n.body && <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>{n.body}</span>}
        </span>
        <Icon name="x" size={16} color="var(--fg-4)" style={{ flexShrink: 0, marginTop: 2 }} />
      </button>
    </div>
  );
}
