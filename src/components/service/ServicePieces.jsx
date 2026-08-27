import Icon from '../ui/Icon';
import { formatGyd } from '../../lib/format';

// The small repeating pieces the three service shells share: section headings,
// note panels, key/value rows, the loading and failure states, and the fee
// table. Keeping them here is what makes View / Apply / Track look like one
// system across Cash Grants, Single Window and GRO.

/** Eyebrow + heading + supporting line. */
export function SectionHeading({ eyebrow, title, description, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {eyebrow && (
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase',
          color: accent || 'var(--fg-3)',
        }}>
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>
          {title}
        </h2>
      )}
      {description && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>{description}</p>
      )}
    </div>
  );
}

/** A tinted note — used for prerequisites, warnings and "what happens next". */
export function InfoPanel({ tone = 'info', icon, title, children, accent }) {
  const tones = {
    info: { bg: 'var(--status-info-bg)', fg: 'var(--status-info)' },
    success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
    warning: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
    error: { bg: 'var(--status-error-bg)', fg: 'var(--status-error)' },
    neutral: { bg: 'var(--surface-2)', fg: 'var(--fg-3)' },
    accent: { bg: `color-mix(in oklch, ${accent || 'var(--brand-600)'} 10%, transparent)`, fg: accent || 'var(--brand-600)' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div style={{
      display: 'flex', gap: 11, padding: '13px 14px', borderRadius: 'var(--radius-lg)', background: t.bg,
    }}>
      {icon && <Icon name={icon} size={17} color={t.fg} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {title && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</span>}
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{children}</span>
      </div>
    </div>
  );
}

/** A bordered card that groups rows, matching the app's list treatment. */
export function Card({ children, style }) {
  return (
    <div style={{
      border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

/** Label on the left, value on the right — the review and detail row. */
export function DetailRow({ label, value, last, mono }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid var(--surface-hairline)',
    }}>
      <span style={{ flex: '0 0 42%', fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-3)' }}>{label}</span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.4, fontWeight: 700, color: 'var(--fg-1)',
        textAlign: 'right', wordBreak: 'break-word',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  );
}

/** A numbered "how this works" list. */
export function StepList({ steps, accent }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map((step, i) => (
        <li key={step} style={{ display: 'flex', gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 24, height: 24, flexShrink: 0, borderRadius: 999,
              background: `color-mix(in oklch, ${accent || 'var(--brand-600)'} 14%, transparent)`,
              color: accent || 'var(--brand-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 800,
            }}
          >
            {i + 1}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', paddingTop: 3 }}>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** A bullet list of plain-language rules. */
export function BulletList({ items, icon = 'check', color = 'var(--status-success)' }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', gap: 10 }}>
          <Icon name={icon} size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The fee schedule. Splits what is payable on submission from what is only
 * payable once an application is approved, because those are very different
 * things to a citizen deciding whether to start.
 * @param {{fees: import('../../data/types').ServiceFee[], accent?: string}} props
 */
export function FeeTable({ fees, accent }) {
  const now = fees.filter((f) => f.mandatory);
  const later = fees.filter((f) => !f.mandatory);
  const total = (list) => list.reduce((s, f) => s + f.amountGyd, 0);

  const group = (list, heading, note) => list.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          {heading}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: accent || 'var(--fg-1)' }}>
          {formatGyd(total(list), { free: 'Free' })}
        </span>
      </div>
      <Card>
        {list.map((fee, i) => (
          <div key={fee.id} style={{
            display: 'flex', flexDirection: 'column', gap: 3, padding: '12px 14px',
            borderBottom: i < list.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{fee.label}</span>
              <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 800, color: fee.amountGyd === 0 ? 'var(--status-success)' : 'var(--fg-1)' }}>
                {formatGyd(fee.amountGyd, { free: 'Free' })}
              </span>
            </div>
            {fee.note && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-3)' }}>{fee.note}</span>}
          </div>
        ))}
      </Card>
      {note && <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--fg-4)' }}>{note}</span>}
    </div>
  );

  if (!fees.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {group(now, 'Payable when you apply')}
      {group(later, 'Payable if approved', 'These are quoted once the reviewing agencies have seen your application. You are never asked to pay them up front.')}
    </div>
  );
}

/** Full-height loading state, used while an endpoint call is in flight. */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '56px 20px' }}>
      <style>{'@keyframes svcSpin { to { transform: rotate(360deg); } }'}</style>
      <span
        aria-hidden="true"
        style={{
          width: 28, height: 28, borderRadius: 999,
          border: '2.5px solid var(--surface-4)', borderTopColor: 'var(--brand-600)',
          animation: 'svcSpin 0.9s linear infinite',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{label}</span>
    </div>
  );
}

/** Something went wrong, with the real message and a way to try again. */
export function ErrorState({ error, onRetry, title = 'We could not load this' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', padding: '44px 20px' }}>
      <span aria-hidden="true" style={{
        width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: 'var(--status-error-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="triangle-alert" size={21} color="var(--status-error)" />
      </span>
      <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 280 }}>
        {error?.message || 'Something went wrong. Try again in a moment.'}
      </p>
      {onRetry && (
        <button
          className="press focus-ring"
          onClick={onRetry}
          style={{
            marginTop: 6, minHeight: 40, padding: '0 18px', border: '1px solid var(--surface-border)',
            borderRadius: 999, background: 'var(--surface-1)', color: 'var(--fg-1)',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Nothing here yet. */
export function EmptyState({ icon = 'folder-open', title, body, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, textAlign: 'center',
      padding: '32px 22px', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-1)',
    }}>
      <span aria-hidden="true" style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20} color="var(--fg-3)" />
      </span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</p>
      {body && <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', maxWidth: 260 }}>{body}</p>}
      {action}
    </div>
  );
}
