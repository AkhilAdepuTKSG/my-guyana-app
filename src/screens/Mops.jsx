import { useAppState } from '../state/AppStateContext';
import { SERVICE_DIRECTORY } from '../state/mockData';
import HubHeader from '../components/shell/HubHeader';
import Icon from '../components/ui/Icon';
import ListRow from '../components/ui/ListRow';

function formatApptDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// MoPS is the appointments-and-identity agency: it leads with whatever
// Service Centre visit is coming up, then a short "what you can do" list
// built from the Identity & Records category of the service directory.
export default function Mops() {
  const { openOverlay, showToast, appointments } = useAppState();
  const appointment = appointments.find((a) => a.agency === 'mops');
  const idCategory = SERVICE_DIRECTORY.find((c) => c.id === 'cat-id');
  const [eidServiceName, ...otherServices] = idCategory?.services || [];

  const actions = [
    { icon: 'fingerprint', label: eidServiceName || 'National e-ID Card', hint: 'Apply for your digital identity card', onClick: () => openOverlay('eid') },
    { icon: 'file-text', label: otherServices[0] || 'Birth certificate copy', hint: 'Request a certified copy from the registry', onClick: () => showToast('Coming soon') },
    { icon: 'file-signature', label: otherServices[1] || 'Change of name', hint: 'Update your legal name on record', onClick: () => showToast('Coming soon') },
  ];

  return (
    <div data-agency="mops" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <HubHeader title="Ministry of Public Service" subtitle="MoPS" />

      <button
        className="press focus-ring"
        onClick={() => (appointment ? openOverlay('apptDetail', { id: appointment.id }) : showToast('No appointment booked yet'))}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: 'none',
          borderRadius: 20, background: 'var(--brand-600)', color: '#fff', padding: 18, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar-check" size={21} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
            {appointment ? 'Upcoming visit' : 'Appointments'}
          </span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {appointment ? 'Your Service Centre visit' : 'Book an appointment'}
          </span>
          <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>
            {appointment ? `${appointment.location} · ${formatApptDate(appointment.date)}, ${appointment.time}` : 'Choose a Service Centre, day and time'}
          </span>
        </span>
        <Icon name="arrow-right" size={18} color="#fff" />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="ds-eyebrow" style={{ fontSize: 12, color: 'var(--fg-2)', margin: 0 }}>What you can do</h2>
        <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
          {actions.map((a, i) => (
            <ListRow
              key={a.label}
              icon={a.icon}
              title={a.label}
              subtitle={a.hint}
              onClick={a.onClick}
              style={{ padding: '13px 14px', borderBottom: i < actions.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
