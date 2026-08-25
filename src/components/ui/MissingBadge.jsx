// Small count badge for a section that still has missing/pending fields —
// LinkedIn-style alert so the citizen can see at a glance where to click
// (backlog 2.4). Renders nothing when there is nothing pending.
export default function MissingBadge({ count }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} missing ${count === 1 ? 'field' : 'fields'}`}
      style={{
        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
        background: 'var(--status-error)', color: '#fff', fontSize: 10.5, fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {count}
    </span>
  );
}
