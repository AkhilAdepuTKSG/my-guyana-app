// The database handle: opens IndexedDB, runs the migrations in order, and
// exposes small promise-based primitives (get / getAll / put / del / query)
// that the endpoint modules in src/api build on.
//
// Nothing outside src/data and src/api should import this — screens talk to
// the endpoints, never to a store directly.

import { DB_NAME, DB_VERSION, MIGRATIONS, STORE_NAMES } from './migrations';
import { requestToPromise } from './idb';
import { runSeed } from './seed';

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/**
 * Open the database, applying every migration whose version is above the one
 * currently stored. `oldVersion` is 0 on a fresh install, so a new device runs
 * the whole ordered list.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser has no IndexedDB, so My Guyana cannot store your data.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;
      const from = event.oldVersion || 0;
      MIGRATIONS
        .filter((m) => m.version > from)
        .sort((a, b) => a.version - b.version)
        .forEach((m) => m.up(db, tx));
    };

    req.onblocked = () => {
      reject(new Error('Another tab is holding an older version of My Guyana open. Close it and reload.'));
    };
    req.onsuccess = () => {
      const db = req.result;
      // A version change from another tab invalidates this handle.
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error || new Error('Could not open the My Guyana database'));
  });
}

/**
 * The shared handle. First call opens the database, runs migrations and seeds
 * reference data; every later call reuses the same promise.
 * @returns {Promise<IDBDatabase>}
 */
export function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabase()
      .then(async (db) => {
        await runSeed(db);
        return db;
      })
      .catch((err) => {
        dbPromise = null; // let a later call retry rather than caching the failure
        throw err;
      });
  }
  return dbPromise;
}

/**
 * Run `fn` inside one transaction over `stores`. The returned promise settles
 * when the transaction completes, so callers never see a half-applied write.
 * @template T
 * @param {string|string[]} stores
 * @param {IDBTransactionMode} mode
 * @param {(tx: IDBTransaction) => T|Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTx(stores, mode, fn) {
  const db = await getDb();
  const names = Array.isArray(stores) ? stores : [stores];
  return new Promise((resolve, reject) => {
    let result;
    let settled = false;
    const tx = db.transaction(names, mode);
    tx.oncomplete = () => { if (!settled) { settled = true; resolve(result); } };
    tx.onerror = () => { if (!settled) { settled = true; reject(tx.error || new Error('Transaction failed')); } };
    tx.onabort = () => { if (!settled) { settled = true; reject(tx.error || new Error('Transaction aborted')); } };
    Promise.resolve(fn(tx))
      .then((value) => { result = value; })
      .catch((err) => {
        if (!settled) { settled = true; reject(err); }
        try { tx.abort(); } catch { /* already finished */ }
      });
  });
}

/**
 * Read one record by primary key.
 * @template T
 * @param {string} storeName
 * @param {IDBValidKey} key
 * @returns {Promise<T|null>}
 */
export async function get(storeName, key) {
  return withTx(storeName, 'readonly', async (tx) => {
    const row = await requestToPromise(tx.objectStore(storeName).get(key));
    return row ?? null;
  });
}

/**
 * Read every record in a store.
 * @template T
 * @param {string} storeName
 * @returns {Promise<T[]>}
 */
export async function getAll(storeName) {
  return withTx(storeName, 'readonly', (tx) => requestToPromise(tx.objectStore(storeName).getAll()));
}

/**
 * Read every record matching an index value — the equivalent of a
 * `WHERE <indexed column> = ?` lookup.
 * @template T
 * @param {string} storeName
 * @param {string} indexName
 * @param {IDBValidKey|IDBKeyRange} value
 * @returns {Promise<T[]>}
 */
export async function getAllBy(storeName, indexName, value) {
  return withTx(storeName, 'readonly', (tx) =>
    requestToPromise(tx.objectStore(storeName).index(indexName).getAll(value)));
}

/**
 * Read the single record matching a unique index, or null.
 * @template T
 * @param {string} storeName
 * @param {string} indexName
 * @param {IDBValidKey} value
 * @returns {Promise<T|null>}
 */
export async function getOneBy(storeName, indexName, value) {
  return withTx(storeName, 'readonly', async (tx) => {
    const row = await requestToPromise(tx.objectStore(storeName).index(indexName).get(value));
    return row ?? null;
  });
}

/**
 * Insert or replace one record.
 * @template T
 * @param {string} storeName
 * @param {T} record
 * @returns {Promise<T>}
 */
export async function put(storeName, record) {
  return withTx(storeName, 'readwrite', async (tx) => {
    await requestToPromise(tx.objectStore(storeName).put(record));
    return record;
  });
}

/**
 * Insert or replace many records in one transaction.
 * @template T
 * @param {string} storeName
 * @param {T[]} records
 * @returns {Promise<number>} how many were written
 */
export async function putMany(storeName, records) {
  if (!records.length) return 0;
  return withTx(storeName, 'readwrite', async (tx) => {
    const os = tx.objectStore(storeName);
    await Promise.all(records.map((r) => requestToPromise(os.put(r))));
    return records.length;
  });
}

/**
 * Delete one record by primary key.
 * @param {string} storeName
 * @param {IDBValidKey} key
 */
export async function del(storeName, key) {
  return withTx(storeName, 'readwrite', (tx) => requestToPromise(tx.objectStore(storeName).delete(key)));
}

/**
 * Drop the whole database. Only used by diagnostics and by the dev reset — a
 * citizen's data is never wiped by normal use.
 * @returns {Promise<void>}
 */
export function deleteDatabase() {
  dbPromise = null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // closes once the other handles release
  });
}

export { STORE_NAMES, requestToPromise };
