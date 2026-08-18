import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { AGENCIES, SERVICE_CENTRES } from '../state/mockData';
import { buildEidDateOptions, EID_TIME_OPTIONS, formatEidDate } from '../overlays/eid/eidData';
import { findSlotClash, appointmentPurpose, dateClashSummary } from '../lib/appointments';
import Icon from '../components/ui/Icon';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';
import NotificationBell from '../components/ui/NotificationBell';

function dayAbbr(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}
function dateNum(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDate();
}

// What a booked visit can be for. Each maps to the agency that runs it, so the
// new appointment is tagged and coloured like the rest of the app.
const PURPOSES = [
  { id: 'eid', label: 'e-ID enrolment', agency: 'mops', title: 'e-ID enrolment appointment' },
  { id: 'passport', label: 'Passport', agency: 'immigration', title: 'Passport Office visit' },
  { id: 'nis', label: 'NIS enquiry', agency: 'nis', title: 'NIS enquiry appointment' },
  { id: 'general', label: 'General enquiry', agency: 'mops', title: 'Service Centre appointment' },
];

export default function Calendar() {
  const { openOverlay, appointments, addAppointment, showToast, requireOtp } = useAppState();
  const [booking, setBooking] = useState(false);
  const [purpose, setPurpose] = useState('general');
  const [office, setOffice] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const dateOptions = useMemo(() => buildEidDateOptions(), []);

  const ready = office && date && time;
  const resetBooking = () => { setPurpose('general'); setOffice(''); setDate(''); setTime(''); };

  const confirmBooking = () => {
    if (!ready) return;
    const p = PURPOSES.find((x) => x.id === purpose) || PURPOSES[3];
    addAppointment({ agency: p.agency, title: p.title, location: office, date, time });
    setBooking(false);
    resetBooking();
    showToast(`Appointment booked · ${formatEidDate(date)} at ${time}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ds-h2">Appointments</div>
        <NotificationBell />
      </div>

      <button
        className="press focus-ring"
        onClick={() => { resetBooking(); setBooking(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none',
          borderRadius: 18, background: 'var(--brand-600)', color: '#fff', padding: 16, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calendar-plus" size={20} color="#fff" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>Book an appointment</span>
          <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' }}>Choose a Service Centre, day and time</span>
        </span>
        <Icon name="arrow-right" size={18} color="#fff" />
      </button>

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '32px 20px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="calendar" size={22} color="var(--fg-3)" />
          </span>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>No appointments yet</p>
          <p style={{ margin: 0, fontSize: 'var(--text-2xs)', lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 260 }}>
            Book one above, or an appointment you make with an agency — like your e-ID enrolment visit — will show up here.
          </p>
        </div>
      )}

      <Sheet open={booking} onClose={() => setBooking(false)} title="Book an appointment" maxHeight="88%">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>What's it for?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PURPOSES.map((p) => {
                const active = purpose === p.id;
                return (
                  <button
                    key={p.id} className="press focus-ring" onClick={() => setPurpose(p.id)}
                    style={{
                      minHeight: 38, padding: '0 13px', borderRadius: 999,
                      border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--brand-600)' : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Service Centre</label>
            {SERVICE_CENTRES.map((c) => {
              const active = office === c.name;
              return (
                <button
                  key={c.id} className="press focus-ring" onClick={() => setOffice(c.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '11px 14px',
                    borderRadius: 12, border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--brand-100)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{c.name}</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--fg-3)' }}>{c.address}</span>
                  </span>
                  {active && <Icon name="check" size={16} color="var(--brand-600)" />}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Date</label>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Service Centres open weekdays only.</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px' }}>
              {dateOptions.map((dt) => {
                const active = date === dt.iso;
                const summary = dateClashSummary(appointments, { location: office, date: dt.iso, times: EID_TIME_OPTIONS });
                return (
                  <button
                    key={dt.iso} className="press focus-ring" onClick={() => !dt.isFull && setDate(dt.iso)} disabled={dt.isFull}
                    title={summary.hasBooking ? 'You already have a booking this day' : undefined}
                    style={{
                      position: 'relative',
                      flexShrink: 0, width: 56, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      borderRadius: 14, border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--brand-600)' : 'var(--surface-1)', cursor: dt.isFull ? 'not-allowed' : 'pointer',
                      opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {summary.hasBooking && (
                      <span aria-hidden="true" style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 999, background: active ? '#fff' : 'var(--status-warning)' }} />
                    )}
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: active ? '#fff' : 'var(--fg-1)' }}>{dt.dayAbbr}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: active ? '#fff' : 'var(--fg-1)' }}>{dt.dateNum}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#fff' : (dt.isFull ? 'var(--status-error)' : summary.allBooked ? 'var(--status-warning)' : 'var(--status-success)') }}>{dt.isFull ? 'Full' : summary.allBooked ? 'Booked' : 'Open'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Time</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EID_TIME_OPTIONS.map((t) => {
                const active = time === t;
                const clash = findSlotClash(appointments, { location: office, date, time: t });
                return (
                  <button
                    key={t} className="press focus-ring" disabled={!!clash} onClick={() => { if (!clash) setTime(t); }}
                    style={{
                      minHeight: 40, padding: clash ? '5px 13px' : '0 16px', borderRadius: clash ? 12 : 999,
                      border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--brand-600)' : clash ? 'var(--surface-2)' : 'var(--surface-1)',
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

          <Button fullWidth onClick={() => requireOtp({ title: 'Confirm your appointment', confirmLabel: 'Confirm appointment', onConfirm: confirmBooking })} disabled={!ready} style={{ opacity: ready ? 1 : 0.5 }}>
            Confirm appointment
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
