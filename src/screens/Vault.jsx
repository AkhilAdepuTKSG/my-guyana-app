import { useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import ListRow from '../components/ui/ListRow';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';
import NotificationBell from '../components/ui/NotificationBell';

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

function buildWalletCards(persona) {
  const cards = [];

  if (persona.eidStatus !== 'none') {
    const issued = persona.eidStatus === 'issued';
    cards.push({
      id: 'eid', key: 'eidCard', title: 'e-ID', sub: 'Digital Identity Card Registry', icon: 'fingerprint',
      bg: 'var(--hero-navy-gradient)', subFg: 'rgba(255,255,255,0.7)',
      holder: persona.name, number: persona.eidNo || EID_NUMBER,
      statusLabel: issued ? 'Active' : 'In progress',
      statusBg: issued ? 'rgba(31,138,91,0.28)' : 'rgba(255,255,255,0.16)',
      foot: issued ? 'Issued 6 Aug 2026 · valid to 2036' : 'Verification in progress',
    });
  }

  if (persona.connectedAgencies.includes('nis') && persona.nisAccountState !== 'none') {
    cards.push({
      id: 'nis', key: 'nisCard', title: 'NIS card', sub: 'National Insurance Scheme', icon: 'shield-check',
      bg: 'linear-gradient(160deg, #00764f 0%, #009b67 55%, #006c48 100%)', subFg: 'rgba(255,255,255,0.75)',
      holder: persona.name, number: persona.nisNumber,
      statusLabel: 'Active', statusBg: 'rgba(255,255,255,0.2)',
      foot: `${persona.contributions.weeks} contributions on record`,
    });
  }

  return cards;
}

function buildDocuments(persona) {
  // A brand-new account has no documents on file. They appear as the citizen
  // gains a verified identity and connects agencies.
  const docs = [];
  if (persona.eidStatus === 'issued') {
    docs.push({ icon: 'id-card', label: 'National ID', sub: `${persona.nationalId || EID_NUMBER} · expires 2027` });
    docs.push({ icon: 'file-text', label: 'Birth certificate', sub: 'Registrar General · certified copy' });
    docs.push({ icon: 'badge-check', label: 'e-ID issuance letter', sub: 'DICR · 6 Aug 2026' });
  }
  if (persona.connectedAgencies.includes('nis') && persona.nisAccountState !== 'none') {
    docs.push({ icon: 'file-check-2', label: 'NIS contribution statement', sub: 'Issued 12 Jan 2026' });
  }
  return docs;
}

function WalletCard({ card, onOpen }) {
  return (
    <button
      className="press focus-ring"
      onClick={onOpen}
      aria-label={card.title}
      style={{
        width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        borderRadius: 22, padding: 18, background: card.bg, color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span aria-hidden="true" style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={card.icon} size={17} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800 }}>{card.title}</span>
          <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: card.subFg }}>{card.sub}</span>
        </span>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: card.statusBg, color: '#fff' }}>
          {card.statusLabel}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.holder}</span>
          <span style={{ display: 'block', marginTop: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: card.subFg }}>ID</span>
          <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{card.number}</span>
        </span>
        <span aria-hidden="true" style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,0.28)',
          background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="chevron-right" size={16} color="#fff" />
        </span>
      </div>
      <span style={{ display: 'block', fontSize: 12.5, color: card.subFg }}>{card.foot}</span>
    </button>
  );
}

function formatAdded(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Vault() {
  const { navigate, openOverlay, persona, showToast, user, vaultDocs, addVaultDoc, removeVaultDoc } = useAppState();
  const cards = buildWalletCards(persona);
  const builtDocs = buildDocuments(persona);
  const fileRef = useRef(null);
  const otpChannel = user?.gov?.phoneMasked || '••• ••• 4820';

  // The Vault is locked every time it's opened — a one-time code is required
  // before any cards or documents are shown (and, therefore, before anything
  // can be added).
  const [unlocked, setUnlocked] = useState(false);
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

  const noCards = cards.length === 0;
  const noDocs = builtDocs.length === 0 && vaultDocs.length === 0;

  const unlockVault = () => {
    if (otp.replace(/\D/g, '').length < 6) { setOtpError('Enter the 6-digit code we sent you.'); return; }
    if (otp === '000000') { setOtpError('That code is wrong. Check it and try again.'); return; }
    setOtpError(''); setUnlocked(true);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          className="press focus-ring"
          onClick={() => navigate('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, minHeight: 36, padding: '0 12px 0 8px',
            borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--surface-border)',
            color: 'var(--fg-1)', fontSize: 'var(--text-xs)', fontWeight: 700,
          }}
        >
          <Icon name="chevron-left" size={18} color="var(--fg-1)" />Home
        </button>
        <div style={{ flex: 1 }} />
        <NotificationBell size={40} />
      </div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Vault</div>
      <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, color: 'var(--fg-3)', marginTop: 2 }}>Your IDs, cards and documents — all in one secure place</div>
    </div>
  );

  // Locked — verify with a one-time code before anything in the Vault is shown.
  if (!unlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {header}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '24px 18px', borderRadius: 20, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)' }}>
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={24} color="var(--brand-700)" />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Your Vault is protected</h2>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              Enter the one-time code we sent to {otpChannel} to open your cards and documents.
            </p>
          </div>
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="go" placeholder="000000"
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') unlockVault(); }}
            aria-label="One-time code"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 54, padding: '13px 15px', borderRadius: 13,
              border: `1.5px solid ${otpError ? 'var(--status-error)' : 'var(--surface-border)'}`, background: 'var(--surface-2)',
              fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.35em', textAlign: 'center', color: 'var(--fg-1)', outline: 'none',
            }}
          />
          {otpError && (
            <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--status-error)' }}>
              <Icon name="triangle-alert" size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />{otpError}
            </p>
          )}
          <Button fullWidth onClick={unlockVault} icon={<Icon name="lock-open" size={17} color="#fff" />}>Unlock Vault</Button>
          <button
            className="press focus-ring"
            onClick={() => { setOtp(''); setOtpError(''); showToast('New code sent'); }}
            style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, fontFamily: 'inherit' }}
          >
            Send a new code
          </button>
          <p style={{ margin: 0, textAlign: 'center', fontSize: 11, lineHeight: 1.5, color: 'var(--fg-4)' }}>Demo: any six digits open the Vault. Type 000000 to see the error.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {header}

      {!noCards && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map((card) => (
            <WalletCard key={card.id} card={card} onOpen={() => card.key && openOverlay(card.key)} />
          ))}
        </div>
      )}

      {/* Documents — DigiLocker-style store of IDs, certificates and files. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 className="ds-eyebrow" style={{ flex: 1, minWidth: 0, fontSize: 12, margin: 0 }}>Documents</h2>
          <button
            className="press focus-ring"
            onClick={() => { resetForm(); setAdding(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 32, padding: '0 12px', border: 'none', borderRadius: 999, background: 'var(--brand-600)', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="plus" size={14} color="#fff" />Add
          </button>
        </div>

        {noDocs ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
            padding: '30px 20px', border: '1px dashed var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)',
          }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="folder-lock" size={20} color="var(--fg-3)" />
            </span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>No documents yet</p>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 250 }}>
              Store your IDs and certificates here. Tap <b>Add</b> to save one, or they arrive as you use government services.
            </p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
            {builtDocs.map((d, i) => (
              <ListRow
                key={`built-${d.label}`}
                icon={d.icon}
                iconColor="var(--fg-2)"
                iconBg="var(--surface-2)"
                title={d.label}
                subtitle={d.sub}
                onClick={() => showToast(`${d.label} — issued by government`)}
                style={{ borderBottom: (i < builtDocs.length - 1 || vaultDocs.length > 0) ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px' }}
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
                style={{ borderBottom: i < vaultDocs.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px' }}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a document">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFilePicked} style={{ display: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

          <Button fullWidth onClick={saveDoc}>Save to Vault</Button>
        </div>
      </Sheet>
    </div>
  );
}
