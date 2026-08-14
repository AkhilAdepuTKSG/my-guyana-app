export default function Button({
  children, variant = 'primary', size = 'md', fullWidth, icon, iconRight,
  className = '', style, ...rest
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 'var(--radius-pill)', fontWeight: 700, border: '1px solid transparent',
    width: fullWidth ? '100%' : undefined,
    padding: size === 'lg' ? '16px 24px' : size === 'sm' ? '8px 14px' : '13px 20px',
    fontSize: size === 'lg' ? 'var(--text-base)' : size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
  };
  const variants = {
    primary: { background: 'var(--agency-accent)', color: 'var(--fg-on-accent)' },
    secondary: { background: 'var(--surface-4)', color: 'var(--fg-1)' },
    outline: { background: 'transparent', color: 'var(--fg-1)', borderColor: 'var(--surface-border)' },
    ghost: { background: 'transparent', color: 'var(--agency-accent)' },
    danger: { background: 'var(--status-error)', color: '#fff' },
  };
  return (
    <button
      className={`press focus-ring ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
