import Icon from '../../components/ui/Icon';
import { formatEidDate } from './eidData';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14 }}>
      <span style={{ flexShrink: 0, fontSize: 13.5, color: 'var(--fg-3)' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, textAlign: 'right', fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: 'var(--fg-1)' }}>{value}</span>
    </div>
  );
}

export default function EidStep3({ fields, citizenshipLabel, appointment }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11.5 }}>Your details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 17, borderRadius: 16, background: 'var(--surface-2)' }}>
          <Row label="Name" value={fields.fullName} />
          <Row label="National ID" value={fields.nationalId} />
          <Row label="Address" value={fields.address} />
          <Row label="Citizenship" value={citizenshipLabel} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11.5 }}>Enrolment appointment</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 17, borderRadius: 16, background: 'var(--surface-2)' }}>
          <Row label="Service Centre" value={appointment.office} />
          <Row label="Date" value={formatEidDate(appointment.date)} />
          <Row label="Time" value={appointment.time} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: 15, borderRadius: 16, background: 'var(--status-success-bg)', border: '1px solid color-mix(in oklch, var(--status-success) 34%, transparent)' }}>
        <Icon name="badge-check" size={18} color="var(--status-success)" style={{ marginTop: 1, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>Free of charge</span>
          <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>Bring your original documents on the day — copies only if officially certified.</span>
        </span>
      </div>
    </div>
  );
}
