import Icon from '../ui/Icon';
import { centresFor } from '../../state/mockData';
import { buildEidDateOptions, EID_TIME_OPTIONS, formatEidDate } from '../../overlays/eid/eidData';
import { findSlotClash, appointmentPurpose, dateClashSummary } from '../../lib/appointments';

// Booking the in-person half of an application.
//
// Some services cannot be finished online — a passport needs a photograph, a
// signature and fingerprints taken across a counter, and the originals of what
// was connected from the Vault checked there. A service that declares an
// `appointment` in the seed gets this step, and the offices offered are the
// owning agency's own: a passport books at a Passport Office, not at a MoPS
// Service Centre.
//
// It reads the citizen's existing appointments so a slot they are already
// committed to is shown as taken rather than silently double-booked.

/**
 * @param {{
 *   appointment: import('../../data/types').AppointmentDef,
 *   agencyId: string,
 *   value: {office: string, date: string, time: string},
 *   appointments?: {location?: string, date?: string, time?: string}[],
 *   accent?: string,
 *   onChange: (next: {office: string, date: string, time: string}) => void
 * }} props
 */
export default function AppointmentPicker({
  appointment, agencyId, value, appointments = [], accent = 'var(--brand-600)', onChange,
}) {
  const dates = buildEidDateOptions();
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>{appointment.label}</h3>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>{appointment.note}</p>
      </div>

      {/* Where */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FieldLabel>Which office</FieldLabel>
        {centresFor(agencyId).map((c) => {
          const active = value.office === c.name;
          return (
            <button
              key={c.id}
              type="button"
              className="press focus-ring"
              onClick={() => set({ office: c.name })}
              aria-pressed={active}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 54, padding: '10px 13px',
                borderRadius: 12, border: `1px solid ${active ? accent : 'var(--surface-border)'}`,
                background: active ? `color-mix(in oklch, ${accent} 12%, transparent)` : 'var(--surface-1)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{c.address}</span>
              </span>
              {active && <Icon name="check" size={16} color={accent} />}
            </button>
          );
        })}
      </div>

      {/* When */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FieldLabel>Which day</FieldLabel>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px' }}>
          {dates.map((dt) => {
            const active = value.date === dt.iso;
            const summary = dateClashSummary(appointments, { location: value.office, date: dt.iso, times: EID_TIME_OPTIONS });
            return (
              <button
                key={dt.iso}
                type="button"
                className="press focus-ring"
                disabled={dt.isFull}
                onClick={() => !dt.isFull && set({ date: dt.iso })}
                title={summary.hasBooking ? 'You already have a booking this day' : undefined}
                style={{
                  position: 'relative', flexShrink: 0, width: 54, minHeight: 62,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  borderRadius: 13, border: `1px solid ${active ? accent : 'var(--surface-border)'}`,
                  background: active ? accent : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)',
                  cursor: dt.isFull ? 'not-allowed' : 'pointer', opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit',
                }}
              >
                {summary.hasBooking && (
                  <span aria-hidden="true" style={{
                    position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 999,
                    background: active ? '#fff' : 'var(--status-warning)',
                  }} />
                )}
                <span style={{ fontSize: 10.5, fontWeight: 800 }}>{dt.dayAbbr}</span>
                <span style={{ fontSize: 17, fontWeight: 800 }}>{dt.dateNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FieldLabel>What time</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EID_TIME_OPTIONS.map((t) => {
            const active = value.time === t;
            const clash = findSlotClash(appointments, { location: value.office, date: value.date, time: t });
            return (
              <button
                key={t}
                type="button"
                className="press focus-ring"
                disabled={!!clash}
                onClick={() => { if (!clash) set({ time: t }); }}
                style={{
                  minHeight: 38, padding: clash ? '5px 13px' : '0 15px', borderRadius: clash ? 12 : 999,
                  border: `1px solid ${active ? accent : 'var(--surface-border)'}`,
                  background: active ? accent : clash ? 'var(--surface-2)' : 'var(--surface-1)',
                  color: active ? '#fff' : clash ? 'var(--fg-3)' : 'var(--fg-1)',
                  fontSize: 13, fontWeight: 700, cursor: clash ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                }}
              >
                <span>{t}</span>
                {clash && (
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--status-warning)' }}>
                    Booked · {appointmentPurpose(clash)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** When a booked visit is, written the way a citizen reads it. */
export function appointmentWhen(value) {
  if (!value?.date) return null;
  return `${formatEidDate(value.date)}${value.time ? ` · ${value.time}` : ''}`;
}

/** A booked visit in full — when, and where. */
export function appointmentLabel(value) {
  const when = appointmentWhen(value);
  if (!when) return null;
  return value.office ? `${when} · ${value.office}` : when;
}

/** Is this booking complete enough to submit against? */
export function appointmentComplete(value) {
  return !!(value?.office && value?.date && value?.time);
}

function FieldLabel({ children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
      {children}
    </span>
  );
}
