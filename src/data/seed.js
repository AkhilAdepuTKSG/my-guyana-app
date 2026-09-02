// Reference-data seeding.
//
// Migrations create the schema; this fills the reference tables — agencies, the
// service catalogue, fees, approval routing, and the GRO register. It runs on
// every open but writes only when the seed revision has moved, so reopening the
// app is cheap and a citizen's own rows are never touched.
//
// Bump SEED_REVISION whenever any seed file changes; the next open refreshes the
// reference tables in place, leaving applications, requests and Vault documents
// exactly where they were.

import { requestToPromise } from './idb';
import { AGENCY_SEED } from './seed/agencies';
import { CASH_GRANT_SERVICES, CASH_GRANT_FEES, CASH_GRANT_ROUTES } from './seed/servicesCashGrants';
import { SINGLE_WINDOW_SERVICES, SINGLE_WINDOW_FEES, SINGLE_WINDOW_ROUTES } from './seed/servicesSingleWindow';
import { GRO_SERVICES, GRO_FEES, GRO_ROUTES } from './seed/servicesGro';
import { GRA_SERVICES, GRA_FEES, GRA_ROUTES } from './seed/servicesGra';
import { IMMIGRATION_SERVICES, IMMIGRATION_FEES, IMMIGRATION_ROUTES } from './seed/servicesImmigration';
import { MHSSS_SERVICES, MHSSS_FEES, MHSSS_ROUTES, MHSSS_CONFIG } from './seed/servicesMhsss';
import { GRO_REGISTRATION_SEED, normaliseRegNo } from './seed/groRegistry';

/** Raise this when any seed file changes. */
export const SEED_REVISION = 14;

const SEED_META_KEY = 'seedRevision';

/** Every service across every group. */
export const ALL_SERVICES = [
  ...CASH_GRANT_SERVICES,
  ...SINGLE_WINDOW_SERVICES,
  ...GRO_SERVICES,
  ...GRA_SERVICES,
  ...IMMIGRATION_SERVICES,
  ...MHSSS_SERVICES,
];

export const ALL_FEES = [
  ...CASH_GRANT_FEES,
  ...SINGLE_WINDOW_FEES,
  ...GRO_FEES,
  ...GRA_FEES,
  ...IMMIGRATION_FEES,
  ...MHSSS_FEES,
];

export const ALL_ROUTES = [
  ...CASH_GRANT_ROUTES,
  ...SINGLE_WINDOW_ROUTES,
  ...GRO_ROUTES,
  ...GRA_ROUTES,
  ...IMMIGRATION_ROUTES,
  ...MHSSS_ROUTES,
];

/**
 * Per-service configuration — benefit amounts, qualifying age, apply window,
 * residency thresholds. Reference data like everything else here, so a change
 * of rate is a seed bump rather than a code change.
 */
export const ALL_CONFIG = [
  ...MHSSS_CONFIG,
];

/** Register rows carry a normalised lookup key alongside the printed number. */
const GRO_REGISTRATIONS = GRO_REGISTRATION_SEED.map((r) => ({
  ...r,
  regNoKey: normaliseRegNo(r.regNo),
}));

function putAll(store, rows) {
  return Promise.all(rows.map((row) => requestToPromise(store.put(row))));
}

/**
 * Replace a reference table wholesale: clear it, then write the seed. Safe
 * because nothing citizen-owned lives in these tables.
 */
async function replaceTable(tx, name, rows) {
  const store = tx.objectStore(name);
  await requestToPromise(store.clear());
  await putAll(store, rows);
}

/**
 * Merge the GRO register: seeded rows are upserted, but any row already in the
 * store that the seed does not know about is left alone — a registration added
 * by GRO staff after the app shipped must survive a seed refresh.
 */
async function mergeRegister(tx) {
  const store = tx.objectStore('gro_registrations');
  await putAll(store, GRO_REGISTRATIONS);
}

/**
 * Apply the seed if this database has not seen the current revision.
 * @param {IDBDatabase} db
 */
export async function runSeed(db) {
  const applied = await new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get(SEED_META_KEY);
    req.onsuccess = () => resolve(req.result?.value ?? 0);
    req.onerror = () => resolve(0);
  });

  if (applied === SEED_REVISION) return;

  await new Promise((resolve, reject) => {
    const stores = ['agencies', 'services', 'service_fees', 'service_routes', 'service_config', 'gro_registrations', 'meta'];
    const tx = db.transaction(stores, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Seeding failed'));
    tx.onabort = () => reject(tx.error || new Error('Seeding aborted'));

    // The revision marker is written as part of the same batch rather than
    // after it: issuing a request once every other request has settled risks
    // the transaction having auto-committed, and the whole point is that the
    // marker and the data land together or not at all.
    Promise.all([
      requestToPromise(tx.objectStore('meta').put({ key: SEED_META_KEY, value: SEED_REVISION })),
      replaceTable(tx, 'agencies', AGENCY_SEED),
      replaceTable(tx, 'services', ALL_SERVICES),
      replaceTable(tx, 'service_fees', ALL_FEES),
      replaceTable(tx, 'service_routes', ALL_ROUTES),
      replaceTable(tx, 'service_config', ALL_CONFIG),
      mergeRegister(tx),
    ]).catch((err) => {
      reject(err);
      try { tx.abort(); } catch { /* already finished */ }
    });
  });
}
