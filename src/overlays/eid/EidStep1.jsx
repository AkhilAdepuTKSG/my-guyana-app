import Icon from '../../components/ui/Icon';
import { EID_CITIZENSHIP_OPTIONS } from './eidData';

function Field({ id, label, hint, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>{label}</label>
      <input
        id={id} type="text" enterKeyHint="done" value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)',
          background: 'var(--surface-1)', fontSize: 16, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
      {hint && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-3)' }}>{hint}</p>}
    </div>
  );
}

// Step 1 of the e-ID wizard: a "scan your ID" affordance that fakes OCR
// autofill, then the personal-details form plus citizenship-path picker
// (which decides which documents step 2 asks for) and an optional
// "speed up your visit" family-details section.
export default function EidStep1({
  fields, updateField, scanned, scanning, onScan, optionalOpen, onToggleOptional,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {scanned && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, background: 'var(--status-success-bg)', border: '1px solid color-mix(in oklch, var(--status-success) 34%, transparent)' }}>
          <Icon name="badge-check" size={19} color="var(--status-success)" />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>Filled in from your ID</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>Check every field and correct anything that looks wrong.</span>
          </span>
        </div>
      )}
      {!scanned && (
        <button
          className="press focus-ring" onClick={onScan} disabled={scanning}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 16,
            border: '1.5px dashed var(--agency-accent)', cursor: scanning ? 'default' : 'pointer', textAlign: 'left',
            fontFamily: 'inherit', background: 'color-mix(in oklch, var(--agency-accent) 6%, var(--surface-1))',
          }}
        >
          <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={scanning ? 'loader-circle' : 'scan-line'} size={18} color="var(--agency-contrast)" className={scanning ? 'eid-spin' : undefined} />
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>{scanning ? 'Scanning your ID…' : 'Scan your ID and fill this in'}</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>Photograph your GECOM card or passport — we read the details for you.</span>
          </span>
          {!scanning && <Icon name="chevron-right" size={17} color="var(--fg-3)" />}
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--fg-1)' }}>Personal information</h3>
        <Field id="eid-fullname" label="Full name" value={fields.fullName} onChange={updateField('fullName')} />
        <Field id="eid-nationalid" label="National ID number" value={fields.nationalId} onChange={updateField('nationalId')}
          hint="The number printed on your GECOM identification card or Guyana passport." />
        <Field id="eid-address" label="Home address" value={fields.address} onChange={updateField('address')} />
        <Field id="eid-phone" label="Phone number" value={fields.phone} onChange={updateField('phone')} />
        <Field id="eid-email" label="Email" value={fields.email} onChange={updateField('email')} placeholder="Optional" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 18, borderRadius: 16, background: 'var(--surface-2)' }}>
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>How did you become a Guyanese citizen?</label>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>Each path asks for different documents</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EID_CITIZENSHIP_OPTIONS.map((c) => {
            const active = fields.citizenship === c.id;
            return (
              <button
                key={c.id} className="press focus-ring" onClick={() => updateField('citizenship')({ target: { value: c.id } })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '11px 14px',
                  borderRadius: 12, border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                  background: active ? 'var(--agency-accent)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? 'var(--agency-contrast)' : 'var(--fg-1)' }}>{c.label}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.35, color: active ? 'rgba(255,255,255,0.75)' : 'var(--fg-3)' }}>{c.hint}</span>
                </span>
                {active && <Icon name="check" size={16} color="var(--agency-contrast)" />}
              </button>
            );
          })}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-3)' }}>Your answer decides which primary documents you&rsquo;ll be asked for on the next step.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <button
          className="press focus-ring" onClick={onToggleOptional}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-1)' }}>Speed up your visit</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--surface-4)', color: 'var(--fg-3)' }}>Optional</span>
            </span>
            <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>Family details the enrolment officer would otherwise ask you for</span>
          </span>
          <Icon name={optionalOpen ? 'chevron-up' : 'chevron-down'} size={18} color="var(--fg-3)" />
        </button>
        {optionalOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 18px 18px' }}>
            <Field id="eid-mother" label="Mother's full name, date and place of birth" value={fields.motherName} onChange={updateField('motherName')} placeholder="Optional" />
            <Field id="eid-father" label="Father's full name, date and place of birth" value={fields.fatherName} onChange={updateField('fatherName')} placeholder="Optional" />
            <Field id="eid-spouse" label="Spouse's full name, date and place of birth" value={fields.spouseName} onChange={updateField('spouseName')} placeholder="Optional" />
          </div>
        )}
      </div>
    </div>
  );
}
