// Shared presentational atoms for the auth mega-flow. Kept local to this
// folder (not in components/ui/) since these are styled to match the
// source's bespoke full-bleed auth screens rather than the app's general
// card/list chrome.
import Icon from '../../components/ui/Icon';

export function Screen({ children, onBack, padTop = 28, gap = 16, bg = 'var(--surface-1)', center = false, style }) {
  return (
    <div
      className="auth-screen"
      style={{
        position: 'absolute', inset: 0, overflowY: 'auto', background: bg,
        padding: center ? '0 28px' : `${padTop}px 20px 30px`,
        display: 'flex', flexDirection: 'column', gap,
        ...(center ? { alignItems: 'center', justifyContent: 'center', textAlign: 'center' } : {}),
        ...style,
      }}
    >
      {onBack && <BackButton onClick={onBack} />}
      {children}
    </div>
  );
}

export function BackButton({ onClick, dark }) {
  return (
    <button
      className="press focus-ring" onClick={onClick} aria-label="Back"
      style={{
        width: 34, height: 34, flexShrink: 0, borderRadius: 999, border: 'none',
        background: dark ? 'rgba(255,255,255,0.14)' : 'var(--surface-4)',
        color: dark ? '#fff' : 'var(--fg-2)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <Icon name="chevron-left" size={17} />
    </button>
  );
}

export function Heading({ eyebrow, title, sub, size = 24 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {eyebrow && (
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--brand-600)' }}>
          {eyebrow}
        </span>
      )}
      <h1 style={{ margin: 0, fontSize: size, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--fg-1)' }}>
        {title}
      </h1>
      {sub && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>{sub}</p>}
    </div>
  );
}

const TONE_COLORS = {
  brand: ['var(--brand-100)', 'var(--brand-600)'],
  success: ['var(--status-success-bg)', 'var(--status-success)'],
  warning: ['var(--status-warning-bg)', 'var(--status-warning)'],
  error: ['var(--status-error-bg)', 'var(--status-error)'],
  info: ['var(--status-info-bg)', 'var(--status-info)'],
  neutral: ['var(--surface-4)', 'var(--fg-2)'],
};

export function IconBadge({ name, tone = 'brand', size = 48, iconSize = 23 }) {
  const [bg, fg] = TONE_COLORS[tone] || TONE_COLORS.brand;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: 15, background: bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <Icon name={name} size={iconSize} color={fg} />
    </span>
  );
}

export function PrimaryButton({ children, busy, style, ...rest }) {
  return (
    <button
      className="press focus-ring" disabled={busy} {...rest}
      style={{
        width: '100%', minHeight: 52, border: 'none', borderRadius: 14,
        background: busy ? 'var(--brand-400)' : 'var(--brand-600)', color: '#fff',
        fontSize: 15, fontWeight: 800, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, style, ...rest }) {
  return (
    <button
      className="press focus-ring" {...rest}
      style={{
        width: '100%', minHeight: 48, border: '1px solid var(--surface-border)', borderRadius: 14,
        background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit', ...style,
      }}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, tone = 'var(--fg-3)', style, ...rest }) {
  return (
    <button
      className="press focus-ring" {...rest}
      style={{
        width: '100%', minHeight: 44, border: 'none', background: 'none', fontFamily: 'inherit',
        fontSize: 13.5, fontWeight: 700, color: tone, cursor: 'pointer', ...style,
      }}
    >
      {children}
    </button>
  );
}

export function ListCard({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

export function Row({ icon, iconBg = 'var(--surface-2)', iconFg = 'var(--brand-700)', iconRound = false, title, sub, onClick, border, right, tag }) {
  return (
    <button
      className="press focus-ring" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 66,
        padding: '13px 15px', border: border ? `1px solid ${border}` : 'none',
        borderBottom: border ? undefined : '1px solid var(--surface-hairline)',
        borderRadius: border ? 15 : 0,
        background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      {icon && (
        <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: iconRound ? 999 : 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={17} color={iconFg} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</span>
        {sub && <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>{sub}</span>}
      </span>
      {tag}
      {right !== undefined ? right : <Icon name="chevron-right" size={17} color="var(--fg-4)" />}
    </button>
  );
}

export function InfoRow({ icon, iconColor = 'var(--fg-4)', children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', background: 'var(--surface-1)', borderBottom: last ? undefined : '1px solid var(--surface-hairline)' }}>
      <Icon name={icon} size={16} color={iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{children}</span>
    </div>
  );
}

export function ErrorBox({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 13px', borderRadius: 12, background: 'var(--status-error-bg)' }}>
      <Icon name="triangle-alert" size={15} color="var(--status-error)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, fontWeight: 600, color: 'var(--fg-1)' }}>{children}</span>
    </div>
  );
}

export function InfoBox({ tone = 'info', icon, children, plain }) {
  const [bg, fg] = TONE_COLORS[tone] || TONE_COLORS.info;
  const resolvedIcon = icon || (tone === 'warning' ? 'triangle-alert' : tone === 'neutral' ? 'building-2' : 'search-x');
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 15, background: plain ? 'var(--surface-2)' : bg, border: plain ? 'none' : `1px solid ${fg}` }}>
      <Icon name={resolvedIcon} size={16} color={plain ? 'var(--fg-3)' : fg} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, fontWeight: 600, color: 'var(--fg-2)' }}>{children}</span>
    </div>
  );
}

export function DemoHint({ children }) {
  return <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>{children}</p>;
}

export function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>{hint}</span>}
    </div>
  );
}

export function textInputStyle(hasError, extra) {
  return {
    width: '100%', boxSizing: 'border-box', minHeight: 52, padding: '0 14px',
    borderRadius: 13, border: `1.5px solid ${hasError ? 'var(--status-error)' : 'var(--surface-border)'}`,
    background: 'var(--surface-2)', fontFamily: 'inherit', fontSize: 16, color: 'var(--fg-1)', outline: 'none',
    ...extra,
  };
}

export function Spacer() {
  return <div style={{ flex: 1 }} />;
}

export function Spinner({ size = 84, iconName = 'search-check', iconSize = 34, tone = 'brand' }) {
  const [bg, fg] = TONE_COLORS[tone] || TONE_COLORS.brand;
  return (
    <span aria-hidden="true" style={{ position: 'relative', width: size, height: size, borderRadius: 999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span aria-hidden="true" style={{ position: 'absolute', inset: -6, borderRadius: 999, border: '2px solid transparent', borderTopColor: fg, animation: 'faceArcSpin 1.1s linear infinite' }} />
      <Icon name={iconName} size={iconSize} color={fg} />
    </span>
  );
}
