import Icon from '../ui/Icon';

// Document progress, by name.
//
// A single "documents complete" tick tells a citizen nothing when something is
// missing — they still have to open the application to find out what. This
// names every document the application asks for and marks each one, so the
// outstanding item is readable at a glance from a list.

const STATE = {
  attached: { icon: 'check', color: 'var(--status-success)', bg: 'var(--status-success-bg)', border: 'var(--status-success)' },
  fromVault: { icon: 'folder-lock', color: 'var(--status-success)', bg: 'var(--status-success-bg)', border: 'var(--status-success)' },
  rejected: { icon: 'x', color: 'var(--status-error)', bg: 'var(--status-error-bg)', border: 'var(--status-error)' },
  missing: { icon: 'circle', color: 'var(--fg-4)', bg: 'var(--surface-2)', border: 'var(--surface-border)' },
  optional: { icon: 'minus', color: 'var(--fg-4)', bg: 'var(--surface-2)', border: 'var(--surface-border)' },
};

/**
 * Normalise the two shapes documents arrive in — the definition list plus an
 * attachment map while an application is being filled in, or the stored
 * document rows once it has been submitted.
 * @param {{
 *   docs?: import('../../data/types').DocumentDef[],
 *   attachments?: Record<string, {status?: string}>,
 *   documents?: import('../../data/types').AttachedDocument[]
 * }} args
 * @returns {{key: string, label: string, required: boolean, status: string}[]}
 */
export function documentStates({ docs, attachments, documents }) {
  if (documents?.length) {
    return documents.map((d) => {
      const required = d.required !== false;
      const status = d.status || 'missing';
      return {
        key: d.docId,
        label: d.label,
        required,
        // An optional document nobody attached is not outstanding — it reads as
        // "not needed" rather than as a gap.
        status: !required && status === 'missing' ? 'optional' : status,
      };
    });
  }
  return (docs || []).map((d) => ({
    key: d.id,
    label: d.label,
    required: !!d.required,
    status: attachments?.[d.id]?.status || (d.required ? 'missing' : 'optional'),
  }));
}

/**
 * A row of named chips, one per document.
 * @param {{
 *   docs?: import('../../data/types').DocumentDef[],
 *   attachments?: Record<string, {status?: string}>,
 *   documents?: import('../../data/types').AttachedDocument[],
 *   accent?: string,
 *   compact?: boolean
 * }} props
 */
export default function DocumentProgress({ docs, attachments, documents, compact }) {
  const rows = documentStates({ docs, attachments, documents })
    // An untouched optional document is noise on a summary — drop it there,
    // but keep it in the full list so the citizen can still see it exists.
    .filter((r) => (compact ? r.status !== 'optional' : true));

  if (!rows.length) return null;

  return (
    <ul
      aria-label="Documents"
      style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}
    >
      {rows.map((row) => {
        const state = STATE[row.status] || STATE.missing;
        return (
          <li
            key={row.key}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: compact ? '3px 8px' : '5px 10px',
              borderRadius: 999,
              border: `1px solid ${state.border}`,
              background: state.bg,
              color: 'var(--fg-1)',
              fontSize: compact ? 10.5 : 11.5,
              fontWeight: 700,
              maxWidth: '100%',
            }}
          >
            <Icon name={state.icon} size={compact ? 10 : 12} color={state.color} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "3 of 5 documents on file" — the one-line version. */
export function documentSummary({ docs, attachments, documents }) {
  const rows = documentStates({ docs, attachments, documents }).filter((r) => r.required);
  if (!rows.length) return null;
  const done = rows.filter((r) => ['attached', 'fromVault'].includes(r.status)).length;
  const outstanding = rows.filter((r) => !['attached', 'fromVault'].includes(r.status));
  return {
    done,
    total: rows.length,
    outstanding: outstanding.map((r) => r.label),
    label: outstanding.length === 0
      ? `All ${rows.length} documents on file`
      : `${done} of ${rows.length} documents — still needed: ${outstanding.join(', ')}`,
  };
}
