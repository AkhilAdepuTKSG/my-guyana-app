// Field validation, driven by the seeded field definitions.
//
// One implementation runs everywhere: section gating in the apply flow, the
// save-draft call, and the final submit. A screen never re-implements a rule —
// it renders whatever `validateFields` returns.

/**
 * Is a field visible, given what has been answered so far? A hidden field is
 * never required and its value is never submitted.
 * @param {import('../data/types').FieldDef} field
 * @param {Record<string, string>} values
 * @returns {boolean}
 */
export function isFieldVisible(field, values) {
  const cond = field.showIf;
  if (!cond) return true;
  const actual = values?.[cond.field];
  if (Array.isArray(cond.equals)) return cond.equals.includes(actual);
  return actual === cond.equals;
}

/** The fields that are actually being asked for right now. */
export function visibleFields(fields, values) {
  return (fields || []).filter((f) => isFieldVisible(f, values));
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/**
 * Validate one field's value against its definition.
 * @param {import('../data/types').FieldDef} field
 * @param {string} rawValue
 * @returns {string|null} the message to show, or null when the value is fine
 */
export function validateField(field, rawValue) {
  const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);

  if (field.type === 'checkbox') {
    if (field.required && value !== 'true') {
      return field.validate?.message || 'You need to tick this to continue.';
    }
    return null;
  }

  if (isBlank(value)) {
    return field.required ? `${field.label} is required.` : null;
  }

  const rules = field.validate;
  const fail = (fallback) => rules?.message || fallback;

  if (field.type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return fail('Enter a number.');
    if (rules?.min !== undefined && n < rules.min) return fail(`Enter ${rules.min} or more.`);
    if (rules?.max !== undefined && n > rules.max) return fail(`Enter ${rules.max} or less.`);
    return null;
  }

  if (field.type === 'date') {
    const t = new Date(`${value}T00:00:00`).getTime();
    if (Number.isNaN(t)) return fail('Enter a valid date.');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (rules?.date === 'past' && t >= today.getTime()) return fail('That date must be in the past.');
    if (rules?.date === 'future' && t <= today.getTime()) return fail('That date must be in the future.');
    if (rules?.date === 'notFuture' && t > today.getTime()) return fail('That date cannot be in the future.');
    return null;
  }

  if (field.type === 'email') {
    const pattern = rules?.pattern || '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';
    if (!new RegExp(pattern).test(value)) return fail('Enter a valid email address.');
    return null;
  }

  if (rules?.pattern && !new RegExp(rules.pattern).test(value)) {
    return fail('That does not look right — check it and try again.');
  }
  if (rules?.min !== undefined && value.trim().length < rules.min) {
    return fail(`Enter at least ${rules.min} characters.`);
  }
  if (rules?.max !== undefined && value.trim().length > rules.max) {
    return fail(`Keep it to ${rules.max} characters or fewer.`);
  }

  return null;
}

/**
 * Validate every visible field, optionally narrowed to one section.
 * @param {import('../data/types').FieldDef[]} fields
 * @param {Record<string, string>} values
 * @param {{sectionId?: string}} [opts]
 * @returns {{ok: boolean, errors: Record<string, string>}}
 */
export function validateFields(fields, values, opts = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  visibleFields(fields, values)
    .filter((f) => !opts.sectionId || f.sectionId === opts.sectionId)
    .forEach((f) => {
      const message = validateField(f, values?.[f.key]);
      if (message) errors[f.key] = message;
    });
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Check the documents an application asks for. A required document that is
 * hidden by a field condition is not enforced — the caller narrows the list
 * before calling.
 * @param {import('../data/types').DocumentDef[]} defs
 * @param {Record<string, {status: string}>} attached
 * @returns {{ok: boolean, missing: string[]}}
 */
export function validateDocuments(defs, attached) {
  const missing = (defs || [])
    .filter((d) => d.required)
    .filter((d) => !['attached', 'fromVault'].includes(attached?.[d.id]?.status))
    .map((d) => d.label);
  return { ok: missing.length === 0, missing };
}

/**
 * Check the prerequisites the citizen has to confirm. Each must be ticked, and
 * one marked `evidenceRequired` must also carry a reference number.
 * @param {import('../data/types').PrerequisiteDef[]} defs
 * @param {Record<string, {confirmed: boolean, reference?: string}>} answers
 * @returns {{ok: boolean, errors: Record<string, string>}}
 */
export function validatePrerequisites(defs, answers) {
  /** @type {Record<string, string>} */
  const errors = {};
  (defs || []).forEach((p) => {
    const a = answers?.[p.id];
    if (!a?.confirmed) {
      errors[p.id] = 'Confirm you hold this before continuing.';
      return;
    }
    if (p.evidenceRequired && isBlank(a.reference)) {
      errors[p.id] = `Enter your ${(p.evidenceLabel || 'reference').toLowerCase()}.`;
    }
  });
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * A typed error the endpoints throw so screens can show the real message
 * instead of a generic failure.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {Record<string, unknown>} [details]
   */
  constructor(message, code = 'invalid', details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}
