import Icon from './Icon';

// The recurring "icon chip + title/subtitle + trailing chevron or status pill"
// row pattern used for actions, notifications, documents, activity, search results.
export default function ListRow({
  icon, iconColor = 'var(--agency-accent)', iconBg = 'var(--agency-accent-soft)',
  title, subtitle, trailing, chevron = true, onClick, style,
}) {
  return (
    <div
      className={onClick ? 'press focus-ring' : ''}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '14px 4px', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {icon && (
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--radius-md)', background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={icon} size={19} color={iconColor} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-1)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {trailing}
      {chevron && onClick && <Icon name="chevron-right" size={18} color="var(--fg-4)" />}
    </div>
  );
}
