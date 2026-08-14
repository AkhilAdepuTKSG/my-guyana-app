// Mock/reference data for the e-ID application flow, ported from the
// prototype's eid* renderVals. All copy is invented placeholder data.

export const EID_ABOUT_TABS = [
  { value: 'why', label: 'Why it matters' },
  { value: 'elig', label: 'Am I eligible?' },
  { value: 'bring', label: 'Requirements' },
];

export const EID_BENEFITS = [
  { icon: 'shield-check', title: 'Prove who you are', sub: 'Biometric identity that works online and at the counter' },
  { icon: 'landmark', title: 'One key to government', sub: 'Apply and register without repeating your details' },
  { icon: 'pen-tool', title: 'Sign digitally', sub: 'Authenticate documents and transactions securely' },
];

export const EID_HOW_STEPS = [
  { n: '1', title: 'Apply here', sub: 'A few questions and your documents' },
  { n: '2', title: 'Visit a Service Centre', sub: 'Originals checked, biometrics captured' },
  { n: '3', title: 'Your card is produced', sub: 'DICR delivers it to your Centre' },
  { n: '4', title: 'Collect it', sub: "We'll notify you here when it's ready" },
];

export const EID_ELIGIBILITY = {
  icon: 'check-circle-2', color: 'var(--status-success)', bg: 'var(--status-success-bg)',
  label: 'You appear eligible', sub: 'You are on record as a Guyanese citizen with no e-ID issued.',
};

export const EID_REQUIREMENTS = [
  { icon: 'badge-check', text: 'You are a citizen by birth, marriage, registration, naturalisation or adoption', state: 'met' },
  { icon: 'file-text', text: 'Original documents in English — anything else must be certified in translation', state: 'pending' },
  { icon: 'map-pin', text: 'Proof of address dated within the last 3 months', state: 'pending' },
  { icon: 'fingerprint', text: 'Photo, signature and fingerprints captured at the Service Centre', state: 'visit' },
].map((r) => ({
  ...r,
  badgeIcon: r.state === 'met' ? 'check' : r.state === 'visit' ? 'triangle-alert' : 'minus',
  badgeColor: r.state === 'met' ? 'var(--status-success)' : r.state === 'visit' ? 'var(--status-warning)' : 'var(--fg-3)',
  badgeBg: r.state === 'met' ? 'var(--status-success-bg)' : r.state === 'visit' ? 'var(--status-warning-bg)' : 'var(--surface-4)',
  badgeSub: r.state === 'met' ? 'Met' : r.state === 'visit' ? 'In person' : 'Pending',
}));

export const EID_BRING_PATHS = [
  { label: 'Born in Guyana', doc: 'Birth certificate' },
  { label: 'Born abroad', doc: 'Form F' },
  { label: 'Marriage / registration', doc: 'Certificate of Registration' },
  { label: 'Naturalisation', doc: 'Certificate of Naturalisation' },
  { label: 'Adoption', doc: 'Adoption Certificate' },
];

export const EID_CITIZENSHIP_OPTIONS = [
  { id: 'birth', label: 'By birth in Guyana', hint: 'Born on Guyanese soil' },
  { id: 'abroad', label: 'Born abroad to Guyanese parents', hint: 'Needs Form F from the General Register Office' },
  { id: 'registration', label: 'By marriage or registration', hint: 'Certificate of Registration from Home Affairs' },
  { id: 'naturalisation', label: 'By naturalisation', hint: 'Section 9 of the Guyana Citizenship Act' },
  { id: 'adoption', label: 'By adoption in Guyana', hint: 'Adoption certificate from the General Register Office' },
];

const EID_PHOTO_ID = {
  id: 'photo-id', label: 'Guyana passport or GECOM identification card', icon: 'credit-card',
  issuer: 'Immigration · GECOM', hint: 'Valid, in your current name',
};

const EID_PRIMARY_DOCS = {
  birth: [{ id: 'birth-cert', label: 'Guyana birth certificate', icon: 'file-text', issuer: 'General Register Office', hint: 'Original only — foreign certificates are not accepted' }, EID_PHOTO_ID],
  abroad: [{ id: 'form-f', label: 'Form F', icon: 'file-text', issuer: 'General Register Office', hint: 'Replaces a foreign birth certificate' }, EID_PHOTO_ID],
  registration: [{ id: 'cert-registration', label: 'Certificate of Registration', icon: 'file-badge', issuer: 'Ministry of Home Affairs', hint: 'Citizenship by marriage or section 4' }, EID_PHOTO_ID],
  naturalisation: [{ id: 'cert-naturalisation', label: 'Certificate of Naturalisation', icon: 'file-badge', issuer: 'Ministry of Home Affairs', hint: 'Section 9, Guyana Citizenship Act' }, EID_PHOTO_ID],
  adoption: [{ id: 'adoption-cert', label: 'Adoption Certificate', icon: 'file-badge', issuer: 'General Register Office', hint: 'For citizenship acquired through adoption' }, EID_PHOTO_ID],
};

export function buildEidDocDefs(citizenship) {
  const primary = EID_PRIMARY_DOCS[citizenship] || EID_PRIMARY_DOCS.birth;
  return [
    ...primary,
    { id: 'address', label: 'Proof of address', icon: 'map-pin', issuer: 'Dated within 3 months', hint: "Bill, bank statement or stamped envelope — a driver's licence works at any date" },
    { id: 'namechange', label: 'Name-change document', icon: 'file-signature', issuer: 'Only if your name changed', isOptional: true, hint: 'Marriage certificate, deed poll or affidavit' },
  ];
}

export const EID_TIME_OPTIONS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM'];

export function buildEidDateOptions() {
  const opts = [];
  const cursor = new Date();
  while (opts.length < 8) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) continue;
    const iso = cursor.toISOString().slice(0, 10);
    const idxHash = (cursor.getDate() * 7 + cursor.getMonth()) % 5;
    opts.push({
      iso,
      dayAbbr: cursor.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateNum: cursor.getDate(),
      isFull: idxHash === 0,
    });
  }
  return opts;
}

export function formatEidDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
