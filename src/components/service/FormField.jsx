import Icon from '../ui/Icon';

// Renders one seeded field definition. Every question in every service form is
// drawn by this component, so a new question is a seed change rather than new
// markup — and validation messages look the same everywhere.

const baseInput = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 48,
  padding: '12px 14px',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-2)',
  fontFamily: 'inherit',
  fontSize: 15,
  color: 'var(--fg-1)',
  outline: 'none',
};

/**
 * @param {{
 *   field: import('../../data/types').FieldDef,
 *   value: string,
 *   error?: string,
 *   onChange: (value: string) => void,
 *   onBlur?: () => void,
 *   accent?: string
 * }} props
 */
export default function FormField({ field, value = '', error, onChange, onBlur, accent = 'var(--brand-600)' }) {
  const invalid = !!error;
  const borderColor = invalid ? 'var(--status-error)' : 'var(--surface-border)';
  const describedBy = invalid ? `${field.key}-error` : field.hint ? `${field.key}-hint` : undefined;

  const label = (
    <label
      htmlFor={field.key}
      style={{ fontSize: 12.5, fontWeight: 700, color: invalid ? 'var(--status-error)' : 'var(--fg-3)' }}
    >
      {field.label}
      {!field.required && <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · optional</span>}
    </label>
  );

  const hint = field.hint && !invalid && (
    <span id={`${field.key}-hint`} style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>
      {field.hint}
    </span>
  );

  const errorLine = invalid && (
    <span
      id={`${field.key}-error`}
      role="alert"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11.5, lineHeight: 1.45, fontWeight: 700, color: 'var(--status-error)' }}
    >
      <Icon name="triangle-alert" size={13} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />
      {error}
    </span>
  );

  // --- Checkbox: a declaration, so the label sits beside the control ---
  if (field.type === 'checkbox') {
    const checked = value === 'true';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <button
          type="button"
          className="press focus-ring"
          id={field.key}
          role="checkbox"
          aria-checked={checked}
          aria-describedby={describedBy}
          onClick={() => onChange(checked ? 'false' : 'true')}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '13px 14px',
            border: `1.5px solid ${checked ? accent : borderColor}`, borderRadius: 'var(--radius-md)',
            background: checked ? `color-mix(in oklch, ${accent} 8%, transparent)` : 'var(--surface-1)',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 6,
              border: `1.5px solid ${checked ? accent : 'var(--surface-border)'}`,
              background: checked ? accent : 'var(--surface-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {checked && <Icon name="check" size={14} color="#fff" />}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.45, fontWeight: 600, color: 'var(--fg-1)' }}>
            {field.label}
          </span>
        </button>
        {hint}
        {errorLine}
      </div>
    );
  }

  // --- Radio: stacked choice cards, the pattern the rest of the app uses ---
  if (field.type === 'radio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {label}
        <div role="radiogroup" aria-label={field.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(field.options || []).map((option) => {
            const active = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                className="press focus-ring"
                onClick={() => onChange(option.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 50, padding: '11px 14px',
                  border: `1.5px solid ${active ? accent : borderColor}`, borderRadius: 'var(--radius-md)',
                  background: active ? `color-mix(in oklch, ${accent} 8%, transparent)` : 'var(--surface-1)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 20, height: 20, flexShrink: 0, borderRadius: 999,
                    border: `1.5px solid ${active ? accent : 'var(--surface-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {active && <span style={{ width: 10, height: 10, borderRadius: 999, background: accent }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: active ? 700 : 600, color: 'var(--fg-1)' }}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        {hint}
        {errorLine}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label}
      {field.type === 'select' ? (
        <select
          id={field.key}
          value={value}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          style={{ ...baseInput, borderColor }}
        >
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={field.key}
          value={value}
          rows={4}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          style={{ ...baseInput, borderColor, minHeight: 96, resize: 'vertical', lineHeight: 1.5 }}
        />
      ) : (
        <input
          id={field.key}
          type={inputType(field.type)}
          inputMode={field.type === 'number' ? 'numeric' : undefined}
          value={value}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          style={{ ...baseInput, borderColor }}
        />
      )}
      {hint}
      {errorLine}
    </div>
  );
}

function inputType(type) {
  switch (type) {
    case 'date': return 'date';
    case 'tel': return 'tel';
    case 'email': return 'email';
    case 'number': return 'number';
    default: return 'text';
  }
}
