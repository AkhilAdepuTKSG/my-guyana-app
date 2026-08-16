// #1 — real on-device OCR via tesseract.js. The import is dynamic so the WASM
// engine and language data (a few MB) load only when a citizen actually scans a
// document, keeping them out of the initial bundle. Runs entirely in the
// browser — no image ever leaves the device.

export async function recognizeImage(file, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: onProgress
      ? (m) => { if (m.status === 'recognizing text') onProgress(Math.round((m.progress || 0) * 100)); }
      : undefined,
  });
  try {
    const { data } = await worker.recognize(file);
    return data?.text || '';
  } finally {
    await worker.terminate();
  }
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Best-effort extraction of a few structured fields from raw OCR text. OCR of a
// photographed document is noisy, so this is deliberately conservative: it only
// returns what it's fairly sure about, and the citizen confirms everything.
export function parseFields(text) {
  const out = {};
  if (!text) return out;

  // Date of birth — accept yyyy-mm-dd / yyyy/mm/dd and dd-mm-yyyy / dd/mm/yyyy.
  const iso = text.match(/\b(19|20)\d{2}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  const dmy = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](19|20)\d{2}\b/);
  if (iso) {
    const [y, m, d] = iso[0].split(/[-/]/);
    out.dob = `${y}-${pad2(m)}-${pad2(d)}`;
  } else if (dmy) {
    const [d, m, y] = dmy[0].split(/[-/]/);
    out.dob = `${y}-${pad2(m)}-${pad2(d)}`;
  }

  // A document/ID number — a token with letters+digits or a long digit run.
  const idMatch = text.match(/\b(?=[A-Z0-9-]*\d)[A-Z]{0,3}-?\d{5,}[A-Z0-9-]*\b/i);
  if (idMatch) out.documentNumber = idMatch[0].trim();

  return out;
}
