// Seeded catalogue for the General Register Office certificate services.
//
// GRO works differently from the other two groups. The registration itself —
// of a birth, a death or a marriage — is done inside the GRO by its own staff,
// and it yields a registration number. A citizen never fills in a registration
// form here; they hold a registration number and use it to follow the request
// and collect the certificate.
//
// So these services carry no `sections`/`fields`: the apply engine is not used.
// The GRO flow asks for the registration number, looks it up, shows the status,
// and — once the registration is approved — renders the certificate, offers the
// PDF and files a copy in that citizen's Vault.

/** @type {import('../types').Service[]} */
export const GRO_SERVICES = [
  {
    id: 'svc_gro_birth',
    slug: 'birth-certificate',
    name: 'Birth certificate',
    group: 'gro',
    agencyId: 'gro',
    icon: 'baby',
    summary: 'Collect a certified copy of a birth registered with the General Register Office.',
    overview:
      'Births are registered at the General Register Office — at the hospital, at a district registry, or by the informant in person. '
      + 'Registration produces a registration number. Once you have that number you do not need to visit an office again: enter it here '
      + 'to see exactly where the registration has reached, and, once it is approved, view and download your certified copy. '
      + 'A copy is filed in your Vault automatically, where only you can see it.',
    steps: [
      'The birth is registered at the GRO and a registration number is issued to the informant.',
      'You enter that registration number here.',
      'We show you the status of the registration and who is holding it.',
      'When it is approved, the certificate is generated and shown to you.',
      'You download the PDF, and a copy is filed in your Vault.',
    ],
    eligibilityRuleIds: ['identityVerified'],
    eligibilityNotes: [
      'You need the registration number issued when the birth was registered.',
      'A certificate can be collected by the person named on it, a parent, or a legal guardian.',
      'Where the registration is linked to a National ID, only that citizen can collect it here.',
    ],
    prerequisites: [
      {
        id: 'registrationNumber',
        label: 'Your registration number',
        detail:
          'Issued by the GRO when the birth was registered, in the form B/GT/2019/004512. '
          + 'It is on the registration slip the informant was given.',
        issuedBy: 'General Register Office',
        evidenceRequired: true,
        evidenceLabel: 'Registration number',
      },
    ],
    sections: [],
    fields: [],
    documents: [],
    timeframeDays: 5,
    timeframeNote: 'A registration that is already approved produces a certificate immediately. One still in verification is normally completed within five working days.',
    sortOrder: 30,
    active: true,
  },

  {
    id: 'svc_gro_death',
    slug: 'death-certificate',
    name: 'Death certificate',
    group: 'gro',
    agencyId: 'gro',
    icon: 'file-text',
    summary: 'Collect a certified copy of a death registered with the General Register Office.',
    overview:
      'A death is registered at the General Register Office by the informant, normally within seven days, and registration produces a '
      + 'registration number. Enter that number here to follow the registration and, once it is approved, to view and download the '
      + 'certified copy. Banks, insurers and the courts all accept the certified copy. A copy is filed in your Vault, visible only to you.',
    steps: [
      'The death is registered at the GRO and a registration number is issued to the informant.',
      'You enter that registration number here.',
      'We show you the status of the registration and who is holding it.',
      'When it is approved, the certificate is generated and shown to you.',
      'You download the PDF, and a copy is filed in your Vault.',
    ],
    eligibilityRuleIds: ['identityVerified'],
    eligibilityNotes: [
      'You need the registration number issued when the death was registered.',
      'A certificate is normally collected by the informant or a next of kin.',
      'Where the registration is linked to a National ID, only that citizen can collect it here.',
    ],
    prerequisites: [
      {
        id: 'registrationNumber',
        label: 'Your registration number',
        detail:
          'Issued by the GRO when the death was registered, in the form D/EC/2024/001188. '
          + 'It is on the registration slip the informant was given.',
        issuedBy: 'General Register Office',
        evidenceRequired: true,
        evidenceLabel: 'Registration number',
      },
    ],
    sections: [],
    fields: [],
    documents: [],
    timeframeDays: 5,
    timeframeNote: 'A registration that is already approved produces a certificate immediately. One still in verification is normally completed within five working days.',
    sortOrder: 31,
    active: true,
  },

  {
    id: 'svc_gro_marriage',
    slug: 'marriage-certificate',
    name: 'Marriage certificate',
    group: 'gro',
    agencyId: 'gro',
    icon: 'heart-handshake',
    summary: 'Collect a certified copy of a marriage registered with the General Register Office.',
    overview:
      'The marriage officer returns the register to the General Register Office after the ceremony, and the GRO registers it and issues '
      + 'a registration number. Enter that number here to follow the registration and, once it is approved, to view and download the '
      + 'certified copy — the document you need for a name change, a joint account, or a spousal visa. '
      + 'A copy is filed in your Vault, visible only to you.',
    steps: [
      'The marriage officer returns the register and the GRO issues a registration number.',
      'You enter that registration number here.',
      'We show you the status of the registration and who is holding it.',
      'When it is approved, the certificate is generated and shown to you.',
      'You download the PDF, and a copy is filed in your Vault.',
    ],
    eligibilityRuleIds: ['identityVerified'],
    eligibilityNotes: [
      'You need the registration number issued when the marriage was registered.',
      'A certificate can be collected by either party to the marriage.',
      'Where the registration is linked to a National ID, only that citizen can collect it here.',
    ],
    prerequisites: [
      {
        id: 'registrationNumber',
        label: 'Your registration number',
        detail:
          'Issued by the GRO when the marriage was registered, in the form M/GT/2021/000734. '
          + 'It is on the registration slip given after the ceremony.',
        issuedBy: 'General Register Office',
        evidenceRequired: true,
        evidenceLabel: 'Registration number',
      },
    ],
    sections: [],
    fields: [],
    documents: [],
    timeframeDays: 5,
    timeframeNote: 'A registration that is already approved produces a certificate immediately. One still in verification is normally completed within five working days.',
    sortOrder: 32,
    active: true,
  },
];

/**
 * Standard and expedited handling, per certificate type. The View screen shows
 * both tiers and the citizen picks one before the certificate is generated.
 * @type {import('../types').ServiceFee[]}
 */
export const GRO_FEES = [
  { id: 'fee_gro_birth_std', serviceId: 'svc_gro_birth', code: 'GRO-B-STD', label: 'Standard certified copy', amountGyd: 1000, kind: 'standard', mandatory: true, note: 'Ready within five working days.' },
  { id: 'fee_gro_birth_exp', serviceId: 'svc_gro_birth', code: 'GRO-B-EXP', label: 'Expedited certified copy', amountGyd: 3500, kind: 'expedited', mandatory: false, note: 'Ready the same working day where the registration is already approved.' },

  { id: 'fee_gro_death_std', serviceId: 'svc_gro_death', code: 'GRO-D-STD', label: 'Standard certified copy', amountGyd: 1000, kind: 'standard', mandatory: true, note: 'Ready within five working days.' },
  { id: 'fee_gro_death_exp', serviceId: 'svc_gro_death', code: 'GRO-D-EXP', label: 'Expedited certified copy', amountGyd: 3500, kind: 'expedited', mandatory: false, note: 'Ready the same working day where the registration is already approved.' },

  { id: 'fee_gro_marriage_std', serviceId: 'svc_gro_marriage', code: 'GRO-M-STD', label: 'Standard certified copy', amountGyd: 1500, kind: 'standard', mandatory: true, note: 'Ready within five working days.' },
  { id: 'fee_gro_marriage_exp', serviceId: 'svc_gro_marriage', code: 'GRO-M-EXP', label: 'Expedited certified copy', amountGyd: 4000, kind: 'expedited', mandatory: false, note: 'Ready the same working day where the registration is already approved.' },
];

/** Only the GRO reviews a GRO registration — a single-agency route. */
/** @type {import('../types').ServiceRoute[]} */
export const GRO_ROUTES = [
  { id: 'route_gro_birth', serviceId: 'svc_gro_birth', agencyId: 'gro', sequence: 1, role: 'lead', slaDays: 5, purpose: 'Verifies the register entry and certifies the copy.' },
  { id: 'route_gro_death', serviceId: 'svc_gro_death', agencyId: 'gro', sequence: 1, role: 'lead', slaDays: 5, purpose: 'Verifies the register entry and certifies the copy.' },
  { id: 'route_gro_marriage', serviceId: 'svc_gro_marriage', agencyId: 'gro', sequence: 1, role: 'lead', slaDays: 5, purpose: 'Verifies the register entry and certifies the copy.' },
];

/** Which service a registration type belongs to. */
export const GRO_SERVICE_BY_TYPE = {
  birth: 'svc_gro_birth',
  death: 'svc_gro_death',
  marriage: 'svc_gro_marriage',
};
