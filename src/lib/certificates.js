// Certificate rendering.
//
// One function turns a register entry into the rows that appear on the
// certificate, and both the on-screen certificate and the downloadable PDF are
// drawn from that same list — so what a citizen sees is exactly what they get.

import { createPdf } from './pdf';

const NAVY = [0.078, 0.169, 0.267];   // --brand-600
const INK = [0.114, 0.161, 0.208];    // --neutral-900
const MUTED = [0.30, 0.36, 0.43];     // --neutral-600
const HAIRLINE = [0.80, 0.84, 0.88];
const PANEL = [0.961, 0.973, 0.980];  // --neutral-100

/** Human title for each certificate type. */
export const CERTIFICATE_TITLES = {
  birth: 'Certified Copy of an Entry of Birth',
  death: 'Certified Copy of an Entry of Death',
  marriage: 'Certified Copy of an Entry of Marriage',
};

function formatLongDate(value) {
  if (!value) return '—';
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * The field/value rows printed on a certificate, in order, for each type.
 * @param {import('../data/types').GroRegistration} registration
 * @returns {{label: string, value: string}[]}
 */
export function buildCertificatePayload(registration) {
  const r = registration?.record || {};
  if (registration?.type === 'birth') {
    return [
      { label: 'Name of child', value: r.childName },
      { label: 'Sex', value: r.sex },
      { label: 'Date of birth', value: formatLongDate(r.dateOfBirth) },
      { label: 'Place of birth', value: r.placeOfBirth },
      { label: 'Name of mother', value: r.motherName },
      { label: 'Maiden name of mother', value: r.motherMaidenName },
      { label: 'Name of father', value: r.fatherName },
      { label: 'Informant', value: r.informant },
      { label: 'Registration district', value: registration.registryDistrict },
      { label: 'Date of registration', value: formatLongDate(registration.registeredAt) },
    ].filter((row) => row.value);
  }

  if (registration?.type === 'death') {
    return [
      { label: 'Name of deceased', value: r.deceasedName },
      { label: 'Sex', value: r.sex },
      { label: 'Date of death', value: formatLongDate(r.dateOfDeath) },
      { label: 'Place of death', value: r.placeOfDeath },
      { label: 'Age at death', value: r.ageAtDeath != null ? `${r.ageAtDeath} years` : '' },
      { label: 'Cause of death', value: r.causeOfDeath },
      { label: 'Informant', value: r.informant },
      { label: 'Registration district', value: registration.registryDistrict },
      { label: 'Date of registration', value: formatLongDate(registration.registeredAt) },
    ].filter((row) => row.value);
  }

  return [
    { label: 'Name of first party', value: r.partyOneName },
    { label: 'Name of second party', value: r.partyTwoName },
    { label: 'Date of marriage', value: formatLongDate(r.dateOfMarriage) },
    { label: 'Place of marriage', value: r.placeOfMarriage },
    { label: 'Solemnised by', value: r.officiant },
    { label: 'Witness', value: r.witnessOne },
    { label: 'Witness', value: r.witnessTwo },
    { label: 'Registration district', value: registration?.registryDistrict },
    { label: 'Date of registration', value: formatLongDate(registration?.registeredAt) },
  ].filter((row) => row.value);
}

/** The filename a downloaded certificate is saved under. */
export function certificateFileName(certificate) {
  const type = (certificate?.type || 'certificate').replace(/[^a-z]/gi, '');
  const no = String(certificate?.certNo || '').replace(/[^A-Za-z0-9]/g, '-');
  return `guyana-${type}-certificate-${no}.pdf`;
}

/**
 * Draw the certificate as a real PDF.
 * @param {{
 *   certificate: import('../data/types').GroCertificate,
 *   registration: import('../data/types').GroRegistration,
 *   issuedTo?: string
 * }} args
 * @returns {Blob}
 */
export function renderCertificatePdf({ certificate, registration, issuedTo }) {
  const doc = createPdf();
  const { width } = doc;
  const margin = 54;
  const contentWidth = width - margin * 2;
  const rows = certificate?.payload?.length ? certificate.payload : buildCertificatePayload(registration);

  // --- Masthead -----------------------------------------------------------
  doc.rect(0, 0, width, 108, { fill: NAVY });
  doc.text('REPUBLIC OF GUYANA', 0, 44, {
    size: 17, bold: true, color: [1, 1, 1], align: 'center', width, letterSpacing: 2.2,
  });
  doc.text('GENERAL REGISTER OFFICE', 0, 66, {
    size: 9.5, color: [0.72, 0.79, 0.86], align: 'center', width, letterSpacing: 1.6,
  });
  doc.text('Ministry of Legal Affairs', 0, 84, {
    size: 8.5, color: [0.58, 0.67, 0.77], align: 'center', width,
  });

  // --- Title --------------------------------------------------------------
  let y = 150;
  doc.text(CERTIFICATE_TITLES[certificate?.type] || 'Certified Copy of a Register Entry', 0, y, {
    size: 15, bold: true, color: INK, align: 'center', width,
  });
  y += 18;
  doc.text('Issued under the Registration of Births and Deaths Act, Chapter 44:01', 0, y, {
    size: 8.5, color: MUTED, align: 'center', width,
  });

  // --- Reference panel ----------------------------------------------------
  y += 22;
  doc.rect(margin, y, contentWidth, 46, { fill: PANEL, stroke: HAIRLINE, lineWidth: 0.6 });
  const colWidth = contentWidth / 3;
  const refs = [
    ['Certificate number', certificate?.certNo || '—'],
    ['Registration number', certificate?.regNo || registration?.regNo || '—'],
    ['Date issued', formatLongDate(certificate?.issuedAt)],
  ];
  refs.forEach(([label, value], i) => {
    const x = margin + i * colWidth;
    doc.text(label.toUpperCase(), x + 12, y + 18, { size: 6.8, bold: true, color: MUTED, letterSpacing: 0.8 });
    doc.text(value, x + 12, y + 34, { size: 10, bold: true, color: INK });
  });
  y += 46;

  // --- Register entry -----------------------------------------------------
  y += 34;
  doc.text('PARTICULARS ENTERED IN THE REGISTER', margin, y, {
    size: 7.5, bold: true, color: MUTED, letterSpacing: 1.1,
  });
  y += 10;
  doc.line(margin, y, width - margin, y, { width: 1, color: NAVY });
  y += 22;

  const labelWidth = 168;
  rows.forEach((row) => {
    doc.text(row.label, margin, y, { size: 9, color: MUTED });
    const valueEnd = doc.paragraph(String(row.value ?? '—'), margin + labelWidth, y, contentWidth - labelWidth, {
      size: 10.5, bold: true, color: INK, leading: 14,
    });
    const next = Math.max(y + 22, valueEnd + 8);
    doc.line(margin, next - 8, width - margin, next - 8, { width: 0.4, color: HAIRLINE });
    y = next;
  });

  // --- Certification ------------------------------------------------------
  y += 18;
  y = doc.paragraph(
    'I certify that the above is a true copy of an entry in the register kept at the General Register Office, '
    + 'Georgetown, Guyana. This certificate is issued electronically through My Guyana and is valid without a '
    + 'manuscript signature.',
    margin, y, contentWidth, { size: 8.8, color: MUTED, leading: 12.5 }
  );

  y += 34;
  doc.line(margin, y, margin + 200, y, { width: 0.8, color: INK });
  doc.text('Registrar General', margin, y + 14, { size: 8.5, color: MUTED });

  doc.line(width - margin - 200, y, width - margin, y, { width: 0.8, color: INK });
  doc.text('Official seal — General Register Office', width - margin - 200, y + 14, { size: 8.5, color: MUTED });

  // --- Footer -------------------------------------------------------------
  const footerY = doc.height - 62;
  doc.line(margin, footerY - 16, width - margin, footerY - 16, { width: 0.5, color: HAIRLINE });
  doc.text(
    issuedTo ? `Issued to ${issuedTo} via My Guyana` : 'Issued via My Guyana',
    margin, footerY, { size: 8, color: MUTED }
  );
  doc.text(
    `Verify at gro.gov.gy using ${certificate?.certNo || registration?.regNo || ''}`,
    margin, footerY, { size: 8, color: MUTED, align: 'right', width: contentWidth }
  );
  doc.text(
    'WARNING: it is an offence to alter this certificate or to use an altered certificate.',
    margin, footerY + 14, { size: 7.5, color: MUTED }
  );

  return doc.toBlob();
}
