// The government identification strip.
//
// Every official portal carries one: it says whose site this is before anything
// else on the page does. It is not navigation and never scrolls away with the
// content — it sits above the whole application.
export default function GovBar({ height = 34 }) {
  return (
    <div
      role="banner"
      style={{
        height, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--gov-strip, #0b1c2e)',
        color: 'rgba(255,255,255,0.92)',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}
    >
      <span>Government of Guyana</span>
      <span style={{
        letterSpacing: '0.02em', textTransform: 'none',
        fontWeight: 600, color: 'rgba(255,255,255,0.72)',
      }}>
        An official government platform
      </span>
    </div>
  );
}
