// Conic-gradient progress ring (e.g. NIS contribution ring).
export default function RingProgress({ value, size = 96, thickness = 10, color = 'var(--agency-accent)', children }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `conic-gradient(${color} ${pct}%, var(--surface-4) ${pct}%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{
        width: size - thickness * 2, height: size - thickness * 2, borderRadius: '50%',
        background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
