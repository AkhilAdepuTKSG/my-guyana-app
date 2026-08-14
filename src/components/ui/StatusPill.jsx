const TONES = {
  success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  warning: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  error: { bg: 'var(--status-error-bg)', fg: 'var(--status-error)' },
  info: { bg: 'var(--status-info-bg)', fg: 'var(--status-info)' },
  neutral: { bg: 'var(--surface-4)', fg: 'var(--fg-3)' },
};

export default function StatusPill({ tone = 'neutral', children }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--text-2xs)', fontWeight: 700,
      background: t.bg, color: t.fg, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
