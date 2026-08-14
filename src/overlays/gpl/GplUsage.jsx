import PageOverlay from '../../components/ui/PageOverlay';
import { useAppState } from '../../state/AppStateContext';
import { formatGyd, GPL_METER } from './gplShared';

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Builds the trailing 12 calendar-month labels, ending at `endMonthIndex`
// (0-11), to line up against a 12-entry usageKwh array oldest-to-newest.
function trailingMonthLabels(endMonthIndex) {
  const out = [];
  for (let i = 11; i >= 0; i--) {
    out.push(MONTH_LABELS[(endMonthIndex - i + 12) % 12]);
  }
  return out;
}

export default function GplUsage() {
  const { isOpen, closeOverlay, persona } = useAppState();
  const open = isOpen('gplUsage');
  const gpl = persona.gpl;

  if (!gpl) {
    return (
      <PageOverlay open={open} onClose={() => closeOverlay('gplUsage')} title="Consumption" agency="gpl">
        <div className="ds-body">No GPL account is linked yet.</div>
      </PageOverlay>
    );
  }

  const usage = gpl.usageKwh || [];
  const dueMonth = gpl.dueDate ? new Date(gpl.dueDate + 'T00:00:00').getMonth() : new Date().getMonth();
  // The bill due date reads for the month after the billed usage period.
  const currentMonthIndex = (dueMonth - 1 + 12) % 12;
  const labels = trailingMonthLabels(currentMonthIndex);
  const max = Math.max(...usage, 1);

  const current = usage[usage.length - 1] ?? 0;
  const previous = usage[usage.length - 2] ?? current;
  const pctChange = previous ? Math.round(((current - previous) / previous) * 100) : 0;
  const avg = usage.length ? Math.round(usage.reduce((a, b) => a + b, 0) / usage.length) : 0;
  const dailyAvg = (current / 30).toFixed(1);
  const rate = current ? gpl.balance / current : 50;
  const nextBillEstimate = formatGyd(rate * avg);

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('gplUsage')} title="Consumption" subtitle={GPL_METER} agency="gpl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, borderRadius: 18, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', color: 'var(--fg-1)' }}>{current}</span>
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, color: 'var(--fg-2)', paddingBottom: 5 }}>
              kWh this period<br />
              {pctChange === 0 ? 'about the same as last month' : `${pctChange > 0 ? 'up' : 'down'} ${Math.abs(pctChange)}% on last month`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto' }}>
            {usage.map((kwh, i) => {
              const isLast = i === usage.length - 1;
              return (
                <div key={i} style={{ flex: '1 0 22px', minWidth: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isLast ? 'var(--fg-1)' : 'var(--fg-3)' }}>{kwh}</span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: '100%', height: `${Math.max(6, Math.round((kwh / max) * 100))}%`,
                      borderRadius: '8px 8px 3px 3px',
                      background: isLast ? 'var(--agency-accent)' : 'color-mix(in oklch, var(--agency-accent) 28%, transparent)',
                    }}
                  />
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', color: isLast ? 'var(--fg-1)' : 'var(--fg-3)' }}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
          {[
            { label: 'This period', value: `${current} kWh`, note: labels[labels.length - 1] ? `Month of ${labels[labels.length - 1]}` : 'Current period' },
            { label: 'Daily average', value: `${dailyAvg} kWh`, note: pctChange === 0 ? 'Steady with last month' : `${pctChange > 0 ? 'Up' : 'Down'} ${Math.abs(pctChange)}% on last month` },
            { label: '12-month average', value: `${avg} kWh`, note: 'Typical monthly use' },
            { label: 'Next bill estimate', value: nextBillEstimate, note: 'If usage holds' },
          ].map((r) => (
            <div key={r.label} style={{ padding: 14, borderBottom: '1px solid var(--surface-hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{r.label}</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 11.5, color: 'var(--fg-3)' }}>{r.note}</span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)', flexShrink: 0 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </PageOverlay>
  );
}
