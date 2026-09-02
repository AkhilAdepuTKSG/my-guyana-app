import Icon from './Icon';
import { useIsDesktop } from '../../hooks/useViewport';

// The "sheet" every short interaction uses (reschedule, filters, add-agency,
// the profile). A bottom sheet on a phone, because that is where a thumb is; a
// centred dialog on a wide screen, because a panel glued to the bottom edge of
// a monitor is nowhere near what the citizen is looking at. Same contents.
export default function Sheet({ open, onClose, title, children, maxHeight = '80%' }) {
  const isDesktop = useIsDesktop();
  if (!open) return null;

  const inner = (
    <>
      {/* The grab handle only means anything on a sheet you can drag up. */}
      {!isDesktop && (
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--surface-4)', margin: '6px auto 14px' }} />
      )}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="ds-h3">{title}</div>
          <button
            className="press focus-ring"
            onClick={onClose}
            aria-label={`Close ${title}`}
            style={{ background: 'var(--surface-4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={16} color="var(--fg-2)" />
          </button>
        </div>
      )}
      {children}
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isDesktop ? 32 : 0,
        background: 'rgba(9,26,43,0.45)',
        animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isDesktop ? 560 : undefined,
          maxHeight: isDesktop ? '100%' : maxHeight,
          overflowY: 'auto',
          background: 'var(--surface-1)',
          borderRadius: isDesktop ? 'var(--radius-xl, 20px)' : '24px 24px 0 0',
          padding: isDesktop ? '20px 24px 24px' : '10px 20px 28px',
          boxShadow: isDesktop ? '0 24px 64px rgba(9,26,43,0.28)' : 'none',
          animation: isDesktop
            ? 'dialogRise var(--dur-slow) var(--ease-emphasis)'
            : 'sheetSlideUp var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        {inner}
      </div>
    </div>
  );
}
