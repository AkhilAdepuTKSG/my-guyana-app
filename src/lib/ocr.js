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

function normalizeDob(raw) {
  if (!raw) return '';
  const parts = raw.trim().split(/[-/.]/).filter(Boolean);
  if (parts.length !== 3) return '';
  // yyyy-mm-dd if the first chunk is a 4-digit year, else dd-mm-yyyy.
  if (parts[0].length === 4) return `${parts[0]}-${pad2(parts[1])}-${pad2(parts[2])}`;
  return `${parts[2]}-${pad2(parts[1])}-${pad2(parts[0])}`;
}

// Best-effort extraction of structured fields from raw OCR text. It first reads
// labelled lines ("Full Name:", "Date of Birth:", "ID No:", "Address:") — which
// the sample documents use and most real IDs carry — then falls back to
// unlabelled date/number patterns. OCR is noisy, so callers pre-fill what comes
// back and the citizen confirms everything.
export function parseFields(text) {
  const out = {};
  if (!text) return out;
  const grab = (re) => { const m = text.match(re); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };

  // Where a captured value must stop — the next field label or end of line/text.
  // Keeps a value from bleeding into the next field when OCR returns one line.
  const STOP = '(?=\\s*(?:full\\s*name|date of birth|d\\.?o\\.?b|id\\s*(?:no|number)|passport\\s*no|document\\s*no|nis\\s*no|\\btin\\b|address|place of birth|sex|nationality|expiry|issued|$|\\n))';

  const fullName = grab(new RegExp(`full\\s*name[:\\s]+([A-Za-z][A-Za-z .'-]{1,40}?)${STOP}`, 'i'))
    || grab(new RegExp(`\\bname[:\\s]+([A-Za-z][A-Za-z .'-]{1,40}?)${STOP}`, 'i'));
  const address = grab(new RegExp(`address[:\\s]+([^\\n]{4,80}?)${STOP}`, 'i'));
  const labelledDob = grab(/(?:date of birth|dob|d\.o\.b\.?)[:\s]+([0-9][0-9/.-]{5,12})/i);
  const labelledId = grab(/(?:id\s*(?:no|number)|passport\s*no|tin|nis\s*no|document\s*no)[.:\s]+([A-Z0-9][A-Z0-9-]{4,20})/i);

  // Date of birth: labelled first, else an unlabelled date anywhere.
  let dob = labelledDob;
  if (!dob) {
    const iso = text.match(/\b(19|20)\d{2}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
    const dmy = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](19|20)\d{2}\b/);
    dob = iso ? iso[0] : dmy ? dmy[0] : '';
  }
  const normDob = normalizeDob(dob);
  if (normDob) out.dob = normDob;

  if (fullName) {
    out.fullName = fullName;
    const words = fullName.split(/\s+/);
    if (words.length >= 2) { out.surname = words[words.length - 1]; out.givenNames = words.slice(0, -1).join(' '); }
    else out.givenNames = fullName;
  }

  if (address) out.address = address;

  // Document/ID number: labelled first, else a token with letters+digits or a long digit run.
  let doc = labelledId;
  if (!doc) {
    const m = text.match(/\b(?=[A-Z0-9-]*\d)[A-Z]{0,3}-?\d{5,}[A-Z0-9-]*\b/i);
    if (m) doc = m[0];
  }
  if (doc) out.documentNumber = doc.trim();

  return out;
}
