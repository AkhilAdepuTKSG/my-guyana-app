import Sheet from '../ui/Sheet';
import Icon from '../ui/Icon';
import { vaultDateLabel } from '../../api/vault';
import { acceptedLabel, documentType } from '../../data/documentTypes';
import { formatFileSize } from '../../lib/format';

// Choosing between Vault documents for one slot.
//
// The list is already filtered by type before it reaches here — a National ID
// slot is handed National IDs and nothing else. The sheet only appears when
// there is a genuine choice to make; a single match is attached without asking.
// One component, used by every service.

/**
 * @param {{
 *   open: boolean,
 *   field: import('../../data/types').DocumentDef|null,
 *   candidates: import('../../lib/vaultInventory').VaultItem[],
 *   accent?: string,
 *   onPick: (item: import('../../lib/vaultInventory').VaultItem) => void,
 *   onClose: () => void
 * }} props
 */
export default function VaultPickerSheet({ open, field, candidates, accent = 'var(--brand-600)', onPick, onClose }) {
  if (!open || !field) return null;
  const wants = acceptedLabel(field.accepts);

  return (
    <Sheet open={open} onClose={onClose} title={`Choose a document`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          This slot takes {wants}. You have more than one, so pick the one to attach — nothing
          else in your Vault can go here.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: '48vh', overflowY: 'auto' }}>
          {candidates.map((c) => (
            <button
              key={c.id}
              className="press focus-ring"
              onClick={() => onPick(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 13px',
                border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-md)',
                  background: `color-mix(in oklch, ${accent} 12%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name={c.icon} size={16} color={accent} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--fg-3)' }}>
                  {c.subtitle}
                  {c.addedAt ? ` · ${vaultDateLabel(c.addedAt)}` : ''}
                  {c.sizeBytes ? ` · ${formatFileSize(c.sizeBytes)}` : ''}
                </span>
              </span>
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: accent,
              }}>
                {documentType(c.type).label}
              </span>
              <Icon name="chevron-right" size={16} color="var(--fg-4)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
