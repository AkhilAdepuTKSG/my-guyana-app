// The old age pension's own arithmetic: how old someone is, when they may
// apply, and what they are entitled to.
//
// Every number this works from arrives as configuration (the `service_config`
// rows seeded in src/data/seed/servicesMhsss.js) — the qualifying age, the
// six-week apply window, the residency thresholds, the monthly benefit. Nothing
// here decides what the scheme pays or who qualifies; it only applies whatever
// the Ministry has configured.
//
// It is pure and shared on purpose. The eligibility gate on the apply screen
// and the check the endpoint runs at submit are the same function, so the
// citizen is never told they qualify and then refused, or the reverse.

/** What the scheme falls back to if a config row is ever missing. */
const DEFAULTS = {
  minAgeYears: 65,
  applyWindowWeeks: 6,
  residencyYears: 10,
  activeResidencyYears: 2,
  immigrationReportFromAge: 66,
  monthlyBenefitGyd: 0,
  transportGrantGyd: 0,
  processingWeeks: 6,
};

/**
 * Read a service's configuration with the defaults filled in.
 * @param {import('../data/types').Service|{config?: Record<string, number|string>}|null} service
 * @returns {typeof DEFAULTS}
 */
export function pensionConfig(service) {
  const cfg = service?.config || {};
  /** @type {any} */
  const out = { ...DEFAULTS };
  Object.keys(DEFAULTS).forEach((key) => {
    const value = Number(cfg[key]);
    if (Number.isFinite(value)) out[key] = value;
  });
  return out;
}

/** Parse a `YYYY-MM-DD` into a local Date at midnight, or null. */
function parseDate(value) {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Midnight today, so every comparison here is date-to-date. */
function startOfToday(at) {
  const d = at ? new Date(at) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Whole years completed between two dates — how age is actually counted, not a
 * division by 365.25 that drifts a day either side of a birthday.
 * @param {string|Date} dob
 * @param {Date} [at]
 * @returns {number|null}
 */
export function ageInYears(dob, at) {
  const born = dob instanceof Date ? dob : parseDate(dob);
  if (!born) return null;
  const on = at || startOfToday();
  let years = on.getFullYear() - born.getFullYear();
  const monthDiff = on.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < born.getDate())) years -= 1;
  return years;
}

/** The date somebody born on `dob` reaches `age`. */
export function birthdayAt(dob, age) {
  const born = parseDate(dob);
  if (!born) return null;
  return new Date(born.getFullYear() + age, born.getMonth(), born.getDate());
}

/** `YYYY-MM-DD` for a Date, in local terms. */
export function isoDate(date) {
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Assess one applicant against the configured scheme.
 *
 * Age and the apply window are objective — they come from the date of birth and
 * the calendar. Residency cannot be: nothing in the app knows how long somebody
 * has lived in Guyana, so it is declared on the form and checked against the
 * configured thresholds here, and the declaration is what the Ministry verifies.
 *
 * @param {{
 *   service?: import('../data/types').Service|null,
 *   config?: Record<string, number|string>,
 *   dob?: string|null,
 *   fields?: Record<string, string>,
 *   at?: Date|number|string
 * }} args
 * @returns {{
 *   ok: boolean,
 *   ageOk: boolean,
 *   residencyOk: boolean,
 *   age: number|null,
 *   qualifiesOn: string|null,
 *   opensOn: string|null,
 *   daysUntilOpen: number|null,
 *   requiresImmigrationReport: boolean,
 *   reasons: string[],
 *   config: typeof DEFAULTS
 * }}
 */
export function assessPension({ service, config, dob, fields = {}, at } = {}) {
  const cfg = pensionConfig(service || { config });
  const today = startOfToday(at);
  const reasons = [];

  const dateOfBirth = dob || fields.dob || null;
  const age = ageInYears(dateOfBirth, today);
  const qualifies = birthdayAt(dateOfBirth, cfg.minAgeYears);
  // Applications open a configured number of weeks before the qualifying
  // birthday, so the first payment is ready on the day it is due.
  const opens = qualifies
    ? new Date(qualifies.getFullYear(), qualifies.getMonth(), qualifies.getDate() - cfg.applyWindowWeeks * 7)
    : null;
  const daysUntilOpen = opens ? Math.ceil((opens.getTime() - today.getTime()) / 86400000) : null;

  let ageOk = false;
  if (age === null || !opens) {
    reasons.push('We need your date of birth to work out whether you qualify.');
  } else if (today < opens) {
    ageOk = false;
    reasons.push(
      `You can apply from ${formatLongDate(opens)} — ${cfg.applyWindowWeeks} weeks before your `
      + `${ordinal(cfg.minAgeYears)} birthday on ${formatLongDate(qualifies)}.`
    );
  } else {
    ageOk = true;
  }

  // Residency: only checked once the citizen has answered. An unanswered form
  // is incomplete, not ineligible — the form's own validation handles that.
  const years = numberOrNull(fields.yearsInGuyana);
  const activeYears = numberOrNull(fields.activeResidentYears);
  let residencyOk = true;
  if (years !== null && years < cfg.residencyYears) {
    residencyOk = false;
    reasons.push(`The pension requires at least ${cfg.residencyYears} years lived in Guyana; you have entered ${years}.`);
  }
  if (activeYears !== null && activeYears < cfg.activeResidencyYears) {
    residencyOk = false;
    reasons.push(`At least ${cfg.activeResidencyYears} of those years must be as an active resident; you have entered ${activeYears}.`);
  }
  if (years !== null && activeYears !== null && activeYears > years) {
    residencyOk = false;
    reasons.push('Your years as an active resident cannot be more than the years you have lived in Guyana.');
  }
  if (fields.ordinarilyResident !== undefined && String(fields.ordinarilyResident) !== 'true') {
    residencyOk = false;
    reasons.push('The pension is for people ordinarily resident in Guyana.');
  }

  return {
    ok: ageOk && residencyOk,
    ageOk,
    residencyOk,
    age,
    qualifiesOn: isoDate(qualifies),
    opensOn: isoDate(opens),
    daysUntilOpen,
    requiresImmigrationReport: needsImmigrationReport({ config: cfg, age, fields }),
    reasons,
    config: cfg,
  };
}

/**
 * Does this applicant have to produce an immigration report?
 *
 * Only a first-time applicant at or over the configured age: somebody who has
 * drawn the pension before is already on the Ministry's books, and somebody
 * applying on time has no gap to account for.
 * @param {{config: typeof DEFAULTS, age: number|null, fields?: Record<string, string>}} args
 */
export function needsImmigrationReport({ config, age, fields = {} }) {
  if (age === null) return false;
  if (fields.firstTimeApplicant !== 'yes') return false;
  return age >= config.immigrationReportFromAge;
}

/**
 * What an approved application is worth, from the configured rates.
 * @param {import('../data/types').Service|{config?: Record<string, number|string>}} service
 */
export function pensionAward(service) {
  const cfg = pensionConfig(service);
  return {
    monthlyGyd: cfg.monthlyBenefitGyd,
    transportGrantGyd: cfg.transportGrantGyd,
    firstYearGyd: cfg.monthlyBenefitGyd * 12 + cfg.transportGrantGyd,
  };
}

function numberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** `12 April 2026` — how the rest of the app writes a date in prose. */
export function formatLongDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
}
