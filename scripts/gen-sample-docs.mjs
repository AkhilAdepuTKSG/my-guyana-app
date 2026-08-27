// One-off generator for the sample documents used to try the OCR scan feature
// and to exercise the sign-in / account-creation lookups. Draws high-contrast,
// clearly-labelled "documents" so tesseract.js reads them reliably, and writes
// PNGs into public/sample-docs/ (served by Vite/Vercel).
//
//   npm i -D @napi-rs/canvas && node scripts/gen-sample-docs.mjs
//
// The dependency is only needed to (re)generate the images; the committed PNGs
// are what the app uses at runtime.
//
// IMPORTANT: every value below is kept in lock-step with src/state/govRegistry.js
// so a scanned/typed number resolves to the same citizen. Two people, each with
// a fully self-consistent set of documents (nothing shared or mismatched):
//   • Nicole Persaud — has an e-ID (123-4567-8901)
//   • John Doe       — no e-ID yet
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sample-docs');
mkdirSync(outDir, { recursive: true });

const W = 920;
const H = 560;

// Mirror of the two govRegistry citizens, with the extra display-only fields the
// documents need (place of birth, statement/issue dates, utility account).
const PEOPLE = [
  {
    id: 'nicole',
    name: 'NICOLE PERSAUD',
    dob: '12/04/1990',
    address: 'Lot 22 Republic Road, Georgetown',
    placeOfBirth: 'Georgetown, Guyana',
    hasEid: true,
    eidNo: '123-4567-8901',
    eidCardNo: '0000 1234 5678',
    nationalId: 'N1234567890',
    passport: 'P1234567890',
    driversLicence: 'DL1234567890',
    tin: '1234567890',
    birthCertNo: 'GRO-1990-0412',
    tinIssued: '14/02/2019',
    utilityAccount: 'GPL-88213-4',
    statementDate: '05/08/2026',
  },
  {
    id: 'john',
    name: 'JOHN DOE',
    dob: '30/09/1985',
    address: 'Lot 8 Sheriff Street, Georgetown',
    placeOfBirth: 'New Amsterdam, Guyana',
    hasEid: false,
    eidNo: null,
    eidCardNo: null,
    nationalId: 'N0987654321',
    passport: 'P0987654321',
    driversLicence: 'DL0987654321',
    tin: '0987654321',
    birthCertNo: 'GRO-1985-0930',
    tinIssued: '09/06/2016',
    utilityAccount: 'GPL-73914-2',
    statementDate: '04/08/2026',
  },
];

function draw({ file, headerColor, kicker, title, rows, chip }) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');

  // card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d0d5dd';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // header band
  ctx.fillStyle = headerColor;
  ctx.fillRect(6, 6, W - 12, 118);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 24px Arial';
  ctx.fillText(kicker, 40, 52);
  ctx.font = '800 40px Arial';
  ctx.fillText(title, 40, 98);

  // smart-card chip (e-ID)
  if (chip) {
    ctx.fillStyle = '#e9b949';
    ctx.fillRect(W - 152, 150, 80, 60);
    ctx.strokeStyle = '#a97f16'; ctx.lineWidth = 2;
    ctx.strokeRect(W - 152, 150, 80, 60);
    ctx.beginPath();
    ctx.moveTo(W - 152, 180); ctx.lineTo(W - 72, 180);
    ctx.moveTo(W - 112, 150); ctx.lineTo(W - 112, 210);
    ctx.stroke();
  }

  // labelled rows — black on white for clean OCR
  let y = 200;
  for (const [label, value] of rows) {
    ctx.fillStyle = '#111827';
    ctx.font = '700 30px Arial';
    ctx.fillText(`${label}:`, 40, y);
    ctx.font = '400 30px Arial';
    ctx.fillText(value, 360, y);
    y += 62;
  }

  writeFileSync(join(outDir, file), c.toBuffer('image/png'));
  // eslint-disable-next-line no-console
  console.log('wrote', file);
}

// A portrait-style document (passport photograph) — silhouette, no OCR fields.
function drawPhoto({ file, name }) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef2f6'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#c9d3de'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, W - 12, H - 12);
  const px = W / 2 - 150, py = 60, pw = 300, ph = 360;
  ctx.fillStyle = '#dce6f0'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#a9bccd'; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = '#8ba3ba';
  ctx.beginPath(); ctx.arc(W / 2, py + 150, 78, 0, Math.PI * 2); ctx.fill(); // head
  ctx.beginPath(); ctx.moveTo(px + 44, py + ph); ctx.quadraticCurveTo(W / 2, py + 232, px + pw - 44, py + ph); ctx.closePath(); ctx.fill(); // shoulders
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b2d4a'; ctx.font = '800 30px Arial';
  ctx.fillText('PASSPORT PHOTOGRAPH', W / 2, py + ph + 58);
  ctx.fillStyle = '#52657a'; ctx.font = '400 24px Arial';
  ctx.fillText(name + ' — plain background, recent', W / 2, py + ph + 96);
  ctx.textAlign = 'start';
  writeFileSync(join(outDir, file), c.toBuffer('image/png'));
  // eslint-disable-next-line no-console
  console.log('wrote', file);
}

for (const p of PEOPLE) {
  draw({
    file: `${p.id}-national-id.png`,
    headerColor: '#00795a',
    kicker: 'CO-OPERATIVE REPUBLIC OF GUYANA',
    title: 'NATIONAL IDENTIFICATION CARD',
    rows: [
      ['Full Name', p.name],
      ['Date of Birth', p.dob],
      ['ID No', p.nationalId],
      ['Address', p.address],
    ],
  });

  draw({
    file: `${p.id}-passport.png`,
    headerColor: '#3a45b0',
    kicker: 'IMMIGRATION & PASSPORT · GUYANA',
    title: 'GUYANA PASSPORT',
    rows: [
      ['Full Name', p.name],
      ['Date of Birth', p.dob],
      ['Passport No', p.passport],
      ['Address', p.address],
    ],
  });

  draw({
    file: `${p.id}-drivers-licence.png`,
    headerColor: '#1f6f4a',
    kicker: 'GUYANA POLICE FORCE',
    title: "DRIVER'S LICENCE",
    rows: [
      ['Full Name', p.name],
      ['Date of Birth', p.dob],
      ['Licence No', p.driversLicence],
      ['Address', p.address],
    ],
  });

  draw({
    file: `${p.id}-tin-certificate.png`,
    headerColor: '#2563c9',
    kicker: 'GUYANA REVENUE AUTHORITY',
    title: 'TIN CERTIFICATE',
    rows: [
      ['Full Name', p.name],
      ['TIN', p.tin],
      ['Date Issued', p.tinIssued],
      ['Status', 'Active'],
    ],
  });

  draw({
    file: `${p.id}-birth-certificate.png`,
    headerColor: '#8b2346',
    kicker: 'GENERAL REGISTER OFFICE · GUYANA',
    title: 'BIRTH CERTIFICATE',
    rows: [
      ['Full Name', p.name],
      ['Date of Birth', p.dob],
      ['Document No', p.birthCertNo],
      ['Place of Birth', p.placeOfBirth],
    ],
  });

  draw({
    file: `${p.id}-proof-of-address.png`,
    headerColor: '#404293',
    kicker: 'GUYANA POWER & LIGHT',
    title: 'UTILITY STATEMENT',
    rows: [
      ['Full Name', p.name],
      ['Address', p.address],
      ['Statement Date', p.statementDate],
      ['Account No', p.utilityAccount],
    ],
  });

  // e-ID card only for the citizen who actually holds one.
  if (p.hasEid) {
    draw({
      file: `${p.id}-eid-card.png`,
      headerColor: '#0b2d4a',
      kicker: 'DIGITAL IDENTITY CARD REGISTRY',
      title: 'GUYANA e-ID',
      chip: true,
      rows: [
        ['Full Name', p.name],
        ['Date of Birth', p.dob],
        ['e-ID No', p.eidNo],
        ['Card No', p.eidCardNo],
      ],
    });
  }

  drawPhoto({ file: `${p.id}-passport-photo.png`, name: p.name });
}
