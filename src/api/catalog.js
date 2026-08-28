// Catalogue endpoints — agencies, services, fees and approval routing.
//
// Everything the View screens and the apply engine render comes from here.
// These are pure reads against the seeded reference tables.

import { getAll, getAllBy, get, getOneBy } from '../data/db';
import { ApiError } from './validate';

/** Human labels for each service group. */
export const SERVICE_GROUPS = {
  cashGrants: {
    id: 'cashGrants',
    name: 'Cash Grants',
    tagline: 'Government grants paid straight to your bank account.',
    icon: 'banknote',
    accent: '#0f7b6c',
  },
  singleWindow: {
    id: 'singleWindow',
    name: 'Single Window',
    tagline: 'One window for every land-development approval — CH&PA, GWI, GPL and the agencies that review with them.',
    icon: 'building-2',
    accent: '#b45f16',
  },
  gro: {
    id: 'gro',
    name: 'Certificates (GRO)',
    tagline: 'Birth, death and marriage certificates from the General Register Office.',
    icon: 'book-open',
    accent: '#7d3550',
  },
  gra: {
    id: 'gra',
    name: 'Revenue & Tax (GRA)',
    tagline: "TIN, driver's licence, business tax and property tax — the Guyana Revenue Authority online.",
    icon: 'receipt',
    accent: '#2563c9',
  },
  mhsss: {
    id: 'mhsss',
    name: 'Pensions & Public Assistance',
    tagline: 'The old age pension and the support the Ministry of Human Services & Social Security pays.',
    icon: 'hand-heart',
    accent: '#c2365f',
  },
};

/**
 * Every configured value for one service, keyed by its `key`.
 *
 * A service's thresholds and amounts are rows, not constants — see
 * src/data/seed/servicesMhsss.js. Both the screens and the endpoints read them
 * from here, so the number a citizen is shown and the number they are tested
 * against are the same number.
 * @param {string} serviceId
 * @returns {Promise<import('../data/types').ServiceConfig[]>}
 */
export async function listConfig(serviceId) {
  const rows = await getAllBy('service_config', 'byService', serviceId);
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

/** The config rows flattened to `{key: value}` — what an endpoint reads. */
export function configValues(rows) {
  return Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
}

/**
 * Attach a service's configuration to the record itself.
 *
 * Doing it on read is what keeps `requiredDocumentsFor(service, fields)` and
 * every screen working off one object: a threshold is always available wherever
 * the service is, and nothing has to remember to fetch it separately.
 * @param {import('../data/types').Service|null} service
 */
async function withConfig(service) {
  if (!service) return service;
  const rows = await listConfig(service.id);
  if (!rows.length) return service;
  return { ...service, config: configValues(rows), configRows: rows };
}

/**
 * Every agency in the catalogue, as a lookup keyed by id.
 * @returns {Promise<Record<string, import('../data/types').Agency>>}
 */
export async function getAgencyMap() {
  const rows = await getAll('agencies');
  return Object.fromEntries(rows.map((a) => [a.id, a]));
}

/**
 * @returns {Promise<import('../data/types').Agency[]>}
 */
export function listAgencies() {
  return getAll('agencies');
}

/**
 * @param {string} agencyId
 * @returns {Promise<import('../data/types').Agency|null>}
 */
export function getAgency(agencyId) {
  return get('agencies', agencyId);
}

/**
 * Active services, optionally narrowed to one group, in display order.
 * @param {{group?: import('../data/types').ServiceGroup}} [opts]
 * @returns {Promise<import('../data/types').Service[]>}
 */
export async function listServices(opts = {}) {
  const rows = opts.group ? await getAllBy('services', 'byGroup', opts.group) : await getAll('services');
  const active = rows
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  // One read of the config table for the whole list rather than one per service.
  const config = await getAll('service_config');
  if (!config.length) return active;
  return active.map((service) => {
    const own = config.filter((c) => c.serviceId === service.id);
    return own.length ? { ...service, config: configValues(own), configRows: own } : service;
  });
}

/**
 * @param {string} serviceId
 * @returns {Promise<import('../data/types').Service|null>}
 */
export async function getService(serviceId) {
  return withConfig(await get('services', serviceId));
}

/**
 * @param {string} slug
 * @returns {Promise<import('../data/types').Service|null>}
 */
export async function getServiceBySlug(slug) {
  return withConfig(await getOneBy('services', 'bySlug', slug));
}

/**
 * @param {string} serviceId
 * @returns {Promise<import('../data/types').ServiceFee[]>}
 */
export async function listFees(serviceId) {
  const rows = await getAllBy('service_fees', 'byService', serviceId);
  return rows.sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || a.amountGyd - b.amountGyd);
}

/**
 * The approval routing for a service, in sequence order.
 * @param {string} serviceId
 * @returns {Promise<import('../data/types').ServiceRoute[]>}
 */
export async function listRoutes(serviceId) {
  const rows = await getAllBy('service_routes', 'byService', serviceId);
  return rows.sort((a, b) => a.sequence - b.sequence);
}

/**
 * Everything one View screen needs, in a single call: the service, its owning
 * agency, its fees, and the agencies that will review it.
 * @param {string} serviceId
 * @returns {Promise<{
 *   service: import('../data/types').Service,
 *   agency: import('../data/types').Agency|null,
 *   fees: import('../data/types').ServiceFee[],
 *   routes: (import('../data/types').ServiceRoute & {agency: import('../data/types').Agency|null})[],
 *   feesPayableNow: number,
 *   feesPayableOnApproval: number
 * }>}
 */
export async function getServiceDetail(serviceId) {
  const service = await getService(serviceId);
  if (!service) throw new ApiError('That service is not in the catalogue.', 'notFound', { serviceId });

  const [agencies, fees, routes] = await Promise.all([
    getAgencyMap(),
    listFees(serviceId),
    listRoutes(serviceId),
  ]);

  return {
    service,
    agency: agencies[service.agencyId] || null,
    fees,
    routes: routes.map((r) => ({ ...r, agency: agencies[r.agencyId] || null })),
    feesPayableNow: fees.filter((f) => f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0),
    feesPayableOnApproval: fees.filter((f) => !f.mandatory).reduce((sum, f) => sum + f.amountGyd, 0),
  };
}

/**
 * The Single Window landing data: the group, and every service inside it with
 * the agencies that review it. Powers the grouped Single Window section.
 * @returns {Promise<{
 *   group: typeof SERVICE_GROUPS.singleWindow,
 *   services: (import('../data/types').Service & {
 *     agency: import('../data/types').Agency|null,
 *     reviewers: import('../data/types').Agency[],
 *     feeFromGyd: number
 *   })[],
 *   agencies: import('../data/types').Agency[]
 * }>}
 */
export async function getSingleWindowOverview() {
  const [services, agencyMap, allRoutes, allFees] = await Promise.all([
    listServices({ group: 'singleWindow' }),
    getAgencyMap(),
    getAll('service_routes'),
    getAll('service_fees'),
  ]);

  const enriched = services.map((service) => {
    const routes = allRoutes
      .filter((r) => r.serviceId === service.id)
      .sort((a, b) => a.sequence - b.sequence);
    // One agency can appear twice on a route (GWI reviews, then inspects);
    // the citizen-facing list shows each agency once.
    const seen = new Set();
    const reviewers = routes
      .map((r) => agencyMap[r.agencyId])
      .filter((a) => {
        if (!a || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    const fees = allFees.filter((f) => f.serviceId === service.id && f.mandatory);
    return {
      ...service,
      agency: agencyMap[service.agencyId] || null,
      reviewers,
      feeFromGyd: fees.reduce((sum, f) => sum + f.amountGyd, 0),
    };
  });

  // Every agency taking part anywhere in the Single Window, for the header.
  const participating = new Map();
  enriched.forEach((s) => s.reviewers.forEach((a) => participating.set(a.id, a)));

  return {
    group: SERVICE_GROUPS.singleWindow,
    services: enriched,
    agencies: [...participating.values()],
  };
}
