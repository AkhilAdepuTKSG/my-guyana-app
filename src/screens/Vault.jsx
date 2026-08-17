import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import ListRow from '../components/ui/ListRow';
import NotificationBell from '../components/ui/NotificationBell';

// Invented locally — mockData.js has no eID number field.
const EID_NUMBER = 'GUY-0447-1029';

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

  if (persona.connectedAgencies.includes('gpl') && persona.gpl) {
    cards.push({
      id: 'gpl', key: null, title: 'Electricity account', sub: 'Guyana Power & Light', icon: 'zap',
      bg: 'linear-gradient(160deg, #2d2e67 0%, #404293 60%, #2d2e67 100%)', subFg: 'rgba(255,255,255,0.75)',
      holder: persona.name, number: persona.gpl.account,
      statusLabel: 'Linked', statusBg: 'rgba(255,255,255,0.2)',
      foot: `G$ ${persona.gpl.balance.toLocaleString()} due ${persona.gpl.dueDate}`,
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

export default function Vault() {
  const { navigate, openOverlay, persona, showToast } = useAppState();
  const cards = buildWalletCards(persona);
  const docs = buildDocuments(persona);
  const empty = cards.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, color: 'var(--fg-3)', marginTop: 2 }}>Your IDs, cards and documents</div>
      </div>

      {empty && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          padding: '34px 20px', border: '1px dashed var(--surface-border)', borderRadius: 20, background: 'var(--surface-1)',
        }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wallet" size={21} color="var(--fg-3)" />
          </span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>Nothing here yet</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 250 }}>
            Cards and IDs land here as you use government services. Start with your e-ID at MoPS.
          </p>
        </div>
      )}

      {!empty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map((card) => (
            <WalletCard
              key={card.id}
              card={card}
              onOpen={() => (card.key ? openOverlay(card.key) : navigate('gpl'))}
            />
          ))}
        </div>
      )}

      {docs.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="ds-eyebrow" style={{ fontSize: 12, margin: 0 }}>Documents</h2>
        <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
          {docs.map((d, i) => (
            <ListRow
              key={d.label}
              icon={d.icon}
              iconColor="var(--fg-2)"
              iconBg="var(--surface-2)"
              title={d.label}
              subtitle={d.sub}
              onClick={() => showToast(`${d.label} — coming soon`)}
              style={{ borderBottom: i < docs.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px' }}
            />
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
