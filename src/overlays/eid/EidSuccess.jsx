import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { formatEidDate } from './eidData';

const CONFETTI = [
  { top: '18%', left: '20%', size: 8, radius: 2, color: 'var(--agency-accent)', delay: '0.15s', dur: '1.6s' },
  { top: '14%', left: '70%', size: 7, radius: 999, color: 'var(--status-warning)', delay: '0.35s', dur: '1.7s' },
  { top: '20%', left: '45%', size: 6, radius: 2, color: 'var(--status-info)', delay: '0.05s', dur: '1.5s' },
  { top: '16%', left: '32%', size: 6, radius: 999, color: 'var(--agency-accent-strong)', delay: '0.5s', dur: '1.8s' },
  { top: '12%', left: '58%', size: 8, radius: 2, color: 'var(--status-success)', delay: '0.25s', dur: '1.6s' },
];

// Success screen after e-ID submission: confetti burst, confirmation copy,
// and the resulting enrolment-appointment card.
export default function EidSuccess({ appointment, onSeeApplication, onBackToMops }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: '100%' }}>
      {CONFETTI.map((c, i) => (
        <span key={i} aria-hidden="true" style={{
          position: 'absolute', top: c.top, left: c.left, width: c.size, height: c.size, borderRadius: c.radius,
          background: c.color, animation: `confettiFall ${c.dur} ease-in ${c.delay} both`,
        }} />
      ))}
      <span style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check-circle-2" size={32} color="var(--status-success)" />
      </span>
      <div>
        <h2 className="ds-h3" style={{ margin: 0, fontSize: 20 }}>Application submitted</h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)' }}>
          The Digital Identity Card Registry has your application. Complete enrolment at the Centre, then we&rsquo;ll notify you here when your card is ready to collect.
        </p>
      </div>
      <div style={{ width: '100%', maxWidth: 327, borderRadius: 18, padding: 16, background: 'var(--hero-navy-gradient)', color: '#fff', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', animation: 'successFadeUp 0.4s ease-out 0.18s both' }}>
        <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar-check" size={20} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Enrolment appointment</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 15, fontWeight: 800, color: '#fff' }}>{formatEidDate(appointment.date)} · {appointment.time}</span>
          <span style={{ display: 'block', marginTop: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{appointment.office} · arrive 15 min early · in your Schedule</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 0 10px', width: '100%' }}>
        <Button fullWidth size="lg" onClick={onSeeApplication}>See application</Button>
        <Button fullWidth size="lg" variant="outline" onClick={onBackToMops}>Back to MoPS</Button>
      </div>
    </div>
  );
}
