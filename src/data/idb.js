// The one IndexedDB primitive everything else is built from. It lives in its
// own module so the database handle (db.js) and the seeder (seed.js) can each
// import it without importing one another.

/**
 * Turn an IDBRequest into a promise.
 * @template T
 * @param {IDBRequest<T>} req
 * @returns {Promise<T>}
 */
export function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}
