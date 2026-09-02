import { useIsDesktop } from '../../hooks/useViewport';

// The wrapper for the few flows that build their own chrome instead of using
// PageOverlay or Sheet (the personal-information page, the employer
// registration flow, the one-time-code gate).
//
// It gives them the same treatment those two get: a full-bleed page on a phone,
// a centred dialog over a scrim on a wide screen. Children are untouched —
// this only decides the box they sit in.

/**
 * @param {{
 *   zIndex?: number,
 *   maxWidth?: number,
 *   background?: string,
 *   agency?: string,
 *   onScrimClick?: () => void,
 *   children: import('react').ReactNode
 * }} props
 */
export default function DialogSurface({
  zIndex = 100, maxWidth = 760, background = 'var(--bg-page)', agency, onScrimClick, children,
}) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div
        data-agency={agency}
        style={{
          position: 'absolute', inset: 0, zIndex, background,
          display: 'flex', flexDirection: 'column',
          animation: 'pageSlideIn var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-agency={agency}
      onClick={onScrimClick}
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
          width: '100%', maxWidth, maxHeight: '100%',
          display: 'flex', flexDirection: 'column',
          background, borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(9,26,43,0.28)',
          animation: 'dialogRise var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
