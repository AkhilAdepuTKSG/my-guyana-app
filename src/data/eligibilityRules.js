// Eligibility rules, keyed by id.
//
// A rule is a function, so it cannot live in the database — the seeded service
// record stores rule *ids* and this registry resolves them. Every rule reads
// only the signed-in citizen's real state (session, government record, their
// existing applications); nothing here asks the citizen to self-declare.
//
// Shape: { id, passLabel, failLabel, failHint?, failAction?, passes(ctx) }
// ctx = { user, persona, applications }

/** @type {Record<string, {
 *   id: string,
 *   passLabel: string,
 *   failLabel: string,
 *   failHint?: string,
 *   failAction?: {label: string, overlay?: string, screen?: string, payload?: unknown},
 *   passes: (ctx: {user: any, persona: any, applications: any[]}) => boolean
 * }>} */
export const ELIGIBILITY_RULES = {
  identityVerified: {
    id: 'identityVerified',
    passLabel: 'Your identity is verified',
    failLabel: 'Your identity is not verified yet',
    failHint: 'Applications are matched against your government record — confirm your identity from your profile first.',
    failAction: { label: 'Confirm my identity', overlay: 'idv', payload: { purpose: 'sensitive' } },
    passes: ({ user, persona }) => !!(persona?.verified || user?.verificationLevel === 'verified'),
  },

  hasGovRecord: {
    id: 'hasGovRecord',
    passLabel: 'You are on record as a citizen resident in Guyana',
    failLabel: 'We could not match you to a government record',
    failHint: 'Verify your identity so your record can be matched.',
    passes: ({ user }) => !!user?.gov,
  },

  noOpenCashGrant: {
    id: 'noOpenCashGrant',
    passLabel: 'No cash grant application on file — one grant per person',
    failLabel: 'You already have a cash grant application',
    failHint: 'One grant per person per cycle. Track your existing application instead.',
    failAction: { label: 'View my applications', screen: 'applications' },
    passes: ({ applications }) => !(applications || []).some(
      (a) => a.group === 'cashGrants' && !['rejected', 'withdrawn'].includes(a.status)
    ),
  },

  adult: {
    id: 'adult',
    passLabel: 'You are 18 or older',
    failLabel: 'You must be 18 or older to apply',
    failHint: 'A parent or guardian can apply on your behalf at a service centre.',
    passes: ({ user, persona }) => {
      const dob = user?.gov?.dob || persona?.dob;
      if (!dob) return false;
      const born = new Date(`${dob}T00:00:00`);
      if (Number.isNaN(born.getTime())) return false;
      const age = (Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18;
    },
  },

  // Single Window: the whole system assumes the applicant already holds land.
  // The proof itself is captured as a prerequisite on the form; this rule only
  // checks that the citizen has an identity we can attach the parcel to.
  canHoldLand: {
    id: 'canHoldLand',
    passLabel: 'You can be recorded as the applicant on a land parcel',
    failLabel: 'We need a verified identity before a parcel can be linked to you',
    failHint: 'Land-development approvals are recorded against your verified identity.',
    failAction: { label: 'Confirm my identity', overlay: 'idv', payload: { purpose: 'sensitive' } },
    passes: ({ user, persona }) => !!(persona?.verified || user?.verificationLevel === 'verified'),
  },
};

/**
 * Resolve a service's seeded rule ids into evaluated rules.
 * @param {string[]} ruleIds
 * @param {{user: any, persona: any, applications: any[]}} ctx
 */
export function evaluateEligibility(ruleIds, ctx) {
  return (ruleIds || [])
    .map((id) => ELIGIBILITY_RULES[id])
    .filter(Boolean)
    .map((rule) => ({ ...rule, ok: !!rule.passes(ctx) }));
}
