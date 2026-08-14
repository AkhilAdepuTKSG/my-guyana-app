import { useAppState } from '../../state/AppStateContext';
import Icon from './Icon';

export default function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 108, transform: 'translateX(-50%)',
      zIndex: 400, display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--brand-800)', color: '#fff', padding: '10px 16px',
      borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 600,
      boxShadow: 'var(--shadow-lg)', maxWidth: '86%', animation: 'successFadeUp var(--dur-base) var(--ease-out)',
    }}>
      {toast.icon && <Icon name={toast.icon} size={16} color="#fff" />}
      {toast.message}
    </div>
  );
}
