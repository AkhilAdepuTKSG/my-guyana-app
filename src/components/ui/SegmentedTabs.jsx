export default function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--surface-4)', borderRadius: 'var(--radius-pill)',
      padding: 4, gap: 4,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            className="press focus-ring"
            onClick={() => onChange(tab.value)}
            style={{
              flex: 1, border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '9px 12px', fontSize: 'var(--text-xs)', fontWeight: 700,
              background: isActive ? 'var(--surface-1)' : 'transparent',
              color: isActive ? 'var(--fg-1)' : 'var(--fg-3)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
