import Icon from '../ui/Icon';
import { formatFileSize } from '../../lib/format';
import { attachmentRoutes } from '../../data/documentTypes';

// One document an application asks for.
//
// Which ways in are offered follows the document-type contract
// (attachmentRoutes): IDs and certificates connect straight from the Vault —
// no upload button — while anything only the citizen holds (a photo, a proof
// of address, a plan) is uploaded. An upload is filed in the Vault on its way
// through, so every route ends in the same place and government never asks
// twice for the same paper.

/**
 * @param {{
 *   doc: import('../../data/types').DocumentDef,
 *   attachment?: {status?: string, fileName?: string, size?: number, vaultDocId?: string},
 *   error?: string,
 *   accent?: string,
 *   readOnly?: boolean,
 *   onPick: () => void,
 *   onUseVault: () => void,
 *   onView?: () => void,
 *   onRemove?: () => void
 * }} props
 */
export default function DocumentSlot({
  doc, attachment, error, accent = 'var(--brand-600)', readOnly,
  onPick, onUseVault, onView, onRemove,
}) {
  const routes = attachmentRoutes(doc.accepts);
  const attached = attachment?.status === 'attached' || attachment?.status === 'fromVault';
  const fromVault = attachment?.status === 'fromVault';
  const borderColor = error ? 'var(--status-error)' : attached ? 'var(--status-success)' : 'var(--surface-border)';

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)',
      padding: '13px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* What is being asked for */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <Icon
          name={attached ? 'check-circle-2' : 'file-text'}
          size={18}
          color={attached ? 'var(--status-success)' : 'var(--fg-3)'}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, color: 'var(--fg-1)' }}>
            {doc.label}
            {!doc.required && <span style={{ color: 'var(--fg-4)', fontWeight: 600 }}> · optional</span>}
          </span>
          {doc.issuer && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-3)' }}>{doc.issuer}</span>
          )}
          {doc.hint && !attached && (
            <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fg-3)' }}>{doc.hint}</span>
          )}
        </span>
      </div>

      {attached ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* What is on file */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10,
            background: 'var(--status-success-bg)',
            border: '1px solid color-mix(in oklch, var(--status-success) 30%, transparent)',
          }}>
            <Icon
              name={fromVault ? 'folder-lock' : 'paperclip'}
              size={14}
              color="var(--status-success)"
              style={{ flexShrink: 0 }}
            />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attachment.fileName || 'Attached'}
            </span>
            {fromVault
              ? <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--fg-3)' }}>From Vault</span>
              : attachment.size != null && (
                <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--fg-3)' }}>{formatFileSize(attachment.size)}</span>
              )}
          </div>

          {!readOnly && (
            <div style={{ display: 'flex', gap: 8 }}>
              {onView && (
                <SlotButton icon="eye" label="View" onClick={onView} />
              )}
              {routes.upload && <SlotButton icon="refresh-cw" label="Replace" onClick={onPick} />}
              {routes.vault && <SlotButton icon="folder-lock" label="Vault" onClick={onUseVault} accent={accent} />}
              {onRemove && (
                <button
                  type="button"
                  className="press focus-ring"
                  onClick={onRemove}
                  aria-label={`Remove ${doc.label}`}
                  style={{
                    width: 40, minHeight: 38, flexShrink: 0, borderRadius: 10,
                    border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
                    color: 'var(--status-error)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name="trash-2" size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* The ways in, per the document-type contract */
        <div style={{ display: 'flex', gap: 8 }}>
          {routes.upload && (
            <button
              type="button"
              className="press focus-ring"
              onClick={onPick}
              style={{
                flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--surface-border)',
                background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon name="upload" size={13} />
              {doc.required ? 'Upload file' : 'Add file'}
            </button>
          )}
          {routes.vault && (
            <button
              type="button"
              className="press focus-ring"
              onClick={onUseVault}
              style={{
                flex: 1, minHeight: 40, borderRadius: 10,
                border: `1px solid color-mix(in oklch, ${accent} 35%, var(--surface-border))`,
                background: `color-mix(in oklch, ${accent} 8%, transparent)`,
                color: accent, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon name="folder-lock" size={13} />
              {routes.upload ? 'From Vault' : 'Connect with Vault'}
            </button>
          )}
        </div>
      )}

      {error && (
        <span role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--status-error)' }}>
          <Icon name="triangle-alert" size={13} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </span>
      )}
    </div>
  );
}

function SlotButton({ icon, label, onClick, accent }) {
  return (
    <button
      type="button"
      className="press focus-ring"
      onClick={onClick}
      style={{
        flex: 1, minHeight: 38, borderRadius: 10,
        border: `1px solid ${accent ? `color-mix(in oklch, ${accent} 35%, var(--surface-border))` : 'var(--surface-border)'}`,
        background: accent ? `color-mix(in oklch, ${accent} 8%, transparent)` : 'var(--surface-1)',
        color: accent || 'var(--fg-1)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  );
}
