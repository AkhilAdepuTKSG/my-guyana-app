import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { REGIONS } from '../../state/mockData';
import { getRegionId, setRegionId, useRegionId } from './regionStore';

// A pending-vs-confirmed picker, matching the source's "pick, then Cancel/Save"
// pattern rather than applying a region the moment it's tapped.
export default function RegionSheet() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('region');
  const confirmedId = useRegionId();
  const [pendingId, setPendingId] = useState(confirmedId);

  useEffect(() => {
    if (open) setPendingId(getRegionId());
  }, [open]);

  if (!open) return null;

  const close = () => closeOverlay('region');
  const apply = () => {
    setRegionId(pendingId);
    const name = REGIONS.find((r) => r.id === pendingId)?.name || pendingId;
    showToast(`Region set to ${name}`);
    closeOverlay('region');
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', background: 'rgba(9,26,43,0.45)', animation: 'sheetOverlayFade var(--dur-base) var(--ease-out)' }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose your region"
        style={{
          width: '100%', maxHeight: '82%', display: 'flex', flexDirection: 'column',
          background: 'var(--surface-1)', borderRadius: '24px 24px 0 0', boxShadow: 'var(--shadow-xl)',
          animation: 'sheetSlideUp var(--dur-slow) var(--ease-emphasis)',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--surface-border)', alignSelf: 'center', margin: '10px 0 6px', flexShrink: 0 }} />
        <h2 className="ds-h3" style={{ margin: '8px 20px 4px', fontSize: 18, flexShrink: 0 }}>Choose your region</h2>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {REGIONS.map((r) => {
            const active = r.id === pendingId;
            return (
              <button
                key={r.id}
                className="press focus-ring"
                onClick={() => setPendingId(r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '8px 6px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: active ? 700 : 500, color: 'var(--fg-1)' }}>{r.name}</span>
                <Icon name="check" size={18} color="var(--agency-accent)" style={{ flexShrink: 0, opacity: active ? 1 : 0 }} />
              </button>
            );
          })}
        </div>
        <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '14px 20px 28px', borderTop: '1px solid var(--surface-hairline)' }}>
          <button className="press focus-ring" onClick={close} style={{ flex: 1, minHeight: 48, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button className="press focus-ring" onClick={apply} style={{ flex: 1, minHeight: 48, border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </div>
    </div>
  );
}
