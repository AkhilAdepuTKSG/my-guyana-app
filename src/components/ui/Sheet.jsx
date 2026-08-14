import Icon from './Icon';

// Bottom sheet: scrim + slide-up panel, used for every "sheet" flow
// (reschedule, filters, add-agency, etc).
export default function Sheet({ open, onClose, title, children, maxHeight = '80%' }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(9,26,43,0.45)',
        animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxHeight, overflowY: 'auto',
          background: 'var(--surface-1)',
          borderRadius: '24px 24px 0 0',
          padding: '10px 20px 28px',
          animation: 'sheetSlideUp var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--surface-4)', margin: '6px auto 14px' }} />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="ds-h3">{title}</div>
            <button className="press focus-ring" onClick={onClose} style={{ background: 'var(--surface-4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} color="var(--fg-2)" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
