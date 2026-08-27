// What the government record itself puts in a citizen's Vault.
//
// These two builders live here rather than on the Vault screen because two
// things need them: the screen that lists the Vault, and the matcher that
// answers "is this document already in my Vault?" for every application form.
// Keeping one copy is what stops those two disagreeing.

function formatLong(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// CARDS & IDS — the identity cards government holds for this citizen.
export function buildCards(persona, user) {
  const gov = user?.gov || {};
  const cards = [];
  if (gov.driversLicence) {
    cards.push({ id: 'licence', icon: 'car', bg: '#b91c1c', title: "Driver's licence", sub: 'Guyana Police Force · expires 2029' });
  }
  if (gov.nationalId || persona.nationalId) {
    cards.push({ id: 'national-id', icon: 'id-card', bg: '#8b2346', title: 'National ID', sub: `${gov.nationalId || persona.nationalId} · expires 2027` });
  }
  if (persona.connectedAgencies.includes('nis') && persona.nisAccountState === 'active') {
    cards.push({ id: 'nis-card', icon: 'shield-check', bg: '#00674c', title: 'NIS card', sub: 'National Insurance Scheme · Active', overlay: 'nisCard' });
  }
  return cards;
}

// DOCUMENTS & RECORDS — certificates and letters issued by agencies.
// (No contribution statement here — that lives in the NIS hub.)
export function buildRecords(persona, user) {
  const docs = [];
  if (user?.gov) {
    docs.push({ id: 'birth', icon: 'file-text', title: 'Birth certificate', sub: 'General Register Office · certified copy' });
  }
  if (persona.eidStatus === 'issued') {
    docs.push({ id: 'eid-letter', icon: 'badge-check', title: 'e-ID issuance letter', sub: 'Digital Identity Card Registry · 6 Aug 2026' });
  }
  if (persona.nisEmployer?.registeredOn) {
    docs.push({ id: 'nis-reg', icon: 'shield-check', title: 'NIS registration certificate', sub: `National Insurance Scheme · ${formatLong(persona.nisEmployer.registeredOn)}` });
  }
  return docs;
}
