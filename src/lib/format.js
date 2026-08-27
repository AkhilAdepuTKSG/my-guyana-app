// Shared display formatting. Kept in one place so a date or an amount reads the
// same on the View screen, in the apply flow, on the tracker and in the Vault.

/**
 * Guyanese dollars, as they are written on a fee schedule.
 * @param {number} amount
 * @param {{free?: string}} [opts] what to show for zero
 */
export function formatGyd(amount, opts = {}) {
  const value = Number(amount) || 0;
  if (value === 0 && opts.free) return opts.free;
  return `$${value.toLocaleString('en-GY')}`;
}

/** `12 Aug 2026` — the app's standard short date. */
export function formatDate(value) {
  if (!value) return '';
  const iso = String(value).slice(0, 10);
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `12 August 2026` — for certificates and formal copy. */
export function formatLongDate(value) {
  if (!value) return '';
  const iso = String(value).slice(0, 10);
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "Today", "Yesterday", or the short date. */
export function formatRelativeDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return formatDate(value);
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return formatDate(value);
}

/** `30 days` / `about 6 weeks` — how a published timeframe is read out. */
export function formatTimeframe(days) {
  const n = Number(days) || 0;
  if (n <= 0) return 'No published timeframe';
  if (n < 14) return `${n} days`;
  if (n % 7 === 0) return `about ${n / 7} weeks`;
  return `about ${Math.round(n / 7)} weeks`;
}

/** `2.4 MB` / `620 KB` — attachment sizes. */
export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/**
 * The value of a field, written the way the citizen chose it — a select or
 * radio shows its label, not its stored value.
 * @param {import('../data/types').FieldDef} field
 * @param {string} value
 */
export function displayFieldValue(field, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (field.type === 'checkbox') return value === 'true' ? 'Confirmed' : 'Not confirmed';
  if (field.type === 'select' || field.type === 'radio') {
    return field.options?.find((o) => o.value === value)?.label || String(value);
  }
  if (field.type === 'date') return formatDate(value);
  if (field.type === 'number') return Number(value).toLocaleString('en-GY');
  return String(value);
}

/** Trigger a browser download of a Blob under a given filename. */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
