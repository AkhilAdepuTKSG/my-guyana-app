import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';

const TITLES = {
  choose: 'Resolve missing contribution',
  upload: 'Upload payment slip',
  escalate: 'Escalate employer fault',
};

export default function ContributionReview() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('contribReview');
  const [view, setView] = useState('choose'); // choose | upload | escalate
  const [attached, setAttached] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) { setView('choose'); setAttached(false); setNote(''); }
  }, [open]);

  const close = () => closeOverlay('contribReview');

  const submitUpload = () => {
    closeOverlay('contribReview');
    showToast('Slip submitted for review');
  };

  const submitEscalate = () => {
    closeOverlay('contribReview');
    showToast('Employer fault report submitted');
  };

  return (
    <PageOverlay
      open={open}
      onClose={close}
      title={TITLES[view]}
      headerRight={view !== 'choose' ? (
        <button
          className="press focus-ring"
          onClick={() => setView('choose')}
          aria-label="Back to options"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--agency-accent-strong)' }}
        >
          Back
        </button>
      ) : undefined}
    >
      {view === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 className="ds-h3" style={{ margin: 0, fontSize: 18 }}>April contribution missing</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                Choose how you'd like to resolve this before it affects your benefits.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="press focus-ring"
              onClick={() => setView('upload')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="receipt" size={17} color="var(--agency-accent-strong)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Upload a payment slip</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>If you or your employer already paid this contribution.</span>
              </span>
              <Icon name="chevron-right" size={16} color="var(--fg-4)" />
            </button>
            <button
              className="press focus-ring"
              onClick={() => setView('escalate')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--status-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="building-2" size={17} color="var(--status-error)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Escalate as employer fault</span>
                <span style={{ display: 'block', marginTop: 1, fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>Report that your employer did not file or pay this contribution.</span>
              </span>
              <Icon name="chevron-right" size={16} color="var(--fg-4)" />
            </button>
          </div>
        </div>
      )}

      {view === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            Attach the payment slip or receipt showing the April 2026 NIS contribution.
          </p>
          <button
            className="press focus-ring"
            onClick={() => setAttached(true)}
            style={{
              width: '100%', minHeight: 96, borderRadius: 14, border: `1px dashed ${attached ? 'var(--status-success)' : 'var(--surface-border)'}`,
              background: attached ? 'var(--status-success-bg)' : 'var(--surface-2)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            }}
          >
            <Icon name={attached ? 'check-circle-2' : 'upload'} size={22} color={attached ? 'var(--status-success)' : 'var(--fg-3)'} />
            <span style={{ fontSize: 13, fontWeight: 700, color: attached ? 'var(--status-success)' : 'var(--fg-2)' }}>
              {attached ? 'payment-slip.pdf attached' : 'Tap to attach a file'}
            </span>
          </button>
          <Button fullWidth disabled={!attached} style={{ opacity: attached ? 1 : 0.5 }} onClick={submitUpload}>Submit slip</Button>
        </div>
      )}

      {view === 'escalate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            Tell NIS why you believe your employer is responsible for this missing contribution.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="escalate-note" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>What happened?</label>
            <textarea
              id="escalate-note"
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. payroll was deducted but not filed with NIS."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', fontSize: 16, lineHeight: 1.5, color: 'var(--fg-1)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <Button fullWidth disabled={!note.trim()} style={{ opacity: note.trim() ? 1 : 0.5 }} onClick={submitEscalate}>Send to NIS</Button>
        </div>
      )}
    </PageOverlay>
  );
}
