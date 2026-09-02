// The layout the app is being used in, and the measurements that follow from it.
//
// The app was drawn as a phone screen: a 480px frame, a bottom tab bar, flows
// that cover the whole frame. On a desktop browser that same markup reads as a
// phone stranded in the middle of a monitor. Rather than fork the screens, the
// chrome around them adapts and the screens are handed the measurements they
// need — one gutter, one content width, one sidebar width, all derived here so
// no component invents its own and drifts out of alignment with the rest.
//
// Every screen, flow and handler below this stays exactly as it was.

import { useEffect, useMemo, useState } from 'react';

/**
 * Where the layout changes. Chosen against the window sizes people actually
 * use rather than device names: a half-screen browser on a laptop is ~720, a
 * full-screen one on a 13" is ~1280, and an external monitor is 1600+.
 */
export const BREAKPOINTS = {
  tablet: 768,   // the sidebar appears, collapsed to a rail
  desktop: 1024, // the sidebar opens out, labels and all
  wide: 1440,    // the reading column stops growing; margins take the rest
};

/** The web layout — sidebar and top bar — starts here. */
export const WEB_MIN_WIDTH = BREAKPOINTS.tablet;

/** The docked assistant's width, and the width below which it overlays instead. */
export const DOCK_WIDTH = 400;
export const DOCK_MIN_WIDTH = 1180;

/** The top bar's height. Shared so the docked panel sits exactly under it. */
export const TOPBAR_HEIGHT = 60;

/**
 * The measurements for one window width.
 *
 * `gutter` is the single horizontal inset everything on the page lines up to —
 * the top bar, the content column, and anything that bleeds past it. Give one
 * screen a different number and it sits a few pixels out from everything else,
 * which is exactly the kind of misalignment that reads as unfinished.
 *
 * @param {number} width
 */
export function layoutFor(width) {
  const w = Number(width) || 0;
  const isTablet = w >= BREAKPOINTS.tablet && w < BREAKPOINTS.desktop;
  const isWeb = w >= WEB_MIN_WIDTH;

  // Phone: the original frame, unchanged.
  if (!isWeb) {
    return {
      isPhone: true, isTablet: false, isDesktop: false, isWide: false, isWeb: false,
      gutter: 20,
      frameMaxWidth: 480,
      contentMaxWidth: 480,
      sidebarWidth: 0,
      sidebarCollapsed: false,
      canDock: false,
    };
  }

  // Tablet: the sidebar is there, but as a rail so the content keeps the room.
  if (isTablet) {
    return {
      isPhone: false, isTablet: true, isDesktop: false, isWide: false, isWeb: true,
      gutter: 24,
      frameMaxWidth: null,
      contentMaxWidth: 760,
      sidebarWidth: 76,
      sidebarCollapsed: true,
      canDock: false,
    };
  }

  const isWide = w >= BREAKPOINTS.wide;
  return {
    isPhone: false, isTablet: false, isDesktop: true, isWide, isWeb: true,
    gutter: isWide ? 32 : 28,
    frameMaxWidth: null,
    // Wide enough for a page with a summary rail beside its main column, and
    // no wider — past this the window keeps the rest as margin rather than
    // stretching a paragraph across a monitor.
    contentMaxWidth: isWide ? 1320 : 1160,
    sidebarWidth: 264,
    sidebarCollapsed: false,
    canDock: w >= DOCK_MIN_WIDTH,
  };
}

/**
 * How wide this browser's scrollbars are, measured once.
 *
 * The top bar does not scroll and the page below it does, so the scrollbar
 * takes width from one and not the other. Left alone that puts the title and
 * the profile half a scrollbar out from the content beneath them — small, and
 * exactly the kind of thing that makes a page look untucked. Both reserve this
 * on both edges instead, so they line up whether or not a scrollbar is showing.
 */
export function scrollbarWidth() {
  if (typeof document === 'undefined') return 0;
  if (scrollbarWidth.cached !== undefined) return scrollbarWidth.cached;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
  document.body.appendChild(probe);
  scrollbarWidth.cached = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return scrollbarWidth.cached;
}

/** Track the window width, and keep tracking it — windows get resized. */
export function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let frame = 0;
    const onResize = () => {
      // Coalesce to one measurement per frame: a drag fires this continuously.
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setWidth(window.innerWidth);
      });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return width;
}

/**
 * The layout for the current window.
 * @returns {ReturnType<typeof layoutFor>}
 */
export function useLayout() {
  const width = useWindowWidth();
  return useMemo(() => layoutFor(width), [width]);
}

/** True once there is room for the web layout — sidebar, top bar, dialogs. */
export function useIsDesktop() {
  return useLayout().isWeb;
}

export default useLayout;
