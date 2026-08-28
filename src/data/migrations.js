// Schema migrations for the My Guyana store.
//
// Each entry is one numbered migration that runs exactly once, in order, when
// the database version is raised — the same discipline a SQL migration folder
// gives you. Never edit a migration that has shipped; add the next number.
//
// `DB_VERSION` must always equal the highest `version` below.

export const DB_NAME = 'myguyana';

/**
 * @typedef {Object} Migration
 * @property {number} version
 * @property {string} name
 * @property {(db: IDBDatabase, tx: IDBTransaction) => void} up
 */

/** Create a store only if it is missing, so re-running is safe. */
function store(db, name, keyPath, indexes = []) {
  const os = db.objectStoreNames.contains(name)
    ? null
    : db.createObjectStore(name, { keyPath });
  if (!os) return;
  indexes.forEach(([indexName, path, options]) => {
    os.createIndex(indexName, path, options || {});
  });
}

/** @type {Migration[]} */
export const MIGRATIONS = [
  {
    version: 1,
    name: '0001_reference_catalogue',
    up(db) {
      // --- Reference data: agencies, the service catalogue, fees, routing ---
      store(db, 'agencies', 'id', [['byShortName', 'shortName', { unique: false }]]);

      store(db, 'services', 'id', [
        ['byGroup', 'group', { unique: false }],
        ['bySlug', 'slug', { unique: true }],
        ['byAgency', 'agencyId', { unique: false }],
      ]);

      store(db, 'service_fees', 'id', [
        ['byService', 'serviceId', { unique: false }],
      ]);

      // Ordered multi-agency approval routing, per service.
      store(db, 'service_routes', 'id', [
        ['byService', 'serviceId', { unique: false }],
        ['byAgency', 'agencyId', { unique: false }],
      ]);
    },
  },

  {
    version: 2,
    name: '0002_applications',
    up(db) {
      // Cash grants and Single Window each keep their own table — they carry
      // genuinely different detail — and share the timeline/review tables.
      store(db, 'cash_grant_applications', 'id', [
        ['byUser', 'userId', { unique: false }],
        ['byRef', 'ref', { unique: true }],
        ['byService', 'serviceId', { unique: false }],
        ['byStatus', 'status', { unique: false }],
      ]);

      store(db, 'single_window_applications', 'id', [
        ['byUser', 'userId', { unique: false }],
        ['byRef', 'ref', { unique: true }],
        ['byService', 'serviceId', { unique: false }],
        ['byStatus', 'status', { unique: false }],
        ['byParcel', 'parcelId', { unique: false }],
      ]);

      // Per-agency routing status for one application.
      store(db, 'application_agency_reviews', 'id', [
        ['byApplication', 'applicationId', { unique: false }],
        ['byAgency', 'agencyId', { unique: false }],
      ]);

      // Append-only timeline. The tracker is a projection of these.
      store(db, 'application_events', 'id', [
        ['byApplication', 'applicationId', { unique: false }],
      ]);
    },
  },

  {
    version: 3,
    name: '0003_gro',
    up(db) {
      // Registrations are created internally by GRO staff — the citizen only
      // ever reads one, by its registration number.
      // `regNoKey` is the registration number with every separator stripped, so
      // a citizen typing `b gt 1990 004512` finds `B/GT/1990/004512`.
      store(db, 'gro_registrations', 'id', [
        ['byRegNo', 'regNo', { unique: true }],
        ['byRegNoKey', 'regNoKey', { unique: true }],
        ['byType', 'type', { unique: false }],
        ['byClaimNationalId', 'claimNationalId', { unique: false }],
      ]);

      store(db, 'gro_certificates', 'id', [
        ['byRegistration', 'registrationId', { unique: false }],
        ['byRegNo', 'regNo', { unique: false }],
        ['byCertNo', 'certNo', { unique: true }],
      ]);

      // The citizen's own request against a registration number — this is what
      // shows up in My Applications and drives the tracker.
      store(db, 'gro_requests', 'id', [
        ['byUser', 'userId', { unique: false }],
        ['byRef', 'ref', { unique: true }],
        ['byRegNo', 'regNo', { unique: false }],
      ]);
    },
  },

  {
    version: 4,
    name: '0004_vault',
    up(db) {
      // Per-citizen document store. Every read is scoped by userId — a
      // certificate issued to one citizen is never visible to another.
      store(db, 'vault_documents', 'id', [
        ['byUser', 'userId', { unique: false }],
        ['byUserKind', ['userId', 'kind'], { unique: false }],
        ['byRefNo', 'refNo', { unique: false }],
      ]);
    },
  },

  {
    version: 5,
    name: '0005_seed_metadata',
    up(db) {
      // Records which seed revision has been applied, so reference data can be
      // refreshed without wiping citizen-owned rows.
      store(db, 'meta', 'key');
    },
  },
  {
    version: 6,
    name: '0006_document_type',
    up(db, tx) {
      // Every Vault document now carries a definitive type from the shared
      // contract (src/data/documentTypes.js). It is indexed because both the
      // Vault sections and the typed attach-from-Vault pickers query by it.
      const store = tx.objectStore('vault_documents');
      if (!store.indexNames.contains('byType')) {
        store.createIndex('byType', 'type', { unique: false });
      }
      if (!store.indexNames.contains('byUserType')) {
        store.createIndex('byUserType', ['userId', 'type'], { unique: false });
      }
      // Backfill: rows written before types existed carry only the old loose
      // `kind` and a title. Classify them from the title so nothing is
      // stranded without a type. The migration cannot import the classifier
      // (module state is not guaranteed inside an upgrade), so it stamps a
      // sentinel and src/api/vault.js resolves it on first read.
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) return;
        const row = cursor.value;
        if (!row.type) {
          cursor.update({ ...row, type: null, needsTypeBackfill: true });
        }
        cursor.continue();
      };
    },
  },
];

export const DB_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);

/** Every store the schema defines, for diagnostics and reset. */
export const STORE_NAMES = [
  'agencies',
  'services',
  'service_fees',
  'service_routes',
  'cash_grant_applications',
  'single_window_applications',
  'application_agency_reviews',
  'application_events',
  'gro_registrations',
  'gro_certificates',
  'gro_requests',
  'vault_documents',
  'meta',
];

/** Stores holding seeded reference data — safe to refresh wholesale. */
export const REFERENCE_STORES = ['agencies', 'services', 'service_fees', 'service_routes'];
