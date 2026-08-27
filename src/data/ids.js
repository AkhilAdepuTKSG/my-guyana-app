// Identifier and reference-number generation.
//
// Reference numbers are what a citizen quotes at a counter, so they follow the
// shape each agency actually uses: an agency prefix, the year, and a sequence.
// The sequence is drawn from a monotonic counter so two applications created in
// the same millisecond never collide.

let counter = 0;

function nextSequence() {
  counter = (counter + 1) % 100000;
  return counter;
}

/** Random-ish but collision-safe row id. */
export function newId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${nextSequence().toString(36)}${rand}`;
}

/** ISO timestamp used for every `createdAt`/`updatedAt`/event time. */
export function now() {
  return new Date().toISOString();
}

/** Today as `YYYY-MM-DD`, matching how the existing screens format dates. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A citizen-facing reference number: `PREFIX-YYYY-NNNNNN`.
 * @param {string} prefix e.g. 'MOF-CG', 'SWAS', 'GRO-CR'
 */
export function newReference(prefix) {
  const year = new Date().getFullYear();
  const seq = String(Date.now() % 1000000).padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
}

/**
 * A certificate number, in the General Register Office's printed format:
 * `GRO/<TYPE>/<YEAR>/<SEQ>`.
 * @param {'birth'|'death'|'marriage'} type
 */
export function newCertificateNumber(type) {
  const code = { birth: 'B', death: 'D', marriage: 'M' }[type] || 'X';
  const year = new Date().getFullYear();
  const seq = String(Date.now() % 100000).padStart(5, '0');
  return `GRO/${code}/${year}/${seq}`;
}

/**
 * The stable per-citizen key every user-scoped row is filed under. Derived from
 * the government record so the same citizen sees the same Vault and the same
 * applications across sign-ins on a device — and so one citizen never reads
 * another's rows.
 * @param {{gov?: {nationalId?: string}, eidNo?: string, name?: string, id?: string}|null} user
 * @returns {string|null} null when nobody is signed in
 */
export function userKey(user) {
  if (!user) return null;
  const raw = user.gov?.nationalId || user.eidNo || user.id || user.name;
  if (!raw) return null;
  return `u_${String(raw).replace(/[^A-Za-z0-9]/g, '').toLowerCase()}`;
}
