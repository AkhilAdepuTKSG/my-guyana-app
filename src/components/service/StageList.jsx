import Icon from '../ui/Icon';

// The plain stage bar, for progress that is a straight line rather than a
// multi-agency routing — the General Register Office's registration stages, for
// instance, where one office moves an entry from lodged to approved.

/**
 * The simple stage bar used where there is no multi-agency routing — the GRO
 * registration stages, for instance.
 * @param {{stages: {id: string, label: string, note?: string, state: 'done'|'current'|'todo'}[], accent?: string}} props
 */
export default function StageList({ stages, accent = 'var(--brand-600)' }) {
  if (!stages?.length) return null;
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
      {stages.map((stage, i) => {
        const last = i === stages.length - 1;
        const done = stage.state === 'done';
        const current = stage.state === 'current';
        const color = done ? 'var(--status-success)' : current ? accent : 'var(--fg-4)';
        const bg = done ? 'var(--status-success-bg)' : current ? `color-mix(in oklch, ${accent} 14%, transparent)` : 'var(--surface-4)';
        return (
          <li key={stage.id} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28, height: 28, borderRadius: 999, flexShrink: 0, background: bg,
                  border: current ? `1.5px solid ${accent}` : '1.5px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name={done ? 'check' : current ? 'loader' : 'circle'} size={13} color={color} />
              </span>
              {!last && (
                <span aria-hidden="true" style={{ flex: 1, width: 2, minHeight: 16, margin: '4px 0', borderRadius: 999, background: done ? 'var(--status-success)' : 'var(--surface-4)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 16 }}>
              <span style={{
                display: 'block', fontSize: 13.5, lineHeight: 1.4,
                fontWeight: current ? 800 : 700,
                color: stage.state === 'todo' ? 'var(--fg-3)' : 'var(--fg-1)',
              }}>
                {stage.label}
              </span>
              {stage.note && (
                <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{stage.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
