import { useAppState } from '../state/AppStateContext';
import { AGENCIES } from '../state/mockData';
import Icon from '../components/ui/Icon';
import NotificationBell from '../components/ui/NotificationBell';

function dayAbbr(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}
function dateNum(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDate();
}

export default function Calendar() {
  const { openOverlay, appointments } = useAppState();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ds-h2">Schedule</div>
        <NotificationBell />
      </div>

      {appointments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 className="ds-eyebrow" style={{ margin: 0 }}>Upcoming</h3>
          {appointments.map((ap) => {
            const accent = AGENCIES[ap.agency]?.mark || 'var(--agency-accent)';
            return (
              <button
                key={ap.id}
                className="press focus-ring"
                onClick={() => openOverlay('apptDetail', { id: ap.id })}
                style={{
                  display: 'flex', alignItems: 'stretch', gap: 14, padding: 16, textAlign: 'left', cursor: 'pointer',
                  width: '100%', border: 'none', borderLeft: `4px solid ${accent}`, borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minWidth: 44 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: accent }}>{dayAbbr(ap.date)}</span>
                  <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: 'var(--fg-1)' }}>{dateNum(ap.date)}</span>
                </div>
                <div aria-hidden="true" style={{ width: 1, background: 'var(--surface-border)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent, fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, alignSelf: 'flex-start' }}>
                    <Icon name="clock" size={11} color={accent} />{ap.time}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.35 }}>{ap.title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-2xs)', color: 'var(--fg-2)' }}>
                    <Icon name="map-pin" size={12} color="var(--fg-3)" />{ap.location}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="calendar" size={22} color="var(--fg-3)" />
          </span>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>No appointments yet</p>
          <p style={{ margin: 0, fontSize: 'var(--text-2xs)', lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 260 }}>
            Appointments you book with an agency, like your e-ID enrolment visit, will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
