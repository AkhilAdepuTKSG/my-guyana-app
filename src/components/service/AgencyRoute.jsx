import Icon from '../ui/Icon';
import { formatDate } from '../../lib/format';

// The multi-agency routing, as the citizen sees it: who has the application,
// what each of them is checking, and where it has got to. This is the whole
// point of a Single Window — one screen instead of six trips to six offices.

const REVIEW_STATE = {
  pending: { label: 'Waiting its turn', icon: 'clock', color: 'var(--fg-4)', bg: 'var(--surface-4)' },
  inReview: { label: 'Reviewing now', icon: 'loader', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  infoRequested: { label: 'Needs something from you', icon: 'triangle-alert', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  approved: { label: 'Approved', icon: 'check', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  rejected: { label: 'Could not approve', icon: 'x', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
  notApplicable: { label: 'Not required', icon: 'minus', color: 'var(--fg-4)', bg: 'var(--surface-4)' },
};

const ROLE_LABEL = {
  lead: 'Lead agency',
  reviewer: 'Reviewing',
  inspection: 'Site inspection',
  clearance: 'Clearance',
};

/**
 * @param {{
 *   reviews: (import('../../data/types').AgencyReview & {agency: import('../../data/types').Agency|null})[],
 *   compact?: boolean
 * }} props
 */
export default function AgencyRoute({ reviews, compact }) {
  if (!reviews?.length) return null;

  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
      {reviews.map((review, i) => {
        const state = REVIEW_STATE[review.status] || REVIEW_STATE.pending;
        const mark = review.agency?.mark || 'var(--brand-600)';
        const last = i === reviews.length - 1;
        return (
          <li key={review.id} style={{ display: 'flex', gap: 12 }}>
            {/* Rail: the agency mark, joined by a line to the next agency */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: `color-mix(in oklch, ${mark} 14%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: review.status === 'inReview' ? `1.5px solid ${mark}` : '1.5px solid transparent',
                }}
              >
                <Icon name={review.agency?.icon || 'building-2'} size={16} color={mark} />
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  style={{
                    flex: 1, width: 2, minHeight: compact ? 18 : 26, marginTop: 4, marginBottom: 4, borderRadius: 999,
                    background: review.status === 'approved' ? 'var(--status-success)' : 'var(--surface-4)',
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : compact ? 12 : 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, lineHeight: 1.35, color: 'var(--fg-1)' }}>
                    {review.agency?.shortName || review.agencyId}
                  </span>
                  <span style={{ display: 'block', marginTop: 1, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: mark }}>
                    {ROLE_LABEL[review.role] || 'Reviewing'}
                  </span>
                </span>
                <span style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 999, background: state.bg, color: state.color,
                  fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                }}>
                  <Icon name={state.icon} size={12} color="currentColor" />
                  {state.label}
                </span>
              </div>

              {!compact && (
                <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                  {review.purpose}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                {review.decidedAt ? (
                  <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Decided {formatDate(review.decidedAt)}</span>
                ) : review.startedAt ? (
                  <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>
                    With them since {formatDate(review.startedAt)} · {review.slaDays} working-day target
                  </span>
                ) : (
                  <span style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                    {review.slaDays} working-day target once it reaches them
                  </span>
                )}
              </div>

              {review.note && (
                <p style={{ margin: '7px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--fg-3)', fontStyle: 'italic' }}>
                  {review.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A one-line summary of where a routed application has got to. */
export function routeSummary(reviews) {
  if (!reviews?.length) return '';
  const approved = reviews.filter((r) => r.status === 'approved').length;
  const active = reviews.find((r) => r.status === 'inReview');
  const blocked = reviews.find((r) => r.status === 'rejected' || r.status === 'infoRequested');
  if (blocked) {
    return blocked.status === 'rejected'
      ? `${blocked.agency?.shortName || blocked.agencyId} could not approve this.`
      : `${blocked.agency?.shortName || blocked.agencyId} needs something from you.`;
  }
  if (approved === reviews.length) return `All ${reviews.length} agencies have approved.`;
  if (active) return `${approved} of ${reviews.length} approved — now with ${active.agency?.shortName || active.agencyId}.`;
  return `${approved} of ${reviews.length} agencies have approved.`;
}
