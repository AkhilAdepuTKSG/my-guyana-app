// Static copy/content for the auth mega-flow — mirrors the arrays and
// lookup maps the source built inline in its render-state object. Kept
// separate from AuthFlow.jsx so the state machine stays readable.

export const GOV_ID_AGENCY = {
  'e-ID': 'the Digital Identity Card Registry',
  TIN: 'the Guyana Revenue Authority',
  'National ID': 'GECOM',
  Passport: 'the Immigration Department',
  "Driver's licence": 'the Guyana Police Force',
};
export function govIdAgencyFor(type) {
  return GOV_ID_AGENCY[type] || 'the issuing agency';
}

export const GOV_ID_TYPES = [
  { id: 'National ID', label: 'National ID', hint: 'The GECOM card you vote with', icon: 'id-card' },
  { id: 'Passport', label: 'Passport', hint: 'Your Guyana passport', icon: 'book-user' },
  { id: "Driver's licence", label: "Driver's licence", hint: 'Issued by the Guyana Police Force', icon: 'car' },
  { id: 'TIN', label: 'TIN', hint: 'Your tax number, on any GRA letter', icon: 'receipt' },
  { id: 'e-ID', label: 'e-ID', hint: 'The card from the Digital Identity Card Registry — tap it instead of typing', icon: 'fingerprint' },
];

export const GOV_ID_PLACEHOLDER = {
  'e-ID': 'e.g. GUY-04471-0928', TIN: 'e.g. 1234-5678', 'National ID': 'e.g. 884 213 004',
  Passport: 'e.g. R0123456', "Driver's licence": 'e.g. DL-884213',
};
export const GOV_ID_TITLE = {
  'e-ID': 'Your e-ID number', TIN: 'Your TIN', 'National ID': 'Your National ID number',
  Passport: 'Your passport number', "Driver's licence": 'Your licence number',
};

export const EID_FAIL_TIPS = [
  { icon: 'credit-card', label: 'Take the card out of a wallet or case — other cards block the read.' },
  { icon: 'smartphone', label: 'Hold it against the upper half of the back of the phone.' },
  { icon: 'timer', label: 'Keep it still for about five seconds. Moving it cancels the read.' },
];

export const POL_TIPS = [
  { icon: 'sun', label: 'Somewhere with a bit of light' },
  { icon: 'glasses', label: 'No hat, no sunglasses' },
  { icon: 'smartphone', label: 'Hold the phone at eye level' },
];

export const CONSENT_ITEMS = [
  { id: 'name', label: 'Full name' },
  { id: 'dob', label: 'Date of birth' },
  { id: 'id', label: 'National ID number' },
  { id: 'photo', label: 'Photo, for identity verification' },
];

export const MANUAL_COUNTRIES = [
  { value: '', label: 'Select country…' }, { value: 'gy', label: 'Guyana' },
  { value: 'tt', label: 'Trinidad and Tobago' }, { value: 'bb', label: 'Barbados' },
  { value: 'sr', label: 'Suriname' }, { value: 'br', label: 'Brazil' }, { value: 'other', label: 'Another country' },
];
export const MANUAL_GENDERS = [
  { value: '', label: 'Select gender…' }, { value: 'f', label: 'Female' },
  { value: 'm', label: 'Male' }, { value: 'x', label: 'Prefer not to say' },
];
export const DOC_TYPES = [
  { value: '', label: 'Select document type…' }, { value: 'birth', label: 'Birth certificate' },
  { value: 'passport', label: 'Passport' }, { value: 'natid', label: 'National ID card' },
  { value: 'nat', label: 'Naturalisation certificate' },
];

export const RECOVERY_REASONS = [
  { id: 'wrong', icon: 'pencil', title: 'I typed the wrong number or email', sub: 'Correct it and we send a new code' },
  { id: 'noarrive', icon: 'inbox', title: "The code hasn't arrived", sub: 'Send it again, or send it somewhere else' },
  { id: 'lost', icon: 'phone-off', title: 'I lost access to that phone or email', sub: 'Prove who you are another way' },
  { id: 'other', icon: 'circle-help', title: 'Something else', sub: 'Get help from a person' },
];

export const RECOVERY_FIX_COPY = {
  wrong: { title: 'Fix your number or email', sub: 'Go back and type it again. Nothing has been sent to the wrong place.' },
  noarrive: { title: 'Let us try again', sub: 'Codes can take a minute on a weak signal, and email codes sometimes land in spam.' },
  lost: { title: 'Prove it is you another way', sub: 'Your card or your face can stand in for the code. A service centre is the last resort.' },
  other: { title: 'Get help', sub: 'Tell us what happened and someone will help you get in.' },
};

export function formatDob(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
