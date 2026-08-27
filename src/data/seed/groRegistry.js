// The General Register Office register.
//
// These rows stand for registrations created inside the GRO by its own staff —
// a citizen never writes to this store, they only look a row up by its
// registration number. Seeding them is what makes the citizen-facing lookup
// real: the number a citizen holds resolves to an actual register entry with an
// actual status, and only an `approved` one produces a certificate.
//
// `claimNationalId` is the entitlement check. Where it is set, only that
// citizen may collect the certificate here; where it is null, anyone holding
// the registration number may. Two rows are deliberately tied to the demo
// government records in src/state/govRegistry.js:
//   • Nicole Persaud — N1234567890
//   • John Doe       — N0987654321
//
// Registration numbers follow the GRO's printed form:
//   <TYPE>/<DISTRICT>/<YEAR>/<SERIAL>   e.g. B/GT/1990/004512
// Lookup is normalised, so spacing, dashes and case do not matter.

/** @type {import('../types').GroRegistration[]} */
export const GRO_REGISTRATION_SEED = [
  // ---------------------------------------------------------------- births
  {
    id: 'groreg_b_nicole',
    regNo: 'B/GT/1990/004512',
    type: 'birth',
    status: 'approved',
    registryDistrict: 'Georgetown',
    registeredAt: '1990-04-19',
    approvedAt: '1990-04-26',
    rejectionReason: null,
    claimNationalId: 'N1234567890',
    record: {
      childName: 'Nicole Amanda Persaud',
      sex: 'Female',
      dateOfBirth: '1990-04-12',
      placeOfBirth: 'Georgetown Public Hospital, Georgetown',
      motherName: 'Sandra Persaud',
      motherMaidenName: 'Sandra Ramkissoon',
      fatherName: 'Devendra Persaud',
      informant: 'Sandra Persaud (mother)',
    },
  },
  {
    id: 'groreg_b_john',
    regNo: 'B/NA/1985/002187',
    type: 'birth',
    status: 'approved',
    registryDistrict: 'New Amsterdam',
    registeredAt: '1985-10-08',
    approvedAt: '1985-10-15',
    rejectionReason: null,
    claimNationalId: 'N0987654321',
    record: {
      childName: 'John Michael Doe',
      sex: 'Male',
      dateOfBirth: '1985-09-30',
      placeOfBirth: 'New Amsterdam Hospital, New Amsterdam',
      motherName: 'Patricia Doe',
      motherMaidenName: 'Patricia Semple',
      fatherName: 'Michael Doe',
      informant: 'Michael Doe (father)',
    },
  },
  {
    id: 'groreg_b_open',
    regNo: 'B/EC/2024/009341',
    type: 'birth',
    status: 'approved',
    registryDistrict: 'East Coast Demerara',
    registeredAt: '2024-06-11',
    approvedAt: '2024-06-18',
    rejectionReason: null,
    claimNationalId: null,
    record: {
      childName: 'Amara Joy Fraser',
      sex: 'Female',
      dateOfBirth: '2024-06-02',
      placeOfBirth: 'Georgetown Public Hospital, Georgetown',
      motherName: 'Kaydene Fraser',
      motherMaidenName: 'Kaydene Alleyne',
      fatherName: 'Terrence Fraser',
      informant: 'Kaydene Fraser (mother)',
    },
  },
  {
    id: 'groreg_b_verifying',
    regNo: 'B/GT/2026/001204',
    type: 'birth',
    status: 'verification',
    registryDistrict: 'Georgetown',
    registeredAt: '2026-08-14',
    approvedAt: null,
    rejectionReason: null,
    claimNationalId: null,
    record: {
      childName: 'Elijah Nathaniel Bacchus',
      sex: 'Male',
      dateOfBirth: '2026-08-03',
      placeOfBirth: 'Georgetown Public Hospital, Georgetown',
      motherName: 'Rehanna Bacchus',
      motherMaidenName: 'Rehanna Khan',
      fatherName: 'Andre Bacchus',
      informant: 'Rehanna Bacchus (mother)',
    },
  },
  {
    id: 'groreg_b_received',
    regNo: 'B/WD/2026/000876',
    type: 'birth',
    status: 'received',
    registryDistrict: 'West Demerara',
    registeredAt: '2026-08-24',
    approvedAt: null,
    rejectionReason: null,
    claimNationalId: null,
    record: {
      childName: 'Sarah Indira Persaud',
      sex: 'Female',
      dateOfBirth: '2026-08-20',
      placeOfBirth: 'West Demerara Regional Hospital, Vreed-en-Hoop',
      motherName: 'Anjali Persaud',
      motherMaidenName: 'Anjali Narine',
      fatherName: 'Rajesh Persaud',
      informant: 'Anjali Persaud (mother)',
    },
  },

  // ---------------------------------------------------------------- deaths
  {
    id: 'groreg_d_approved',
    regNo: 'D/EC/2024/001188',
    type: 'death',
    status: 'approved',
    registryDistrict: 'East Coast Demerara',
    registeredAt: '2024-11-05',
    approvedAt: '2024-11-12',
    rejectionReason: null,
    claimNationalId: null,
    record: {
      deceasedName: 'Devendra Persaud',
      sex: 'Male',
      dateOfDeath: '2024-10-29',
      placeOfDeath: 'Georgetown Public Hospital, Georgetown',
      ageAtDeath: 71,
      causeOfDeath: 'Natural causes — certified by Dr. A. Mohabir',
      informant: 'Nicole Persaud (daughter)',
    },
  },
  {
    id: 'groreg_d_registered',
    regNo: 'D/GT/2026/000455',
    type: 'death',
    status: 'registered',
    registryDistrict: 'Georgetown',
    registeredAt: '2026-08-19',
    approvedAt: null,
    rejectionReason: null,
    claimNationalId: null,
    record: {
      deceasedName: 'Ivelaw Anthony Grant',
      sex: 'Male',
      dateOfDeath: '2026-08-15',
      placeOfDeath: 'Lot 4 Sheriff Street, Georgetown',
      ageAtDeath: 68,
      causeOfDeath: 'Certified by the attending medical practitioner',
      informant: 'Denise Grant (spouse)',
    },
  },
  {
    id: 'groreg_d_rejected',
    regNo: 'D/CB/2026/000091',
    type: 'death',
    status: 'rejected',
    registryDistrict: 'Corentyne, Berbice',
    registeredAt: '2026-07-30',
    approvedAt: null,
    rejectionReason:
      'The medical certificate of cause of death does not match the name on the register entry. '
      + 'The informant must return to the Corentyne district registry with the original certificate.',
    claimNationalId: null,
    record: {
      deceasedName: 'Baldeo Singh',
      sex: 'Male',
      dateOfDeath: '2026-07-22',
      placeOfDeath: 'Port Mourant Hospital, Corentyne',
      ageAtDeath: 79,
      causeOfDeath: 'Pending — certificate under query',
      informant: 'Ramesh Singh (son)',
    },
  },

  // ------------------------------------------------------------- marriages
  {
    id: 'groreg_m_approved',
    regNo: 'M/GT/2021/000734',
    type: 'marriage',
    status: 'approved',
    registryDistrict: 'Georgetown',
    registeredAt: '2021-02-22',
    approvedAt: '2021-03-01',
    rejectionReason: null,
    claimNationalId: null,
    record: {
      partyOneName: 'Nicole Amanda Persaud',
      partyTwoName: 'Marcus Everton Chase',
      dateOfMarriage: '2021-02-14',
      placeOfMarriage: 'St. George\'s Cathedral, Georgetown',
      officiant: 'Rev. Colin Fraser, Marriage Officer',
      witnessOne: 'Sandra Persaud',
      witnessTwo: 'Alicia Chase',
    },
  },
  {
    id: 'groreg_m_nicole',
    regNo: 'M/EB/2023/000512',
    type: 'marriage',
    status: 'approved',
    registryDistrict: 'East Bank Demerara',
    registeredAt: '2023-09-18',
    approvedAt: '2023-09-25',
    rejectionReason: null,
    claimNationalId: 'N1234567890',
    record: {
      partyOneName: 'Nicole Amanda Persaud',
      partyTwoName: 'Rajiv Anand Sukhu',
      dateOfMarriage: '2023-09-09',
      placeOfMarriage: 'Diamond Community Centre, East Bank Demerara',
      officiant: 'Pandit S. Persaud, Marriage Officer',
      witnessOne: 'Devendra Persaud',
      witnessTwo: 'Meena Sukhu',
    },
  },
  {
    id: 'groreg_m_verifying',
    regNo: 'M/ESS/2026/000148',
    type: 'marriage',
    status: 'verification',
    registryDistrict: 'Essequibo',
    registeredAt: '2026-08-11',
    approvedAt: null,
    rejectionReason: null,
    claimNationalId: null,
    record: {
      partyOneName: 'Shanice Marie Adams',
      partyTwoName: 'Dwayne Oswald History',
      dateOfMarriage: '2026-08-01',
      placeOfMarriage: 'Anna Regina Magistrate\'s Court, Essequibo',
      officiant: 'Ms. J. Persaud, Marriage Officer',
      witnessOne: 'Carol Adams',
      witnessTwo: 'Leon History',
    },
  },
];

/**
 * Normalise a typed registration number so spacing, dashes, slashes and case
 * never matter: `b gt 1990 004512`, `B-GT-1990-004512` and `B/GT/1990/004512`
 * all resolve to the same register entry.
 * @param {string} value
 * @returns {string}
 */
export function normaliseRegNo(value) {
  return String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
