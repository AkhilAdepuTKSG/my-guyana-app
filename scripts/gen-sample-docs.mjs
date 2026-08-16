// One-off generator for the sample documents used to try the OCR scan feature.
// Draws high-contrast, clearly-labelled "documents" so tesseract.js reads them
// reliably, and writes PNGs into public/sample-docs/ (served by Vite/Vercel).
//
//   npm i -D @napi-rs/canvas && node scripts/gen-sample-docs.mjs
//
// The dependency is only needed to (re)generate the images; the committed PNGs
// are what the app uses at runtime.
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sample-docs');
mkdirSync(outDir, { recursive: true });

const W = 920;
const H = 560;

function draw({ file, headerColor, kicker, title, rows }) {
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

draw({
  file: 'national-id.png',
  headerColor: '#00795a',
  kicker: 'CO-OPERATIVE REPUBLIC OF GUYANA',
  title: 'NATIONAL IDENTIFICATION CARD',
  rows: [
    ['Full Name', 'NICOLE PERSAUD'],
    ['Date of Birth', '12/04/1990'],
    ['ID No', '884213004'],
    ['Address', 'Lot 22 Republic Road, Georgetown'],
  ],
});

draw({
  file: 'birth-certificate.png',
  headerColor: '#8b2346',
  kicker: 'GENERAL REGISTER OFFICE · GUYANA',
  title: 'BIRTH CERTIFICATE',
  rows: [
    ['Full Name', 'MAYA SINGH'],
    ['Date of Birth', '03/09/1996'],
    ['Document No', 'GRO-2291-0087'],
    ['Place of Birth', 'Georgetown, Guyana'],
  ],
});

draw({
  file: 'passport.png',
  headerColor: '#3a45b0',
  kicker: 'IMMIGRATION & PASSPORT · GUYANA',
  title: 'GUYANA PASSPORT',
  rows: [
    ['Full Name', 'DEVON WILLIAMS'],
    ['Date of Birth', '21/07/1988'],
    ['Passport No', 'R0456123'],
    ['Address', 'Lot 5 Sheriff Street, Georgetown'],
  ],
});
