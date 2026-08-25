import { useMemo, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { REGIONS } from '../../state/mockData';

// Invented locally — mockData.js has no eID number field. Kept in sync with
// the literal used on the Vault wallet card.
// MoPS 3-5-4 e-ID format — the confirmed standard (backlog 1.1).
const EID_NUMBER = 'GUY-04471-0928';

// Deterministic QR-look grid: three finder squares (corners) + pseudo-random
// fill elsewhere, ported from the prototype's own generator. Not a real,
// scannable code — a visual stand-in only.
function buildQrCells() {
  const N = 21;
  const cells = [];
  const inFinder = (r, c) => {
    const q = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return q(0, 0) || q(0, N - 7) || q(N - 7, 0);
  };
  const finderOn = (r, c) => {
    const lr = r < 7 ? r : r - (N - 7);
    const lc = c < 7 ? c : c - (N - 7);
    const ring = Math.max(Math.abs(lr - 3), Math.abs(lc - 3));
    return ring === 3 || ring <= 1;
  };
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) { cells.push(finderOn(r, c) ? '#0a1424' : 'transparent'); continue; }
      const h = (Math.imul(r * 73856093 ^ c * 19349663, 2654435761) >>> 11);
      cells.push((h % 100) < 47 ? '#0a1424' : 'transparent');
    }
  }
  return cells;
}

function formatDob(dob) {
  if (!dob) return 'Not on file';
  return new Date(`${dob}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EidCard() {
  const { isOpen, closeOverlay, persona } = useAppState();
  const open = isOpen('eidCard');
  const [side, setSide] = useState('front');
  const qrCells = useMemo(buildQrCells, []);

  const issued = persona.eidStatus === 'issued';
  const nameParts = persona.name.split(' ');
  const surname = nameParts.slice(-1)[0].toUpperCase();
  const given = nameParts.slice(0, -1).join(' ');
  const initials = persona.initials || nameParts.map((p) => p[0]).slice(0, 2).join('');
  const region = REGIONS.find((r) => r.id === persona.region)?.name || 'Region 4 — Demerara-Mahaica';
  const cardNumber = `DICR-${EID_NUMBER.replace(/\D/g, '').slice(-6)}`;

  const frontRows = [
    { label: 'Date of birth', value: formatDob(persona.dob) },
    { label: 'Sex', value: 'F' },
    { label: 'Nationality', value: 'Guyanese' },
  ];
  const backRows = [
    { label: 'Address', value: 'Lot 22 Republic Road, Georgetown' },
    { label: 'Region', value: region },
    { label: 'Card number', value: cardNumber },
    { label: 'Issued by', value: 'Digital Identity Card Registry' },
  ];

  return (
    <Sheet open={open} onClose={() => closeOverlay('eidCard')} title="Your e-ID">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {side === 'front' ? (
          <div style={{
            position: 'relative', flexShrink: 0, borderRadius: 18, padding: 16,
            background: 'var(--hero-navy-gradient)', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 42px rgba(0,0,0,0.45)', overflow: 'hidden',
          }}>
            <span aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: -54, top: -40, width: 170, height: 170, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <span aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 999, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="shield" size={14} color="#fff" />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Co-operative Republic of Guyana</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>e-ID</span>
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: 14, paddingTop: 14 }}>
              <span aria-hidden="true" style={{
                width: 74, height: 92, flexShrink: 0, borderRadius: 10, background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.75)',
              }}>{initials}</span>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Surname</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{surname}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Given names</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{given}</span>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {frontRows.map((r) => (
                    <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{r.label}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 16, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span aria-hidden="true" style={{ width: 32, height: 24, flexShrink: 0, borderRadius: 5, background: 'linear-gradient(140deg,#f2d17a,#c99b32)', border: '1px solid rgba(255,255,255,0.3)' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>e-ID number</span>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', color: '#fff' }}>{EID_NUMBER}</span>
              </span>
              <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'right', lineHeight: 1.35 }}>
                Issued 6 Aug 2026<br />Valid to 6 Aug 2036
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            position: 'relative', flexShrink: 0, borderRadius: 18, padding: 16,
            background: 'linear-gradient(160deg,#0f2136 0%,#0a1424 100%)', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 42px rgba(0,0,0,0.45)', overflow: 'hidden',
          }}>
            <span aria-hidden="true" style={{ display: 'block', height: 34, margin: '-16px -16px 14px', background: '#050d18' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {backRows.map((r) => (
                <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{r.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div aria-hidden="true" style={{
              display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16, paddingTop: 13,
              borderTop: '1px solid rgba(255,255,255,0.12)', fontFamily: 'ui-monospace,monospace',
              fontSize: 10.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)',
            }}>
              <span>{`IDGUY<<${surname}<<<<<<<<<<<<<<`}</span>
              <span>{`${EID_NUMBER}<9GUY9103146M3608066`}</span>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', flexShrink: 0, alignItems: 'center', gap: 13, padding: 14, borderRadius: 16,
          background: 'var(--brand-800)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div aria-hidden="true" style={{
            width: 84, height: 84, flexShrink: 0, borderRadius: 10, background: '#fff', padding: 7,
            opacity: issued ? 1 : 0.3, display: 'grid', gridTemplateColumns: 'repeat(21,1fr)', gridTemplateRows: 'repeat(21,1fr)',
          }}>
            {qrCells.map((bg, i) => <span key={i} style={{ background: bg }} />)}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999,
              background: issued ? 'rgba(31,138,91,0.25)' : 'rgba(255,255,255,0.14)',
            }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: issued ? '#4ade80' : '#fbbf24' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: issued ? '#a7f3c8' : 'rgba(255,255,255,0.9)' }}>{issued ? 'Active' : 'In production'}</span>
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>{issued ? 'Ready to verify' : 'Not active yet'}</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.68)' }}>
              {issued
                ? 'Let an officer or business scan this code to confirm your identity.'
                : 'This preview activates once you collect your card at the Service Centre.'}
            </span>
          </div>
        </div>

        <button
          className="press focus-ring"
          onClick={() => setSide((s) => (s === 'front' ? 'back' : 'front'))}
          style={{
            width: '100%', minHeight: 48, borderRadius: 14, border: '1px solid var(--surface-border)',
            background: 'var(--surface-2)', color: 'var(--fg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {side === 'front' ? 'Show the back' : 'Show the front'}
        </button>
        <button
          className="press focus-ring"
          onClick={() => closeOverlay('eidCard')}
          style={{ width: '100%', minHeight: 44, border: 'none', borderRadius: 14, background: 'none', color: 'var(--fg-3)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Done
        </button>
      </div>
    </Sheet>
  );
}
