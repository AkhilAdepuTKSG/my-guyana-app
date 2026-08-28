// General Register Office endpoints.
//
// Registration happens inside the GRO, not here: a citizen holds a registration
// number and uses it to follow the registration and collect the certificate.
// So the entry point is `lookupRegistration`, not a form submission.
//
// The rules the endpoints enforce:
//   • an unknown number tells the citizen plainly that nothing matches it;
//   • a registration tied to a National ID can only be collected by that
//     citizen, and by nobody else;
//   • only an `approved` registration produces a certificate;
//   • collecting a certificate files a copy in that citizen's Vault, and
//     collecting it twice does not file it twice.

import { get, getOneBy, getAllBy, put } from '../data/db';
import { newId, newCertificateNumber, now } from '../data/ids';
import { normaliseRegNo } from '../data/seed/groRegistry';
import { GRO_SERVICE_BY_TYPE } from '../data/seed/servicesGro';
import { getService, listFees } from './catalog';
import { addEvent, listEvents, assignReference } from './applicationCommon';
import { fileIssuedDocument } from './vault';
import { buildCertificatePayload } from '../lib/certificates';
import { ApiError } from './validate';

const REG_STORE = 'gro_registrations';
const CERT_STORE = 'gro_certificates';
const REQUEST_STORE = 'gro_requests';

/**
 * The document type each certificate is filed under, from the shared contract.
 * This is what puts a collected certificate in Documents & records rather than
 * Cards & IDs, and what makes it selectable only where that certificate is
 * accepted.
 */
const DOCUMENT_TYPE_BY_CERTIFICATE = {
  birth: 'BIRTH_CERTIFICATE',
  death: 'DEATH_CERTIFICATE',
  marriage: 'MARRIAGE_CERTIFICATE',
};

/** Where a registration has reached, in citizen-facing language. */
export const REGISTRATION_STAGES = [
  { id: 'received', label: 'Received by the GRO', note: 'The register entry has been lodged.' },
  { id: 'verification', label: 'Under verification', note: 'A registrar is checking the entry against the supporting documents.' },
  { id: 'registered', label: 'Entered in the register', note: 'The entry is in the register and is awaiting final approval.' },
  { id: 'approved', label: 'Approved — certificate available', note: 'You can view and download your certified copy.' },
];

/** Maps a registration status onto the application status the tracker shows. */
const APPLICATION_STATUS_BY_REGISTRATION = {
  received: 'submitted',
  verification: 'inReview',
  registered: 'inReview',
  approved: 'approved',
  rejected: 'rejected',
};

/**
 * Find a registration by the number the citizen typed. Spacing, dashes,
 * slashes and case are all ignored.
 * @param {string} regNo
 * @returns {Promise<import('../data/types').GroRegistration|null>}
 */
export async function findRegistration(regNo) {
  const key = normaliseRegNo(regNo);
  if (!key) return null;
  return getOneBy(REG_STORE, 'byRegNoKey', key);
}

/**
 * Look up a registration number on behalf of a signed-in citizen, and record
 * the request so it appears in My Applications and can be tracked.
 *
 * @param {{userId: string, regNo: string, nationalId?: string|null, tier?: 'standard'|'expedited'}} args
 * @returns {Promise<{request: import('../data/types').GroRequest, registration: import('../data/types').GroRegistration}>}
 */
export async function lookupRegistration({ userId, regNo, nationalId = null, tier = 'standard' }) {
  if (!userId) throw new ApiError('You need to be signed in to look up a registration.', 'unauthenticated');
  const typed = String(regNo || '').trim();
  if (!typed) throw new ApiError('Enter your registration number.', 'validation');

  const registration = await findRegistration(typed);
  if (!registration) {
    throw new ApiError(
      'No registration matches that number. Check it against your registration slip — it looks like B/GT/1990/004512.',
      'notFound',
      { regNo: typed }
    );
  }

  // Entitlement: where the register entry is tied to a National ID, only that
  // citizen may collect the certificate here.
  if (registration.claimNationalId && normaliseRegNo(registration.claimNationalId) !== normaliseRegNo(nationalId || '')) {
    throw new ApiError(
      'That registration is held against a different National ID. The person named on it can collect it from their own My Guyana account, '
      + 'or you can collect it in person at a GRO district office.',
      'forbidden',
      { regNo: registration.regNo }
    );
  }

  const request = await upsertRequest({ userId, registration, tier });
  return { request, registration };
}

/**
 * Create or refresh the citizen's request against a registration number. One
 * request per citizen per registration — looking the same number up again picks
 * the existing request back up rather than starting a second one.
 */
async function upsertRequest({ userId, registration, tier }) {
  const existing = (await listRequests(userId)).find((r) => r.regNo === registration.regNo);
  const serviceId = GRO_SERVICE_BY_TYPE[registration.type];
  const fees = await listFees(serviceId);
  const chosen = fees.find((f) => f.kind === tier) || fees.find((f) => f.kind === 'standard');
  const status = APPLICATION_STATUS_BY_REGISTRATION[registration.status] || 'submitted';
  const timestamp = now();

  if (existing) {
    const updated = {
      ...existing,
      tier,
      feeTotalGyd: chosen?.amountGyd ?? existing.feeTotalGyd,
      status,
      updatedAt: timestamp,
    };
    await put(REQUEST_STORE, updated);
    return updated;
  }

  /** @type {import('../data/types').GroRequest} */
  const request = {
    id: newId('grq'),
    ref: assignReference('GRO-CR'),
    userId,
    regNo: registration.regNo,
    registrationId: registration.id,
    type: registration.type,
    status,
    tier,
    feeTotalGyd: chosen?.amountGyd ?? 0,
    feeStatus: 'unpaid',
    certificateId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await put(REQUEST_STORE, request);

  await addEvent({
    applicationId: request.id,
    type: 'created',
    label: 'Registration number looked up',
    note: `${registration.regNo} — ${registration.registryDistrict} district registry.`,
    agencyId: 'gro',
  });
  await addEvent({
    applicationId: request.id,
    type: 'submitted',
    label: 'Registered at the General Register Office',
    note: `Entered in the register on ${registration.registeredAt}.`,
    agencyId: 'gro',
    at: `${registration.registeredAt}T09:00:00.000Z`,
  });
  if (registration.approvedAt) {
    await addEvent({
      applicationId: request.id,
      type: 'approved',
      label: 'Registration approved',
      note: 'A certified copy can be issued.',
      agencyId: 'gro',
      at: `${registration.approvedAt}T09:00:00.000Z`,
    });
  }
  if (registration.status === 'rejected' && registration.rejectionReason) {
    await addEvent({
      applicationId: request.id,
      type: 'rejected',
      label: 'Registration queried',
      note: registration.rejectionReason,
      agencyId: 'gro',
    });
  }
  return request;
}

/**
 * Every GRO request a citizen has made, newest first.
 * @param {string} userId
 * @returns {Promise<import('../data/types').GroRequest[]>}
 */
export async function listRequests(userId) {
  if (!userId) return [];
  const rows = await getAllBy(REQUEST_STORE, 'byUser', userId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * @param {string} id
 * @returns {Promise<import('../data/types').GroRequest|null>}
 */
export function getRequest(id) {
  return get(REQUEST_STORE, id);
}

/**
 * The tracking view for one request: where the registration has reached, the
 * timeline, and the certificate if there is one.
 * @param {{userId: string, requestId: string}} args
 */
export async function getRequestDetail({ userId, requestId }) {
  const request = await getRequest(requestId);
  if (!request) throw new ApiError('That request no longer exists.', 'notFound');
  if (request.userId !== userId) throw new ApiError('That request belongs to someone else.', 'forbidden');

  const registration = request.registrationId ? await get(REG_STORE, request.registrationId) : null;
  const [service, events] = await Promise.all([
    getService(GRO_SERVICE_BY_TYPE[request.type] || ''),
    listEvents(requestId),
  ]);
  const certificate = request.certificateId ? await get(CERT_STORE, request.certificateId) : null;

  return {
    request,
    registration,
    service,
    events,
    certificate,
    stages: buildStages(registration),
    canCollect: registration?.status === 'approved',
  };
}

/**
 * The four-stage progress the tracker draws, marked against where the
 * registration has actually reached.
 * @param {import('../data/types').GroRegistration|null} registration
 */
export function buildStages(registration) {
  if (!registration) return [];
  if (registration.status === 'rejected') {
    return [
      { ...REGISTRATION_STAGES[0], state: 'done' },
      { id: 'rejected', label: 'Queried by the registrar', note: registration.rejectionReason || 'The registrar has raised a query on this entry.', state: 'current' },
    ];
  }
  const order = REGISTRATION_STAGES.map((s) => s.id);
  const reached = order.indexOf(registration.status);
  return REGISTRATION_STAGES.map((stage, i) => ({
    ...stage,
    state: i < reached ? 'done' : i === reached ? 'current' : 'todo',
  }));
}

/**
 * Collect the certificate for an approved registration.
 *
 * Generates it on first collection and reuses it afterwards, so the certificate
 * number stays stable, then files a copy in the collecting citizen's Vault —
 * theirs alone.
 *
 * @param {{userId: string, requestId: string, issuedTo?: string}} args
 * @returns {Promise<{
 *   certificate: import('../data/types').GroCertificate,
 *   registration: import('../data/types').GroRegistration,
 *   request: import('../data/types').GroRequest,
 *   vaultDocument: import('../data/types').VaultDocument,
 *   filedNow: boolean
 * }>}
 */
export async function collectCertificate({ userId, requestId, issuedTo }) {
  const request = await getRequest(requestId);
  if (!request) throw new ApiError('That request no longer exists.', 'notFound');
  if (request.userId !== userId) throw new ApiError('That request belongs to someone else.', 'forbidden');

  const registration = request.registrationId ? await get(REG_STORE, request.registrationId) : null;
  if (!registration) throw new ApiError('The register entry could not be read.', 'notFound');

  if (registration.status === 'rejected') {
    throw new ApiError(
      registration.rejectionReason || 'The registrar has queried this entry, so no certificate can be issued yet.',
      'conflict'
    );
  }
  if (registration.status !== 'approved') {
    throw new ApiError(
      'This registration has not been approved yet, so there is no certificate to issue. You will see it here as soon as it is.',
      'conflict',
      { status: registration.status }
    );
  }

  const timestamp = now();

  // Reuse the certificate if one has already been generated for this entry.
  let certificate = request.certificateId ? await get(CERT_STORE, request.certificateId) : null;
  if (!certificate) {
    const existing = await getAllBy(CERT_STORE, 'byRegistration', registration.id);
    certificate = existing[0] || null;
  }
  if (!certificate) {
    /** @type {import('../data/types').GroCertificate} */
    certificate = {
      id: newId('cert'),
      registrationId: registration.id,
      regNo: registration.regNo,
      certNo: newCertificateNumber(registration.type),
      type: registration.type,
      issuedAt: timestamp,
      tier: request.tier,
      payload: buildCertificatePayload(registration),
    };
    await put(CERT_STORE, certificate);
    await addEvent({
      applicationId: request.id,
      type: 'issued',
      label: 'Certificate issued',
      note: `Certificate ${certificate.certNo} generated from the register entry.`,
      agencyId: 'gro',
      at: timestamp,
    });
  }

  const docType = DOCUMENT_TYPE_BY_CERTIFICATE[registration.type] || 'OTHER';
  const { document, created } = await fileIssuedDocument({
    userId,
    type: docType,
    title: `${certificateTypeLabel(registration.type)} certificate`,
    subtitle: `${primarySubject(registration)} · ${certificate.certNo}`,
    issuedBy: 'General Register Office',
    refNo: certificate.certNo,
    fileName: `${registration.type}-certificate-${certificate.certNo.replace(/[^A-Za-z0-9]/g, '-')}.pdf`,
    mimeType: 'application/pdf',
    // The PDF is redrawn from the register entry whenever it is opened, so the
    // Vault stores the recipe rather than a stale copy of the bytes.
    content: { generator: 'groCertificate', args: { certificateId: certificate.id, registrationId: registration.id, issuedTo: issuedTo ?? null } },
  });

  if (created) {
    await addEvent({
      applicationId: request.id,
      type: 'issued',
      label: 'Filed in your Vault',
      note: 'Only you can see it there.',
      agencyId: 'gro',
      at: timestamp,
    });
  }

  // The fee is payable to the GRO on collection; nothing has been charged here,
  // so its status is left alone rather than marked paid.
  const updatedRequest = {
    ...request,
    status: /** @type {import('../data/types').ApplicationStatus} */ ('approved'),
    certificateId: certificate.id,
    updatedAt: timestamp,
  };
  await put(REQUEST_STORE, updatedRequest);

  return { certificate, registration, request: updatedRequest, vaultDocument: document, filedNow: created };
}

/** "Birth" / "Death" / "Marriage". */
export function certificateTypeLabel(type) {
  return { birth: 'Birth', death: 'Death', marriage: 'Marriage' }[type] || 'Register';
}

/** The person the register entry is about, for a subtitle. */
export function primarySubject(registration) {
  const r = registration?.record || {};
  if (registration?.type === 'birth') return r.childName || '';
  if (registration?.type === 'death') return r.deceasedName || '';
  return [r.partyOneName, r.partyTwoName].filter(Boolean).join(' & ');
}

/**
 * Rebuild a certificate stored in the Vault, so the PDF can be regenerated on
 * demand from the register entry rather than kept as bytes.
 * @param {{certificateId: string, registrationId: string}} args
 */
export async function loadCertificateForVault({ certificateId, registrationId }) {
  const [certificate, registration] = await Promise.all([
    get(CERT_STORE, certificateId),
    get(REG_STORE, registrationId),
  ]);
  if (!certificate || !registration) throw new ApiError('That certificate could not be read.', 'notFound');
  return { certificate, registration };
}
