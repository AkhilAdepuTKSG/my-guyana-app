// Small hooks for talking to the endpoints in src/api.
//
// Every screen that reads data goes through `useApi`, so loading, failure and
// refresh behave the same everywhere and no component ends up with its own
// hand-rolled useEffect/setState pair.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { userKey } from '../data/ids';

/**
 * Run an async endpoint call and track its state.
 *
 * @template T
 * @param {() => Promise<T>} loader
 * @param {unknown[]} deps  re-runs when these change
 * @param {{enabled?: boolean, initial?: T}} [opts]
 * @returns {{data: T|null, error: Error|null, loading: boolean, reload: () => void}}
 */
export function useApi(loader, deps, opts = {}) {
  const enabled = opts.enabled !== false;
  const [state, setState] = useState({ data: opts.initial ?? null, error: null, loading: enabled });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setState({ data: opts.initial ?? null, error: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef.current()
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (!cancelled) setState({ data: null, error, loading: false }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/**
 * The stable key every user-scoped row is filed under. Derived from the
 * signed-in citizen's government record, so their Vault and their applications
 * follow them across sign-ins — and nobody else's do.
 * @returns {string|null}
 */
export function useUserId() {
  const { user } = useAppState();
  return useMemo(() => userKey(user), [user]);
}

/**
 * Call an endpoint in response to something the citizen did (submit, collect,
 * attach), tracking whether it is in flight and what went wrong.
 *
 * @template A, R
 * @param {(args: A) => Promise<R>} action
 * @returns {{run: (args: A) => Promise<R|null>, pending: boolean, error: Error|null, clearError: () => void}}
 */
export function useAction(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const actionRef = useRef(action);
  actionRef.current = action;
  // Re-armed on every mount, not just the first: StrictMode mounts, unmounts and
  // remounts in development, and a ref that is only ever set to false on cleanup
  // would stay false — leaving `pending` stuck true and the submit button
  // disabled for the rest of the session.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const run = useCallback(async (args) => {
    setPending(true);
    setError(null);
    try {
      const result = await actionRef.current(args);
      return result;
    } catch (err) {
      if (alive.current) setError(err);
      return null;
    } finally {
      if (alive.current) setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return { run, pending, error, clearError };
}
