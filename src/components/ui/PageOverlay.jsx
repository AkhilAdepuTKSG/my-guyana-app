import Icon from './Icon';
import { useLayout, DOCK_WIDTH } from '../../hooks/useViewport';
import { useSurfaceMode } from './SurfaceMode';

// The container every multi-step flow is rendered into — reading what a service
// is, applying for it, following it afterwards, and the flows that predate the
// seeded catalogue (e-ID, NIS registration, claims).
//
// Three presentations, one set of props:
//   • page    — rendered from a route. The header is the page's own header and
//               the footer sticks to the bottom of the column. This is what the
//               applying flows use now: a ten-minute form with an address of
//               its own is a page, not a dialog you can lose.
//   • dock    — the assistant, beside the page rather than over it.
//   • overlay — a phone's full-bleed sheet, or a dialog on a wide screen, for
//               the short flows that are still layered.
export default function PageOverlay({
  open, onClose, title, subtitle, zIndex = 100, headerRight, children, agency, footer, noPadding, dock,
}) {
  const layout = useLayout();
  const mode = useSurfaceMode();
  const isDesktop = layout.isWeb;
  if (!open) return null;

  const asPage = mode === 'page';

  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: asPage ? '0 0 14px' : '18px 16px 12px',
      background: asPage ? 'transparent' : 'var(--surface-1)',
      borderBottom: asPage ? 'none' : '1px solid var(--surface-hairline)',
      flexShrink: 0,
    }}>
      <button
        className="press focus-ring"
        onClick={onClose}
        aria-label={asPage ? 'Back' : title ? `Close ${title}` : 'Close'}
        style={{
          background: 'var(--surface-4)', border: 'none', borderRadius: '50%',
          width: 34, height: 34, flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* On a page the control goes back through history, so it reads as a
            back arrow rather than a dismiss. */}
        <Icon name={asPage ? 'arrow-left' : 'x'} size={17} color="var(--fg-2)" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: asPage ? 19 : 'var(--text-base)', fontWeight: 800,
          letterSpacing: asPage ? '-0.02em' : undefined, color: 'var(--fg-1)',
        }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)' }}>{subtitle}</div>}
      </div>
      {headerRight}
    </div>
  );

  const body = (
    <div style={asPage
      ? { display: 'flex', flexDirection: 'column' }
      : { flex: 1, overflowY: 'auto', padding: noPadding ? 0 : '18px 20px 32px', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );

  const foot = footer && (
    <div style={asPage
      // Sticky rather than fixed: it stays with the column as the page scrolls
      // and stops at the bottom of the content, instead of floating over the
      // whole window.
      ? { position: 'sticky', bottom: 0, zIndex: 2, marginTop: 20, background: 'var(--bg-page)' }
      : { flexShrink: 0 }}>
      {footer}
    </div>
  );

  // --- page ---------------------------------------------------------------
  if (asPage) {
    return (
      <div data-agency={agency} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {header}
        {body}
        {foot}
      </div>
    );
  }

  // --- docked -------------------------------------------------------------
  if (isDesktop && dock === 'right' && layout.canDock) {
    return (
      <aside
        data-agency={agency}
        role="complementary"
        aria-label={title}
        style={{
          // A column in the shell's row rather than a panel floating over it,
          // so the page beside it keeps its own full height and simply gets
          // narrower while the assistant is open.
          width: DOCK_WIDTH, flexShrink: 0, height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface-1)',
          borderLeft: '1px solid var(--surface-hairline)',
        }}
      >
        {header}
        {body}
        {foot}
      </aside>
    );
  }

  // --- dialog on a wide screen -------------------------------------------
  if (isDesktop) {
    return (
      <div
        data-agency={agency}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 32, background: 'rgba(9,26,43,0.45)',
          animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 760, maxHeight: '100%',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-page)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(9,26,43,0.28)',
            animation: 'dialogRise var(--dur-slow) var(--ease-emphasis)',
          }}
        >
          {header}
          {body}
          {foot}
        </div>
      </div>
    );
  }

  // --- full-bleed sheet on a phone ---------------------------------------
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
      {header}
      {body}
      {foot}
    </div>
  );
}
