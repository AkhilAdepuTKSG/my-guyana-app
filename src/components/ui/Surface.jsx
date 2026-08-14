export default function Surface({ children, interactive, level = 1, style, className = '', ...rest }) {
  const bg = level === 2 ? 'var(--surface-2)' : level === 4 ? 'var(--surface-4)' : 'var(--surface-1)';
  return (
    <div
      className={`${interactive ? 'interactive' : ''} ${className}`}
      style={{
        position: 'relative',
        background: bg,
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: level === 4 ? 'var(--shadow-sm)' : 'var(--shadow-md)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
