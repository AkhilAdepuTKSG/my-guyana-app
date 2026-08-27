// A minimal PDF writer.
//
// Certificates have to download as real PDF files, not as a print dialog or an
// image, and the app carries no PDF dependency. This produces a valid PDF 1.4
// document using the two base-14 fonts every reader has built in (Helvetica and
// Helvetica-Bold), which is everything a certificate needs: text, rules, boxes
// and filled panels.
//
// Coordinates are given from the TOP-LEFT of the page, in points, because that
// is how the certificate layout reads; the writer flips them into PDF's
// bottom-left origin.

// Advance widths for the base-14 Helvetica faces, in 1/1000 em, for ASCII
// 32–126. Used to measure text so centring and right-alignment are exact.
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// Characters that turn up in Guyanese names, addresses and our own copy but
// have no ASCII code point. Mapped rather than dropped, so nothing is lost
// silently on the printed certificate.
const TRANSLITERATE = {
  '‘': "'", '’': "'", '‚': "'", '“': '"', '”': '"', '„': '"',
  '–': '-', '—': '-', '−': '-', '\u2026': '...', '\u00a0': ' ',
  '½': '1/2', '¼': '1/4', '¾': '3/4',
  'é': 'e', 'è': 'e', 'ê': 'e', 'á': 'a', 'à': 'a', 'â': 'a',
  'í': 'i', 'î': 'i', 'ó': 'o', 'ô': 'o', 'ú': 'u', 'û': 'u',
  'ñ': 'n', 'ç': 'c', 'É': 'E', 'Á': 'A', 'Ó': 'O', 'Ú': 'U',
  'Ñ': 'N', 'Ç': 'C', '•': '-', '·': '-', '°': ' deg',
};

/** Reduce a string to the ASCII range the base-14 fonts encode. */
export function toAscii(value) {
  return String(value ?? '')
    .replace(/[\u0080-\uffff]/g, (ch) => TRANSLITERATE[ch] ?? '?')
    .replace(/[\r\n\t]/g, ' ');
}

/** Escape the three characters that are special inside a PDF string literal. */
function escapeText(value) {
  return value.replace(/[\\()]/g, (ch) => `\\${ch}`);
}

/**
 * Width of a string at a given size, in points.
 * @param {string} text
 * @param {number} size
 * @param {boolean} bold
 */
export function measureText(text, size, bold = false) {
  const widths = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  const ascii = toAscii(text);
  let total = 0;
  for (let i = 0; i < ascii.length; i += 1) {
    const code = ascii.charCodeAt(i);
    total += (code >= 32 && code <= 126) ? widths[code - 32] : widths[0];
  }
  return (total * size) / 1000;
}

/**
 * Break text into lines that fit `maxWidth`, breaking on spaces where possible.
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} size
 * @param {boolean} bold
 * @returns {string[]}
 */
export function wrapText(text, maxWidth, size, bold = false) {
  const words = toAscii(text).split(/\s+/).filter(Boolean);
  /** @type {string[]} */
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (measureText(candidate, size, bold) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function fmt(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Start a new PDF document.
 * @param {{width?: number, height?: number}} [opts] page size in points (A4 by default)
 */
export function createPdf(opts = {}) {
  const width = opts.width ?? 595.28;
  const height = opts.height ?? 841.89;

  /** @type {string[][]} one content stream per page */
  const pages = [[]];
  let current = 0;

  const api = {
    width,
    height,

    /** Start a new page and draw on that from here on. */
    addPage() {
      pages.push([]);
      current = pages.length - 1;
      return api;
    },

    /**
     * Draw a line of text.
     * @param {string} text
     * @param {number} x
     * @param {number} y distance from the top of the page to the text baseline
     * @param {{size?: number, bold?: boolean, color?: [number, number, number], align?: 'left'|'center'|'right', width?: number, letterSpacing?: number}} [style]
     */
    text(text, x, y, style = {}) {
      const size = style.size ?? 11;
      const bold = !!style.bold;
      const [r, g, b] = style.color ?? [0, 0, 0];
      const ascii = toAscii(text);
      if (!ascii) return api;

      let drawX = x;
      if (style.align === 'center' || style.align === 'right') {
        const boxWidth = style.width ?? width;
        const textWidth = measureText(ascii, size, bold)
          + (style.letterSpacing ? style.letterSpacing * Math.max(0, ascii.length - 1) : 0);
        drawX = style.align === 'center' ? x + (boxWidth - textWidth) / 2 : x + boxWidth - textWidth;
      }

      const parts = [
        'BT',
        `${fmt(r)} ${fmt(g)} ${fmt(b)} rg`,
        `/${bold ? 'F2' : 'F1'} ${fmt(size)} Tf`,
      ];
      if (style.letterSpacing) parts.push(`${fmt(style.letterSpacing)} Tc`);
      parts.push(`1 0 0 1 ${fmt(drawX)} ${fmt(height - y)} Tm`);
      parts.push(`(${escapeText(ascii)}) Tj`);
      if (style.letterSpacing) parts.push('0 Tc');
      parts.push('ET');
      pages[current].push(parts.join('\n'));
      return api;
    },

    /**
     * Draw wrapped text and return the y position just below it.
     * @returns {number} the y of the next free line
     */
    paragraph(text, x, y, maxWidth, style = {}) {
      const size = style.size ?? 10;
      const leading = style.leading ?? size * 1.45;
      const lines = wrapText(text, maxWidth, size, !!style.bold);
      lines.forEach((line, i) => {
        api.text(line, x, y + i * leading, { ...style, align: style.align, width: maxWidth });
      });
      return y + lines.length * leading;
    },

    /**
     * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
     * @param {{width?: number, color?: [number, number, number], dash?: number}} [style]
     */
    line(x1, y1, x2, y2, style = {}) {
      const [r, g, b] = style.color ?? [0, 0, 0];
      const parts = [`${fmt(r)} ${fmt(g)} ${fmt(b)} RG`, `${fmt(style.width ?? 0.75)} w`];
      if (style.dash) parts.push(`[${fmt(style.dash)} ${fmt(style.dash)}] 0 d`);
      parts.push(`${fmt(x1)} ${fmt(height - y1)} m`, `${fmt(x2)} ${fmt(height - y2)} l`, 'S');
      if (style.dash) parts.push('[] 0 d');
      pages[current].push(parts.join('\n'));
      return api;
    },

    /**
     * @param {number} x @param {number} y @param {number} w @param {number} h
     * @param {{fill?: [number, number, number], stroke?: [number, number, number], lineWidth?: number}} [style]
     */
    rect(x, y, w, h, style = {}) {
      const parts = [];
      if (style.fill) parts.push(`${fmt(style.fill[0])} ${fmt(style.fill[1])} ${fmt(style.fill[2])} rg`);
      if (style.stroke) {
        parts.push(`${fmt(style.stroke[0])} ${fmt(style.stroke[1])} ${fmt(style.stroke[2])} RG`);
        parts.push(`${fmt(style.lineWidth ?? 0.75)} w`);
      }
      parts.push(`${fmt(x)} ${fmt(height - y - h)} ${fmt(w)} ${fmt(h)} re`);
      parts.push(style.fill && style.stroke ? 'B' : style.fill ? 'f' : 'S');
      pages[current].push(parts.join('\n'));
      return api;
    },

    /** Serialise the document to PDF bytes. */
    toBytes() {
      const objects = [];
      const pageCount = pages.length;
      // 1 catalog, 2 pages, then per page: page object + content stream,
      // then the two fonts.
      const pageObjIds = pages.map((_, i) => 3 + i * 2);
      const contentObjIds = pages.map((_, i) => 4 + i * 2);
      const fontRegularId = 3 + pageCount * 2;
      const fontBoldId = fontRegularId + 1;

      objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
      objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`;

      pages.forEach((ops, i) => {
        const content = ops.join('\n');
        objects[pageObjIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(width)} ${fmt(height)}] `
          + `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> `
          + `/Contents ${contentObjIds[i]} 0 R >>`;
        objects[contentObjIds[i]] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
      });

      objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

      const maxId = fontBoldId;
      let out = '%PDF-1.4\n';
      /** @type {number[]} byte offset of each object, indexed by object number */
      const offsets = [];
      for (let id = 1; id <= maxId; id += 1) {
        offsets[id] = out.length;
        out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
      }

      const xrefOffset = out.length;
      out += `xref\n0 ${maxId + 1}\n`;
      out += '0000000000 65535 f \n';
      for (let id = 1; id <= maxId; id += 1) {
        out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
      }
      out += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      // Every byte written above is ASCII, so one char is one byte and the
      // offsets recorded from string positions are correct.
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i += 1) bytes[i] = out.charCodeAt(i) & 0xff;
      return bytes;
    },

    /** The document as a Blob ready to download or preview. */
    toBlob() {
      return new Blob([api.toBytes()], { type: 'application/pdf' });
    },
  };

  return api;
}
