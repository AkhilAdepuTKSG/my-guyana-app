import { useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useApi, useUserId } from '../hooks/useApi';
import { listDocuments, vaultDateLabel } from '../api/vault';
import { loadCertificateForVault } from '../api/gro';
import { renderCertificatePdf, certificateFileName } from '../lib/certificates';
import { downloadBlob } from '../lib/format';
import Icon from '../components/ui/Icon';
import ListRow from '../components/ui/ListRow';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';
import NotificationBell from '../components/ui/NotificationBell';

// The Vault, per the Final design: opening it asks for a one-time code in a
// bottom sheet ("Vault access · Verify it's you"); once open it shows the e-ID
// card, then CARDS & IDS (driver's licence, National ID, NIS card) and
// DOCUMENTS & RECORDS (birth certificate, e-ID issuance letter, NIS
// registration certificate, plus anything the citizen stored). Everything is
// derived from the government record and connected agencies — nothing is
// invented per screen.

// The kinds of document a citizen can store in their Vault (DigiLocker-style).
const DOC_TYPES = [
  { id: 'national-id', label: 'National ID', icon: 'id-card' },
  { id: 'passport', label: 'Passport', icon: 'book-user' },
  { id: 'licence', label: "Driver's licence", icon: 'car' },
  { id: 'birth-cert', label: 'Birth certificate', icon: 'file-text' },
  { id: 'certificate', label: 'Certificate', icon: 'file-badge' },
  { id: 'other', label: 'Other document', icon: 'file' },
];

// Display fallback only — e-ID number format as issued by MoPS (backlog 1.1).
const EID_NUMBER = '123-4567-8901';

// Documents are REQUESTED from the issuing agency, never uploaded by the
// citizen: if the record exists in their name, the agency issues a digital
// copy into the Vault. The upload path is kept in code behind this flag.
const ALLOW_UPLOADS = false;
const DOC_ISSUERS = {
  'national-id': 'GECOM',
  passport: 'the Immigration Department',
  licence: 'the Guyana Police Force',
  'birth-cert': 'the General Register Office',
  certificate: 'the issuing agency',
  other: 'the issuing agency',
};

function formatLong(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// The e-ID card — the one big card at the top of the Vault.
function EidWalletCard({ persona, onOpen }) {
  const issued = persona.eidStatus === 'issued';
  return (
    <button
      className="press focus-ring"
      onClick={onOpen}
      aria-label="e-ID"
      style={{
        width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        borderRadius: 22, padding: 18, background: 'var(--hero-navy-gradient)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="fingerprint" size={17} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800 }}>e-ID</span>
          <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Digital Identity Card Registry</span>
        </span>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: issued ? 'rgba(31,138,91,0.5)' : 'rgba(255,255,255,0.16)', color: '#fff' }}>
          {issued ? 'Active' : 'In progress'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{persona.name}</span>
          <span style={{ display: 'block', marginTop: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>ID</span>
          <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{persona.eidNo || EID_NUMBER}</span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 999, border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-right" size={17} color="#fff" />
        </span>
      </div>
      <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>
        {issued ? 'Issued 6 Aug 2026 · valid to 2036' : 'Verification in progress'}
      </span>
    </button>
  );
}

// CARDS & IDS — the identity cards government holds for this citizen.
function buildCards(persona, user) {
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
function buildRecords(persona, user) {
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

function formatAdded(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Vault() {
  const { navigate, openOverlay, persona, showToast, user, vaultDocs, addVaultDoc, removeVaultDoc, requireOtp, addNotification } = useAppState();
  const cards = buildCards(persona, user);
  const records = buildRecords(persona, user);

  // Documents filed against this citizen's own account by the services: the
  // GRO certificates they collected, and anything an application attached.
  // Read by userId, so nobody else's ever appear — see src/api/vault.js.
  const userId = useUserId();
  const issued = useApi(() => listDocuments(userId), [userId], { enabled: !!userId, initial: [] });
  const issuedDocs = issued.data || [];

  // A certificate is redrawn from the register entry on demand rather than
  // stored as bytes, so what downloads is always the current document.
  const openIssued = async (doc) => {
    if (doc.content?.generator === 'groCertificate') {
      const { certificate, registration } = await loadCertificateForVault(doc.content.args);
      const blob = renderCertificatePdf({ certificate, registration, issuedTo: doc.content.args.issuedTo || user?.name || null });
      downloadBlob(blob, certificateFileName(certificate));
      showToast('Certificate downloaded');
      return;
    }
    if (doc.blob) {
      const url = URL.createObjectURL(doc.blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }
    showToast(doc.issuedBy ? `${doc.title} — issued by ${doc.issuedBy}` : doc.title);
  };
  const fileRef = useRef(null);
  const otpChannel = user?.gov?.phoneMasked || '••• ••• 4820';

  // The Vault is locked every time it's opened — a one-time code, asked for in a
  // bottom sheet, is required before any cards or documents are shown.
  const [unlocked, setUnlocked] = useState(false);
  const [askingCode, setAskingCode] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const [adding, setAdding] = useState(false);
  const [docType, setDocType] = useState('national-id');
  const [docLabel, setDocLabel] = useState('');
  const [fileName, setFileName] = useState('');

  const resetForm = () => { setDocType('national-id'); setDocLabel(''); setFileName(''); };

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    if (!docLabel.trim()) setDocLabel(file.name.replace(/\.[^.]+$/, ''));
  };

  const saveDoc = () => {
    const typeDef = DOC_TYPES.find((t) => t.id === docType) || DOC_TYPES[DOC_TYPES.length - 1];
    const label = docLabel.trim() || typeDef.label;
    if (!fileName) { showToast('Attach a file or photo to store'); return; }
    addVaultDoc({ label, typeId: typeDef.id, typeLabel: typeDef.label, icon: typeDef.icon, fileName });
    setAdding(false);
    resetForm();
    showToast(`${label} added to your Vault`);
  };

  // Request the document from its issuing agency: confirmed with a one-time
  // code, then — when the record exists in the citizen's name — a digital copy
  // is issued straight into the Vault.
  const requestDoc = () => {
    const typeDef = DOC_TYPES.find((t) => t.id === docType) || DOC_TYPES[DOC_TYPES.length - 1];
    const label = docLabel.trim() || typeDef.label;
    const issuer = DOC_ISSUERS[typeDef.id] || 'the issuing agency';
    requireOtp({
      title: 'Confirm your request',
      confirmLabel: 'Request document',
      onConfirm: () => {
        setAdding(false);
        resetForm();
        if (!user?.gov) {
          showToast('No record was found in your name — confirm your identity first');
          return;
        }
        showToast(`Requested — ${issuer} is checking your record`);
        setTimeout(() => {
          addVaultDoc({ label, typeId: typeDef.id, typeLabel: typeDef.label, icon: typeDef.icon, fileName: 'Issued digital copy' });
          addNotification({
            agency: 'mops', icon: 'file-check-2',
            title: `${label} is in your Vault`,
            body: `${issuer.charAt(0).toUpperCase() + issuer.slice(1)} confirmed your record and issued a digital copy.`,
          });
        }, 1600);
      },
    });
  };

  const unlockVault = () => {
    if (otp.replace(/\D/g, '').length < 6) { setOtpError('Enter the 6-digit code we sent you.'); return; }
    if (otp === '000000') { setOtpError('That code is wrong. Check it and try again.'); return; }
    setOtpError(''); setUnlocked(true); setAskingCode(false);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button
          className="press focus-ring"
          onClick={() => navigate('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, minHeight: 38, padding: '0 14px 0 9px',
            borderRadius: 999, background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
            color: 'var(--fg-1)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name="chevron-left" size={18} color="var(--fg-1)" />Home
        </button>
        <div style={{ flex: 1 }} />
        <NotificationBell size={44} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Vault</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-3)', marginTop: 2 }}>Your IDs, cards and documents</div>
    </div>
  );

  const eyebrow = { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)' };

  // Locked — the code sheet sits over the Vault; behind it only the header and
  // a locked placeholder show.
  if (!unlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {header}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '36px 20px', borderRadius: 20, border: '1px dashed var(--surface-border)', background: 'var(--surface-1)' }}>
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={24} color="var(--brand-700)" />
          </span>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--fg-1)' }}>Your Vault is protected</p>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 280 }}>A one-time code opens your cards and documents.</p>
          {!askingCode && <Button onClick={() => { setOtp(''); setOtpError(''); setAskingCode(true); }}>Open Vault</Button>}
        </div>

        <Sheet open={askingCode} onClose={() => setAskingCode(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-1)' }}>
                  <Icon name="shield-check" size={13} />Vault access
                </span>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Verify it&apos;s you</h2>
                <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>Sent to {otpChannel}</span>
              </div>
              <button
                className="press focus-ring" onClick={() => setAskingCode(false)} aria-label="Close"
                style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="x" size={17} />
              </button>
            </div>
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="go" placeholder="000000" autoFocus
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') unlockVault(); }}
              aria-label="One-time code"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 62, padding: '13px 15px', borderRadius: 14,
                border: `1px solid ${otpError ? 'var(--status-error)' : 'var(--surface-border)'}`, background: 'var(--surface-2)',
                fontFamily: 'inherit', fontSize: 26, fontWeight: 800, letterSpacing: '0.36em', textIndent: '0.36em', textAlign: 'center', color: 'var(--fg-1)', outline: 'none',
              }}
            />
            {otpError && (
              <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--status-error)' }}>
                <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{otpError}
              </p>
            )}
            <Button fullWidth onClick={unlockVault}>Verify and open Vault</Button>
            <button
              className="press focus-ring"
              onClick={() => { setOtp(''); setOtpError(''); showToast('New code sent'); }}
              style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 14, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', minHeight: 38, fontFamily: 'inherit' }}
            >
              Resend code
            </button>
          </div>
        </Sheet>
      </div>
    );
  }

  const listCard = { border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' };
  const rowStyle = (last) => ({ borderBottom: last ? 'none' : '1px solid var(--surface-hairline)', padding: '14px 14px' });
  const selIssuer = DOC_ISSUERS[docType] || 'the issuing agency';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {header}

      {persona.eidStatus !== 'none' && (
        <EidWalletCard persona={persona} onOpen={() => openOverlay('eidCard')} />
      )}

      {cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={eyebrow}>Cards &amp; IDs</h2>
          <div style={listCard}>
            {cards.map((c, i) => (
              <ListRow
                key={c.id}
                icon={c.icon}
                iconColor="#fff"
                iconBg={c.bg}
                title={c.title}
                subtitle={c.sub}
                chevron={false}
                onClick={() => (c.overlay ? openOverlay(c.overlay) : showToast(`${c.title} — issued by government`))}
                style={rowStyle(i === cards.length - 1)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ ...eyebrow, flex: 1, minWidth: 0 }}>Documents &amp; records</h2>
          <button
            className="press focus-ring"
            onClick={() => { resetForm(); setAdding(true); }}
            aria-label={ALLOW_UPLOADS ? 'Add a document' : 'Request a document'}
            style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 32, padding: '0 12px', border: '1px solid var(--surface-border)', borderRadius: 999, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="plus" size={14} />{ALLOW_UPLOADS ? 'Add' : 'Request'}
          </button>
        </div>

        {records.length === 0 && vaultDocs.length === 0 && issuedDocs.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
            padding: '30px 20px', border: '1px dashed var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)',
          }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="folder-lock" size={20} color="var(--fg-3)" />
            </span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>No documents yet</p>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 250 }}>
              Your IDs and certificates gather here. Tap <b>{ALLOW_UPLOADS ? 'Add' : 'Request'}</b> to ask the issuing agency for one, or they arrive as you use government services.
            </p>
          </div>
        ) : (
          <div style={listCard}>
            {records.map((d, i) => (
              <ListRow
                key={d.id}
                icon={d.icon}
                iconColor="var(--fg-1)"
                iconBg="var(--surface-2)"
                title={d.title}
                subtitle={d.sub}
                chevron={false}
                onClick={() => showToast(`${d.title} — issued by government`)}
                style={rowStyle(i === records.length - 1 && vaultDocs.length === 0 && issuedDocs.length === 0)}
              />
            ))}
            {vaultDocs.map((d, i) => (
              <ListRow
                key={d.id}
                icon={d.icon || 'file'}
                iconColor="var(--brand-600)"
                iconBg="var(--brand-100)"
                title={d.label}
                subtitle={`${d.typeLabel || 'Document'} · added ${formatAdded(d.addedOn)}`}
                chevron={false}
                trailing={(
                  <button
                    className="press focus-ring"
                    onClick={(e) => { e.stopPropagation(); removeVaultDoc(d.id); showToast(`${d.label} removed`); }}
                    aria-label={`Remove ${d.label}`}
                    style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: 'none', background: 'var(--surface-2)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name="trash-2" size={15} />
                  </button>
                )}
                style={rowStyle(i === vaultDocs.length - 1 && issuedDocs.length === 0)}
              />
            ))}
            {/* Filed by a service against this citizen's account — GRO
                certificates they collected, and application attachments. */}
            {issuedDocs.map((d, i) => (
              <ListRow
                key={d.id}
                icon={d.icon || 'file-badge'}
                iconColor={d.source === 'government' ? 'var(--status-success)' : 'var(--brand-600)'}
                iconBg={d.source === 'government' ? 'var(--status-success-bg)' : 'var(--brand-100)'}
                title={d.title}
                subtitle={`${d.subtitle} · ${vaultDateLabel(d.addedAt)}`}
                chevron={false}
                onClick={() => openIssued(d)}
                trailing={(
                  <button
                    className="press focus-ring"
                    onClick={(e) => { e.stopPropagation(); openIssued(d); }}
                    aria-label={`${d.content?.generator ? 'Download' : 'Open'} ${d.title}`}
                    style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: 'none', background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name={d.content?.generator ? 'download' : 'eye'} size={15} />
                  </button>
                )}
                style={rowStyle(i === issuedDocs.length - 1)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title={ALLOW_UPLOADS ? 'Add a document' : 'Request a document'}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFilePicked} style={{ display: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!ALLOW_UPLOADS && (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              Nothing is uploaded — we ask the issuing agency for it. If the document exists in your name, a digital copy lands in your Vault.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Document type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DOC_TYPES.map((t) => {
                const active = docType === t.id;
                return (
                  <button
                    key={t.id} className="press focus-ring" onClick={() => setDocType(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 13px', borderRadius: 999,
                      border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--brand-100)' : 'var(--surface-1)', color: active ? 'var(--brand-700)' : 'var(--fg-1)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Icon name={t.icon} size={15} color={active ? 'var(--brand-700)' : 'var(--fg-3)'} />{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Name (optional)</label>
            <input
              value={docLabel} onChange={(e) => setDocLabel(e.target.value)} placeholder="e.g. My birth certificate"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)', fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none' }}
            />
          </div>

          {ALLOW_UPLOADS ? (
            <button
              className="press focus-ring" onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '12px 14px', borderRadius: 14, border: `1.5px dashed ${fileName ? 'var(--status-success)' : 'var(--surface-border)'}`, background: fileName ? 'var(--status-success-bg)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <Icon name={fileName ? 'check-circle-2' : 'upload'} size={18} color={fileName ? 'var(--status-success)' : 'var(--fg-3)'} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || 'Upload a file or photo'}</span>
                <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{fileName ? 'Tap to choose a different file' : 'JPG, PNG or PDF'}</span>
              </span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
              <Icon name="building-2" size={16} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                This request goes to <b>{selIssuer}</b>. We confirm it&apos;s you with a one-time code first.
              </span>
            </div>
          )}

          {ALLOW_UPLOADS
            ? <Button fullWidth onClick={saveDoc}>Save to Vault</Button>
            : <Button fullWidth onClick={requestDoc}>Request document</Button>}
        </div>
      </Sheet>
    </div>
  );
}
