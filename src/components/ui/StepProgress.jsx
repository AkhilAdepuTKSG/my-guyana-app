// Thin colored bar segments used for application-progress cards and wizard headers.
export default function StepProgress({ step, total, color = 'var(--agency-accent)' }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 5, borderRadius: 999,
          background: i < step ? color : 'var(--surface-4)',
          transition: 'background var(--dur-base) var(--ease-out)',
        }} />
      ))}
    </div>
  );
}
