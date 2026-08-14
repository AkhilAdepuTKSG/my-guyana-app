import Icon from './Icon';

// Full-screen "page" overlay: slides in from the right, used for every
// multi-step wizard/flow (e-ID application, NIS registration, claims, etc).
export default function PageOverlay({ open, onClose, title, subtitle, zIndex = 100, headerRight, children, agency, footer, noPadding }) {
  if (!open) return null;
  return (
    <div
      data-agency={agency}
      style={{
        position: 'absolute', inset: 0, zIndex,
        background: 'var(--bg-page)',
        display: 'flex', flexDirection: 'column',
        animation: 'pageSlideIn var(--dur-slow) var(--ease-emphasis)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 12px',
        background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)', flexShrink: 0,
      }}>
        <button className="press focus-ring" onClick={onClose} style={{ background: 'var(--surface-4)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={17} color="var(--fg-2)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--fg-1)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)' }}>{subtitle}</div>}
        </div>
        {headerRight}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: noPadding ? 0 : '18px 20px 32px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {footer && (
        <div style={{ flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </div>
  );
}
