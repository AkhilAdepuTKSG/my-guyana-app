import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { NIS_ACTIVITY } from '../../state/mockData';

function maskId(v) {
  const str = String(v || '');
  return str.length <= 4 ? str : `•••• ${str.slice(-4)}`;
}

export default function NisCard() {
  const { isOpen, closeOverlay, navigate, persona } = useAppState();
  const open = isOpen('nisCard');
  const employer = NIS_ACTIVITY[0]?.subtitle?.split('·')[1]?.trim() || 'Devcon Construction Ltd.';

  return (
    <Sheet open={open} onClose={() => closeOverlay('nisCard')} title="Your NIS Card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          borderRadius: 18, padding: 20, color: '#fff',
          background: 'linear-gradient(160deg, #00764f 0%, #009b67 55%, #006c48 100%)',
          boxShadow: '0 20px 42px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <Icon name="shield-check" size={18} color="#fff" />
            <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>National Insurance Scheme</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
            <div>
              <span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Holder</span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 800 }}>{persona.name}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>NIS number</span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '0.03em' }}>{maskId(persona.nisNumber)}</span>
            </div>
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 5, marginTop: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.2)' }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />
              <span style={{ fontSize: 11, fontWeight: 800 }}>Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>Employer</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{employer}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>Contributions</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{persona.contributions.weeks} contributions on record</span>
            </div>
          </div>
        </div>

        <button
          className="press focus-ring"
          onClick={() => { closeOverlay('nisCard'); navigate('nis'); }}
          style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--surface-2)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Open NIS
        </button>
      </div>
    </Sheet>
  );
}
