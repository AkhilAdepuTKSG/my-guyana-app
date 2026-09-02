import { createContext, useContext } from 'react';

// How the flow inside should present itself.
//
// The same components serve two containers now. Rendered from a route they are
// the page — no scrim, no floating card, the header sits at the top of the
// content column and the footer sticks to the bottom of it. Rendered as an
// overlay they are a dialog over whatever the citizen was looking at.
//
// A context rather than a prop because the components in between (ServiceApply
// and friends) should not have to thread it through; they pass the same props
// they always did and PageOverlay reads which container it is in.

/** @type {import('react').Context<'page'|'overlay'>} */
const SurfaceModeContext = createContext('overlay');

export function SurfaceMode({ mode, children }) {
  return <SurfaceModeContext.Provider value={mode}>{children}</SurfaceModeContext.Provider>;
}

/** 'page' when this subtree is a routed page, 'overlay' when it is layered. */
export function useSurfaceMode() {
  return useContext(SurfaceModeContext);
}

export default useSurfaceMode;
