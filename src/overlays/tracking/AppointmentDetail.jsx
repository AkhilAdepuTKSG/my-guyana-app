import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES } from '../../state/mockData';
import { findSlotClash, appointmentPurpose } from '../../lib/appointments';

// Fixed "what happens at your visit" copy — the source design hard-codes
// this to the e-ID enrolment flow (the only appointment type it models),
// and APPOINTMENTS in mock data only carries that one flow too.
const VISIT_STEPS = [
  { n: '1', title: 'Check in', sub: 'Bring your ID and this appointment confirmation.' },
  { n: '2', title: 'Complete your enrolment', sub: "We'll take your photo, signature and fingerprints, and check your original documents." },
  { n: '3', title: "We'll verify your information", sub: 'Your details and documents are reviewed.' },
  { n: '4', title: 'Get your e-ID', sub: "We'll let you know when it's ready — usually within 24-48 hours." },
];

const TIME_OPTIONS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM'];

function weekdayAbbr(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

// Next 5 weekdays (Service Centres are closed weekends), starting tomorrow.
function nextWeekdayOptions(count = 5) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      out.push({ id: d.toISOString().slice(0, 10), dow: weekdayAbbr(d), day: String(d.getDate()) });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function formatDateLabel(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function resolveAppointment(payload, appointments) {
  if (payload && typeof payload === 'object') {
    if (payload.id) {
      const found = appointments.find((a) => a.id === payload.id);
      if (found) return found;
    }
    if (payload.title) return payload;
  }
  return appointments[0] || null;
}

export default function AppointmentDetail() {
  const { isOpen, closeOverlay, getPayload, showToast, appointments, updateAppointment, removeAppointment, requireOtp } = useAppState();
  const open = isOpen('apptDetail');

  const baseAppt = resolveAppointment(getPayload('apptDetail'), appointments);

  // Local override for reschedule/cancel — this is a display-only mock, so
  // there's nothing to persist beyond this overlay's own session.
  const [override, setOverride] = useState(null);
  const [sheet, setSheet] = useState(null); // 'reschedule' | 'report' | 'cancel' | null
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [issueComment, setIssueComment] = useState('');

  useEffect(() => {
    if (open) {
      setOverride(null);
      setSheet(null);
      setIssueComment('');
    }
  }, [open, baseAppt?.id]);

  const appt = override ? { ...baseAppt, ...override } : baseAppt;
  if (!appt) {
    return (
      <PageOverlay open={open} onClose={() => closeOverlay('apptDetail')} title="Appointment">
        <div className="ds-body">No appointment found.</div>
      </PageOverlay>
    );
  }

  const agency = AGENCIES[appt.agency] || {};
  const dateOptions = nextWeekdayOptions();

  function openReschedule() {
    setSelectedDate(appt.date || dateOptions[0]?.id || '');
    setSelectedTime(appt.time || TIME_OPTIONS[0]);
    setSheet('reschedule');
  }

  function confirmReschedule() {
    setOverride((prev) => ({ ...(prev || {}), date: selectedDate, time: selectedTime }));
    if (baseAppt?.id) updateAppointment(baseAppt.id, { date: selectedDate, time: selectedTime });
    setSheet(null);
    showToast('Appointment updated');
  }

  function submitIssue() {
    if (!issueComment.trim()) return;
    setSheet(null);
    setIssueComment('');
    showToast("Issue reported — MoPS will follow up.");
  }

  function confirmCancel() {
    if (baseAppt?.id) removeAppointment(baseAppt.id);
    setSheet(null);
    closeOverlay('apptDetail');
    showToast('Appointment cancelled');
  }

  return (
    <>
      <PageOverlay open={open} onClose={() => closeOverlay('apptDetail')} title="Appointment" agency={appt.agency}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: 'var(--agency-accent-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Icon name={agency.icon || 'calendar-clock'} size={13} />{appt.title}
            </span>
            <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--fg-1)' }}>{formatDateLabel(appt.date)}</p>
            <p style={{ margin: '2px 0 0', fontSize: 14.5, fontWeight: 600, color: 'var(--fg-2)' }}>{appt.time}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>Location</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
              <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="map-pin" size={17} color="var(--agency-accent-strong)" />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{appt.location}</span>
            </div>
            <button
              className="press focus-ring"
              onClick={() => showToast('Directions would open here')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 46,
                borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
                color: 'var(--fg-1)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Icon name="navigation" size={15} />Get directions
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>What happens at your visit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {VISIT_STEPS.map((st) => (
                <div key={st.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 2px' }}>
                  <span aria-hidden="true" style={{
                    width: 24, height: 24, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)',
                    color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11.5, fontWeight: 800,
                  }}>
                    {st.n}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{st.title}</span>
                    <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>{st.sub}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Photo requirements</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['shirt', 'Dark, plain clothing — avoid white or light colours'],
                  ['ban', 'No glasses, hats or head coverings (except for religious reasons)'],
                  ['meh', 'No smiling or exaggerated expressions — neutral face, both eyes open'],
                  ['ear', 'Ears and full face visible'],
                ].map(([icon, text]) => (
                  <div key={icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Icon name={icon} size={14} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0 }}>Manage</h3>
            <button
              className="press focus-ring"
              onClick={openReschedule}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '0 14px',
                borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Icon name="calendar-clock" size={17} color="var(--fg-2)" />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>Modify appointment</span>
              <Icon name="chevron-right" size={16} color="var(--fg-4)" />
            </button>
            <button
              className="press focus-ring"
              onClick={() => setSheet('report')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '0 14px',
                borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Icon name="flag" size={17} color="var(--fg-2)" />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>Report an issue</span>
              <Icon name="chevron-right" size={16} color="var(--fg-4)" />
            </button>
            <button
              className="press focus-ring"
              onClick={() => setSheet('cancel')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, padding: '0 14px',
                borderRadius: 14, border: '1px solid color-mix(in oklch, var(--status-error) 35%, transparent)',
                background: 'var(--status-error-bg)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Icon name="x-circle" size={17} color="var(--status-error)" />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--status-error)' }}>Cancel appointment</span>
            </button>
          </div>

          <button
            className="press focus-ring"
            onClick={() => showToast('Added to your calendar')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 50,
              border: 'none', borderRadius: 14, background: 'var(--agency-accent)', color: 'var(--agency-contrast)',
              fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Icon name="calendar-plus" size={16} />Add to calendar
          </button>
        </div>
      </PageOverlay>

      <Sheet open={sheet === 'reschedule'} onClose={() => setSheet(null)} title="Modify appointment">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>Pick a new slot at {appt.location}.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Available dates</label>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Service Centres open weekdays only.</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {dateOptions.map((d) => {
                const active = selectedDate === d.id;
                return (
                  <button
                    key={d.id}
                    className="press focus-ring"
                    onClick={() => setSelectedDate(d.id)}
                    style={{
                      flexShrink: 0, width: 64, minHeight: 74, padding: '10px 6px', borderRadius: 14,
                      border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--agency-accent)' : 'var(--surface-1)',
                      color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' }}>{d.dow}</span>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{d.day}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--agency-contrast)' : 'var(--status-success)' }}>Open</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Available times</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIME_OPTIONS.map((t) => {
                const active = selectedTime === t;
                const clash = findSlotClash(appointments, { location: appt.location, date: selectedDate, time: t, excludeId: baseAppt?.id });
                return (
                  <button
                    key={t}
                    className="press focus-ring"
                    disabled={!!clash}
                    onClick={() => { if (!clash) setSelectedTime(t); }}
                    style={{
                      minHeight: 44, padding: clash ? '6px 15px' : '0 18px', borderRadius: clash ? 12 : 999,
                      border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                      background: active ? 'var(--agency-accent)' : clash ? 'var(--surface-2)' : 'var(--surface-1)',
                      color: active ? 'var(--agency-contrast)' : clash ? 'var(--fg-3)' : 'var(--fg-1)',
                      fontSize: 14, fontWeight: 600, cursor: clash ? 'not-allowed' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    }}
                  >
                    <span>{t}</span>
                    {clash && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--status-warning)' }}>Booked · {appointmentPurpose(clash)}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="press focus-ring"
            onClick={() => requireOtp({ title: 'Confirm the new time', confirmLabel: 'Confirm new time', onConfirm: confirmReschedule })}
            disabled={!selectedDate || !selectedTime}
            style={{
              width: '100%', minHeight: 50, border: 'none', borderRadius: 14,
              background: 'var(--agency-accent)', color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', opacity: (!selectedDate || !selectedTime) ? 0.5 : 1,
            }}
          >
            Confirm new time
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'report'} onClose={() => setSheet(null)} title="Report an issue">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="appt-issue-comment" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>What&apos;s wrong?</label>
            <textarea
              id="appt-issue-comment"
              value={issueComment}
              onChange={(e) => setIssueComment(e.target.value)}
              placeholder="Describe the issue with this appointment"
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)',
                background: 'var(--surface-2)', fontSize: 14.5, lineHeight: 1.5, color: 'var(--fg-1)', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none',
              }}
            />
          </div>
          <button
            className="press focus-ring"
            onClick={() => requireOtp({ title: 'Submit your report', confirmLabel: 'Submit report', onConfirm: submitIssue })}
            disabled={!issueComment.trim()}
            style={{
              width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--agency-accent)',
              color: 'var(--agency-contrast)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              opacity: issueComment.trim() ? 1 : 0.45,
            }}
          >
            Submit report
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'cancel'} onClose={() => setSheet(null)} title="Cancel this appointment?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            You&apos;ll need to book a new time slot to continue your e-ID application.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="press focus-ring"
              onClick={() => setSheet(null)}
              style={{
                flex: 1, minHeight: 46, borderRadius: 12, border: '1px solid var(--surface-border)',
                background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Keep it
            </button>
            <button
              className="press focus-ring"
              onClick={() => requireOtp({ title: 'Cancel this appointment', confirmLabel: 'Cancel appointment', onConfirm: confirmCancel })}
              style={{
                flex: 1, minHeight: 46, borderRadius: 12, border: 'none',
                background: 'var(--status-error)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel appointment
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
