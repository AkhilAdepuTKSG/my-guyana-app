import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { PERSONAS } from './mockData';

const AppStateContext = createContext(null);

// Primary tab-reachable destinations. Everything else is an "overlay" —
// a full-screen flow or bottom sheet layered on top, keyed by a free-form
// string so individual flows never need to touch this shared file.
export const SCREENS = ['home', 'nis', 'mops', 'gpl', 'vault', 'wallet', 'services', 'calendar', 'applications'];

export function AppStateProvider({ children }) {
  const [screen, setScreenState] = useState('home');
  const [viewAsId, setViewAsId] = useState('devindra');
  const [overlays, setOverlays] = useState(new Map()); // key -> payload
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const navigate = useCallback((next) => {
    setScreenState(next);
    window.scrollTo?.(0, 0);
  }, []);

  const openOverlay = useCallback((key, payload = true) => {
    setOverlays((prev) => {
      const next = new Map(prev);
      next.set(key, payload);
      return next;
    });
  }, []);

  const closeOverlay = useCallback((key) => {
    setOverlays((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const isOpen = useCallback((key) => overlays.has(key), [overlays]);
  const getPayload = useCallback((key) => overlays.get(key), [overlays]);

  const showToast = useCallback((message, opts = {}) => {
    setToast({ message, ...opts });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), opts.duration ?? 2600);
  }, []);

  const persona = PERSONAS[viewAsId] ?? PERSONAS.devindra;

  const value = useMemo(() => ({
    screen, navigate,
    viewAsId, setViewAsId, persona,
    overlays, openOverlay, closeOverlay, isOpen, getPayload,
    toast, showToast,
  }), [screen, navigate, viewAsId, persona, overlays, openOverlay, closeOverlay, isOpen, getPayload, toast, showToast]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
