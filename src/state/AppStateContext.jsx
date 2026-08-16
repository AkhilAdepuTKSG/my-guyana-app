import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PERSONAS } from './mockData';

const AppStateContext = createContext(null);

// Primary tab-reachable destinations. Everything else is an "overlay" —
// a full-screen flow or bottom sheet layered on top, keyed by a free-form
// string so individual flows never need to touch this shared file.
export const SCREENS = ['home', 'nis', 'mops', 'gpl', 'vault', 'wallet', 'services', 'calendar', 'applications'];

// Persistent session — the app boots to the auth gate until this says otherwise,
// and a signed-in citizen stays signed in across reloads. Bump the version suffix
// if the stored shape changes incompatibly.
const SESSION_KEY = 'myguyana.session.v1';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.status === 'authenticated' ? parsed : null;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }) {
  const [screen, setScreenState] = useState('home');
  const [viewAsId, setViewAsId] = useState('devindra');
  const [overlays, setOverlays] = useState(new Map()); // key -> payload
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // { status: 'authenticated', user: {...}, at } | null. Lazy-initialised from
  // localStorage so a returning citizen skips the gate.
  const [session, setSession] = useState(loadSession);
  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch { /* storage unavailable (private mode / quota) — run in-memory */ }
  }, [session]);

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

  // --- session actions ---
  const signIn = useCallback((user) => {
    setSession({ status: 'authenticated', user: user || {}, at: Date.now() });
  }, []);
  const signOut = useCallback(() => setSession(null), []);
  const updateUser = useCallback((patch) => {
    setSession((s) => (s ? { ...s, user: { ...s.user, ...patch } } : s));
  }, []);
  const isAuthenticated = !!session && session.status === 'authenticated';
  const user = session?.user ?? null;

  const value = useMemo(() => ({
    screen, navigate,
    viewAsId, setViewAsId, persona,
    overlays, openOverlay, closeOverlay, isOpen, getPayload,
    toast, showToast,
    session, user, isAuthenticated, signIn, signOut, updateUser,
  }), [screen, navigate, viewAsId, persona, overlays, openOverlay, closeOverlay, isOpen, getPayload, toast, showToast, session, user, isAuthenticated, signIn, signOut, updateUser]);

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
