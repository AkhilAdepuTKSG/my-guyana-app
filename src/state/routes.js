// The URL map.
//
// Every destination a citizen can be at has an address. Two consequences that
// matter: the browser's back button works, and a half-finished application can
// be linked to, bookmarked and reopened tomorrow.
//
// The app was written before it had routes — screens were a `screen` string and
// flows were overlays keyed by name. Rather than rewrite ~40 call sites, this
// module maps both onto paths, and AppStateContext translates:
//
//   navigate('vault')                        -> /vault
//   openOverlay('serviceApply', {serviceId}) -> /services/<id>/apply
//
// so `navigate` and `openOverlay` keep their signatures and every existing
// caller keeps working, while the address bar tells the truth.

/** Primary destinations — the sidebar, and the phone's tab bar. */
export const SCREEN_PATHS = {
  home: '/',
  services: '/services',
  applications: '/applications',
  calendar: '/schedule',
  vault: '/vault',
  wallet: '/wallet',
  // Agency hubs sit under the agency they belong to.
  nis: '/agencies/nis',
  gpl: '/agencies/gpl',
  mops: '/agencies/mops',
};

/** `/vault` -> 'vault'. */
export function screenForPath(pathname) {
  const path = normalise(pathname);
  const hit = Object.entries(SCREEN_PATHS).find(([, p]) => p === path);
  if (hit) return hit[0];
  // A service or an application is reached from Services and My applications
  // respectively; the sidebar keeps that section marked while you are in one.
  if (path.startsWith('/services')) return 'services';
  if (path.startsWith('/applications') || path.startsWith('/certificates')) return 'applications';
  if (path.startsWith('/agencies/nis')) return 'nis';
  if (path.startsWith('/agencies/gpl')) return 'gpl';
  if (path.startsWith('/agencies/mops')) return 'mops';
  return 'home';
}

/** 'vault' -> `/vault`. Unknown screens fall back to Home rather than 404. */
export function pathForScreen(screen) {
  return SCREEN_PATHS[screen] || SCREEN_PATHS.home;
}

/**
 * The flows that are pages rather than overlays.
 *
 * These are the ones a citizen spends real time in — reading what a service is,
 * filling it in, following it afterwards. A dialog is the wrong container for
 * work that takes ten minutes and needs to be come back to, so each one has an
 * address of its own.
 *
 * `toPath` builds the URL from whatever the old `openOverlay` payload was;
 * `match` recovers that payload from the URL, so the screens themselves still
 * read their arguments exactly as they did when they were overlays.
 */
export const ROUTED_FLOWS = {
  serviceView: {
    pattern: '/services/:serviceId',
    toPath: (p) => (p?.serviceId ? `/services/${encodeURIComponent(p.serviceId)}` : null),
    match: (path) => {
      const m = /^\/services\/([^/]+)$/.exec(path);
      return m && m[1] !== 'category' ? { serviceId: decodeURIComponent(m[1]) } : null;
    },
  },
  serviceApply: {
    pattern: '/services/:serviceId/apply',
    toPath: (p) => (p?.serviceId
      ? `/services/${encodeURIComponent(p.serviceId)}/apply${p.applicationId ? `?application=${encodeURIComponent(p.applicationId)}` : ''}`
      : null),
    match: (path, search) => {
      const m = /^\/services\/([^/]+)\/apply$/.exec(path);
      if (!m) return null;
      const applicationId = new URLSearchParams(search || '').get('application');
      return { serviceId: decodeURIComponent(m[1]), applicationId: applicationId || null };
    },
  },
  groLookup: {
    pattern: '/services/:serviceId/lookup',
    toPath: (p) => (p?.serviceId ? `/services/${encodeURIComponent(p.serviceId)}/lookup` : null),
    match: (path) => {
      const m = /^\/services\/([^/]+)\/lookup$/.exec(path);
      return m ? { serviceId: decodeURIComponent(m[1]) } : null;
    },
  },
  serviceTrack: {
    pattern: '/applications/:group/:id',
    toPath: (p) => (p?.group && p?.id
      ? `/applications/${encodeURIComponent(p.group)}/${encodeURIComponent(p.id)}`
      : null),
    match: (path) => {
      const m = /^\/applications\/([^/]+)\/([^/]+)$/.exec(path);
      return m ? { group: decodeURIComponent(m[1]), id: decodeURIComponent(m[2]) } : null;
    },
  },
  groCertificate: {
    pattern: '/certificates/:requestId',
    toPath: (p) => (p?.requestId ? `/certificates/${encodeURIComponent(p.requestId)}` : null),
    match: (path) => {
      const m = /^\/certificates\/([^/]+)$/.exec(path);
      return m ? { requestId: decodeURIComponent(m[1]) } : null;
    },
  },
  category: {
    pattern: '/services/category/:id',
    toPath: (p) => (p?.id ? `/services/category/${encodeURIComponent(p.id)}` : null),
    match: (path) => {
      const m = /^\/services\/category\/([^/]+)$/.exec(path);
      return m ? { id: decodeURIComponent(m[1]) } : null;
    },
  },
};

export const ROUTED_FLOW_KEYS = Object.keys(ROUTED_FLOWS);

/** Is this overlay key a page now? */
export function isRoutedFlow(key) {
  return Object.prototype.hasOwnProperty.call(ROUTED_FLOWS, key);
}

/**
 * The URL for one of the routed flows, or null when the payload does not carry
 * enough to build one — in which case the caller leaves it as an overlay rather
 * than navigating somewhere broken.
 */
export function pathForFlow(key, payload) {
  const flow = ROUTED_FLOWS[key];
  if (!flow) return null;
  return flow.toPath(payload && typeof payload === 'object' ? payload : {});
}

/**
 * Which routed flow the current URL is, and the payload it implies.
 * @param {string} pathname
 * @param {string} [search]
 * @returns {{key: string, payload: Record<string, unknown>}|null}
 */
export function flowForLocation(pathname, search) {
  const path = normalise(pathname);
  for (const key of ROUTED_FLOW_KEYS) {
    const payload = ROUTED_FLOWS[key].match(path, search);
    if (payload) return { key, payload };
  }
  return null;
}

/**
 * Where closing a routed flow should land.
 *
 * Going back through history is right when there is history to go back to —
 * the citizen came from somewhere and that is where "close" means. This is the
 * fallback for a page opened cold from a link or a bookmark.
 */
export function parentPathForFlow(key, payload) {
  switch (key) {
    case 'serviceApply':
    case 'groLookup':
      return payload?.serviceId ? `/services/${encodeURIComponent(payload.serviceId)}` : SCREEN_PATHS.services;
    case 'serviceView':
    case 'category':
      return SCREEN_PATHS.services;
    case 'serviceTrack':
    case 'groCertificate':
      return SCREEN_PATHS.applications;
    default:
      return SCREEN_PATHS.home;
  }
}

/** Trailing slashes and empty strings normalised away. */
function normalise(pathname) {
  const p = String(pathname || '/');
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p || '/';
}
