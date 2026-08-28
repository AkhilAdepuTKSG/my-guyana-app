// The old age pension award letter.
//
// Same discipline as the GRO certificate (src/lib/certificates.js): one
// function builds the rows, and both the tracker and the downloadable PDF are
// drawn from that same list, so what a citizen reads on screen is exactly what
// they get on paper. The Vault stores the recipe rather than the bytes, so the
// letter is redrawn from the application whenever it is opened.

import { createPdf } from './pdf';
import { pensionConfig, formatLongDate } from './pension';

const MAROON = [0.761, 0.212, 0.373];  // MHSSS identity colour, #c2365f
const INK = [0.114, 0.161, 0.208];
const MUTED = [0.30, 0.36, 0.43];
const HAIRLINE = [0.80, 0.84, 0.88];
const PANEL = [0.961, 0.973, 0.980];

function money(amount) {
  const n = Number(amount) || 0;
  return `$${n.toLocaleString('en-GY')} GYD`;
}

/** How the citizen is paid, in one line. */
function disbursementLine(application) {
  const d = application?.disbursementDetail;
  if (!d) return '—';
  const where = application.disbursementMethod === 'mmg' ? 'Mobile money wallet' : 'Bank account';
  const bits = [where];
  if (d.provider) bits.push(String(d.provider).toUpperCase());
  if (d.branch) bits.push(d.branch);
  if (d.last4) bits.push(`ending ${d.last4}`);
  return bits.join(' · ');
}

/**
 * The field/value rows printed on the award letter.
 * @param {{application: import('../data/types').OldAgePensionApplication, service?: import('../data/types').Service}} args
 * @returns {{label: string, value: string}[]}
 */
export function buildAwardPayload({ application, service }) {
  const cfg = pensionConfig(service);
  const monthly = application?.monthlyBenefitGyd ?? cfg.monthlyBenefitGyd;
  const transport = application?.transportGrantGyd ?? cfg.transportGrantGyd;
  return [
    { label: 'Pensioner', value: application?.fields?.applicantName || '—' },
    { label: 'Date of birth', value: formatLongDate(application?.dateOfBirth) || '—' },
    { label: 'Age at award', value: application?.ageAtApplication != null ? `${application.ageAtApplication} years` : '—' },
    { label: 'Address', value: application?.fields?.address || '—' },
    { label: 'Monthly pension', value: `${money(monthly)} per month` },
    { label: 'Transportation grant', value: `${money(transport)} per year` },
    { label: 'Award effective from', value: formatLongDate(application?.awardStartsOn) || '—' },
    { label: 'Paid to', value: disbursementLine(application) },
    { label: 'Account holder', value: application?.disbursementDetail?.holder || '—' },
  ];
}

/** The file the citizen downloads. */
export function awardFileName(application) {
  const ref = String(application?.ref || 'award').replace(/[^A-Za-z0-9]/g, '-');
  return `old-age-pension-award-${ref}.pdf`;
}

/**
 * Draw the award letter.
 * @param {{
 *   application: import('../data/types').OldAgePensionApplication,
 *   service?: import('../data/types').Service,
 *   issuedTo?: string|null
 * }} args
 * @returns {Blob}
 */
export function renderAwardPdf({ application, service, issuedTo }) {
  const doc = createPdf();
  const { width } = doc;
  const margin = 54;
  const contentWidth = width - margin * 2;
  const rows = buildAwardPayload({ application, service });
  const cfg = pensionConfig(service);

  // --- Masthead -----------------------------------------------------------
  doc.rect(0, 0, width, 108, { fill: MAROON });
  doc.text('REPUBLIC OF GUYANA', 0, 44, {
    size: 17, bold: true, color: [1, 1, 1], align: 'center', width, letterSpacing: 2.2,
  });
  doc.text('MINISTRY OF HUMAN SERVICES & SOCIAL SECURITY', 0, 66, {
    size: 8.5, color: [0.97, 0.87, 0.90], align: 'center', width, letterSpacing: 1.2,
  });
  doc.text('Old Age Pension', 0, 84, {
    size: 8.5, color: [0.94, 0.80, 0.85], align: 'center', width,
  });

  // --- Title --------------------------------------------------------------
  let y = 150;
  doc.text('Notice of Old Age Pension Award', 0, y, {
    size: 15, bold: true, color: INK, align: 'center', width,
  });
  y += 18;
  doc.text('Issued under the Old Age Pensions Act, Chapter 36:30', 0, y, {
    size: 8.5, color: MUTED, align: 'center', width,
  });

  // --- Reference panel ----------------------------------------------------
  y += 22;
  doc.rect(margin, y, contentWidth, 46, { fill: PANEL, stroke: HAIRLINE, lineWidth: 0.6 });
  const colWidth = contentWidth / 3;
  const refs = [
    ['Reference', application?.ref || '—'],
    ['Effective from', formatLongDate(application?.awardStartsOn) || '—'],
    ['Date issued', formatLongDate(application?.decisionAt) || formatLongDate(new Date()) || '—'],
  ];
  refs.forEach(([label, value], i) => {
    const x = margin + i * colWidth;
    doc.text(label.toUpperCase(), x + 12, y + 18, { size: 6.8, bold: true, color: MUTED, letterSpacing: 0.8 });
    doc.text(value, x + 12, y + 34, { size: 10, bold: true, color: INK });
  });
  y += 46;

  // --- The award ----------------------------------------------------------
  y += 34;
  doc.text('PARTICULARS OF THE AWARD', margin, y, {
    size: 7.5, bold: true, color: MUTED, letterSpacing: 1.1,
  });
  y += 10;
  doc.line(margin, y, width - margin, y, { width: 1, color: MAROON });
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

  // --- What it means ------------------------------------------------------
  y += 18;
  y = doc.paragraph(
    `This confirms that the person named above has been awarded the old age pension of `
    + `${money(application?.monthlyBenefitGyd ?? cfg.monthlyBenefitGyd)} a month, payable for life from the date shown, `
    + `together with the annual transportation grant of ${money(application?.transportGrantGyd ?? cfg.transportGrantGyd)}. `
    + 'The pension is not means-tested and is not reduced by any other income. '
    + 'Payment is made to the account or wallet recorded above; tell the Ministry before it changes.',
    margin, y, contentWidth, { size: 8.8, color: MUTED, leading: 12.5 }
  );

  y += 34;
  doc.line(margin, y, margin + 200, y, { width: 0.8, color: INK });
  doc.text('Permanent Secretary', margin, y + 14, { size: 8.5, color: MUTED });

  doc.line(width - margin - 200, y, width - margin, y, { width: 0.8, color: INK });
  doc.text('Ministry of Human Services & Social Security', width - margin - 200, y + 14, { size: 8, color: MUTED });

  // --- Footer -------------------------------------------------------------
  const footerY = doc.height - 62;
  doc.line(margin, footerY - 16, width - margin, footerY - 16, { width: 0.5, color: HAIRLINE });
  doc.text(
    issuedTo ? `Issued to ${issuedTo} via My Guyana` : 'Issued via My Guyana',
    margin, footerY, { size: 8, color: MUTED }
  );
  doc.text(
    `Verify at mhsss.gov.gy using ${application?.ref || ''}`,
    margin, footerY, { size: 8, color: MUTED, align: 'right', width: contentWidth }
  );
  doc.text(
    'The old age pension is free. Nobody may charge you a fee to claim it or to keep it.',
    margin, footerY + 14, { size: 7.5, color: MUTED }
  );

  return doc.toBlob();
}
