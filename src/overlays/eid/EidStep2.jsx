import Icon from '../../components/ui/Icon';
import { EID_TIME_OPTIONS } from './eidData';
import { appointmentPurpose } from '../../lib/appointments';

const STATUS_META = {
  uploaded: { text: 'Uploaded', bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  uploading: { text: 'Uploading…', bg: 'var(--surface-4)', fg: 'var(--fg-3)' },
  missing: { text: 'Missing', bg: 'rgba(217,119,6,0.14)', fg: '#b45309' },
};

export default function EidStep2({
  docs, onUpload, centres, appointment, onSelectCentre, onUseLocation,
  dateOptions, onSelectDate, onSelectTime, slotClash, dateSummary,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>1</span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Required documents</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>Upload what applies to you</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'var(--agency-accent)' }}>
          <Icon name="lightbulb" size={17} color="var(--agency-contrast)" />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--agency-contrast)' }}>Upload now, skip a second trip</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>The Centre pre-checks your file. Bring the originals in English on the day.</span>
          </span>
        </div>
        {docs.map((d) => {
          const meta = d.isOptional && d.status === 'missing' ? { text: 'Optional', bg: 'var(--surface-4)', fg: 'var(--fg-3)' } : STATUS_META[d.status];
          const isUploaded = d.status === 'uploaded';
          return (
            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
                  <Icon name={d.icon} size={16} color="var(--fg-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.35 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-3)' }}>{d.issuer}</span>
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: meta.bg, color: meta.fg, flexShrink: 0 }}>
                  {isUploaded && <Icon name="check" size={11} color={meta.fg} />}
                  {meta.text}
                </span>
              </div>
              {d.hint && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>{d.hint}</p>}
              {!isUploaded && (
                <button
                  className="press focus-ring" onClick={() => onUpload(d.id)} disabled={d.status === 'uploading'}
                  style={{ minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {d.status === 'uploading' ? 'Uploading…' : (d.isOptional ? 'Add' : 'Upload')}
                </button>
              )}
              {isUploaded && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="press focus-ring" style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="eye" size={14} />View
                  </button>
                  <button className="press focus-ring" onClick={() => onUpload(d.id)} style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="refresh-cw" size={14} />Replace
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>2</span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>At the Service Centre</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>Photo, signature and fingerprints — nothing to upload</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 11, flexDirection: 'column' }}>
          {[
            ['shirt', 'Dark, plain clothing'],
            ['ban', 'No glasses or hats'],
            ['meh', 'Neutral expression'],
            ['ear', 'Ears and full face visible'],
          ].map(([icon, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Icon name={icon} size={13} color="var(--fg-3)" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-2)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800 }}>3</span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Book your appointment</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>Arrive 15 minutes early and check in at the kiosk</span>
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--surface-border)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>Choose a Service Centre</label>
            <button
              className="press focus-ring" onClick={onUseLocation}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, minHeight: 34, padding: '0 12px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Icon name="locate-fixed" size={13} color="var(--agency-accent-strong)" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--agency-accent-strong)' }}>Use my location</span>
            </button>
          </div>
          {centres.map((c, i) => {
            const active = appointment.office === c.name;
            return (
              <button
                key={c.id} className="press focus-ring" onClick={() => onSelectCentre(c.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 58, padding: '11px 14px',
                  borderRadius: 12, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                  background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? 'var(--agency-contrast)' : 'var(--fg-1)' }}>{c.name}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.35, color: active ? 'rgba(255,255,255,0.8)' : 'var(--fg-3)' }}>{c.address}</span>
                </span>
                {i === 0 && (
                  <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: active ? 'rgba(255,255,255,0.2)' : 'var(--agency-accent-soft)', color: active ? '#fff' : 'var(--agency-accent-strong)' }}>Nearest</span>
                )}
                {active && <Icon name="check" size={16} color="var(--agency-contrast)" />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>Available dates</label>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Service Centres open weekdays only.</p>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px' }}>
            {dateOptions.map((dt) => {
              const active = appointment.date === dt.iso;
              const summary = dateSummary ? dateSummary(dt.iso) : { hasBooking: false, allBooked: false };
              return (
                <button
                  key={dt.iso} className="press focus-ring" onClick={() => !dt.isFull && onSelectDate(dt.iso)} disabled={dt.isFull}
                  title={summary.hasBooking ? 'You already have a booking this day' : undefined}
                  style={{
                    position: 'relative',
                    flexShrink: 0, width: 56, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    borderRadius: 14, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: dt.isFull ? 'not-allowed' : 'pointer',
                    opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit',
                  }}
                >
                  {summary.hasBooking && (
                    <span aria-hidden="true" style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 999, background: active ? 'var(--agency-contrast)' : 'var(--status-warning)' }} />
                  )}
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em', color: active ? 'var(--agency-contrast)' : 'var(--fg-1)' }}>{dt.dayAbbr}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: active ? 'var(--agency-contrast)' : 'var(--fg-1)' }}>{dt.dateNum}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: active ? 'var(--agency-contrast)' : (dt.isFull ? 'var(--status-error)' : summary.allBooked ? 'var(--status-warning)' : 'var(--status-success)') }}>{dt.isFull ? 'Full' : summary.allBooked ? 'Booked' : 'Open'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>Available times</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EID_TIME_OPTIONS.map((t) => {
              const active = appointment.time === t;
              const clash = slotClash ? slotClash(t) : null;
              return (
                <button
                  key={t} className="press focus-ring" disabled={!!clash} onClick={() => { if (!clash) onSelectTime(t); }}
                  style={{
                    minHeight: 40, padding: clash ? '5px 13px' : '0 16px', borderRadius: clash ? 12 : 999, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent)' : clash ? 'var(--surface-2)' : 'var(--surface-1)', color: active ? 'var(--agency-contrast)' : clash ? 'var(--fg-3)' : 'var(--fg-1)',
                    fontSize: 13, fontWeight: 700, cursor: clash ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  }}
                >
                  <span>{t}</span>
                  {clash && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--status-warning)' }}>Booked · {appointmentPurpose(clash)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
