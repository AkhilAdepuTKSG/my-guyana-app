import { useEffect, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { useAppState } from '../../state/AppStateContext';
import { personalRows } from '../../lib/profileFields';

// Personal Information — the full page (backlog 2.3–2.5). Everything the
// government record supplied is shown filled and locked; whatever it could not
// supply is an editable field carrying a "Required" badge until it is filled.
// Saving is OTP-gated like every change in the app; once every required field
// has a value the profile is complete and the avatar dot, banner and section
// badge all clear (they read the same data).
const inputStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
  border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
};

export default function PersonalInfoPage() {
  const { isOpen, closeOverlay, user, updateUser, requireOtp, addNotification, showToast } = useAppState();
  const open = isOpen('personalInfo');

  const [vals, setVals] = useState({});
  useEffect(() => {
    if (open) setVals({ ...(user?.profile || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const rows = personalRows(user);
  const missingStored = rows.filter((r) => r.missing).length;
  const locked = rows.filter((r) => r.fromGov || r.readOnly);
  const editable = rows.filter((r) => !r.fromGov && !r.readOnly);
  const stillMissing = editable.filter((r) => r.required && !(vals[r.id] || '').trim());
  const canSave = stillMissing.length === 0;

  const setVal = (id) => (e) => setVals((v) => ({ ...v, [id]: e.target.value }));

  const save = () => {
    if (!canSave) { showToast(`Fill in ${stillMissing.map((r) => r.label.toLowerCase()).join(', ')}`); return; }
    requireOtp({
      title: 'Confirm your details',
      confirmLabel: 'Save',
      onConfirm: () => {
        const patch = {};
        editable.forEach((r) => { const v = (vals[r.id] || '').trim(); if (v) patch[r.id] = v; });
        updateUser({ profile: { ...(user?.profile || {}), ...patch }, profileComplete: true });
        if (missingStored > 0) {
          addNotification({
            agency: 'mops', icon: 'user-round-check', title: 'Profile completed',
            body: 'Thanks — your personal records and services are unlocking across My Guyana.',
          });
          showToast('Profile completed — your records are unlocking');
        } else {
          showToast('Details saved');
        }
        closeOverlay('personalInfo');
      },
    });
  };

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('personalInfo')}
      title="Personal Information"
      subtitle={missingStored > 0 ? `${missingStored} required ${missingStored === 1 ? 'detail' : 'details'} missing` : 'Your details'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
          {missingStored > 0
            ? 'Everything government already holds about you is filled in and locked. Only the details marked Required are still needed.'
            : 'Everything here came from your government record. Update the details you provided yourself any time.'}
        </p>

        {/* From the record — filled and locked */}
        {locked.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>From your government record</h3>
            <div style={{ border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden' }}>
              {locked.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: i < locked.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}>
                  <Icon name={r.icon} size={16} color="var(--fg-3)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--fg-3)' }}>{r.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right', wordBreak: 'break-word' }}>{r.value || '—'}</span>
                  <Icon name="lock" size={13} color="var(--fg-4)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>
              To change a detail held by government, visit the agency that issued your document — it cannot be changed here.
            </span>
          </div>
        )}

        {/* What the record could not supply — editable, Required where it matters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Your details</h3>
          {editable.map((r) => {
            const empty = !(vals[r.id] || '').trim();
            const flag = r.required && empty;
            return (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>{r.label}</label>
                  {flag ? (
                    <span style={{ minHeight: 18, padding: '0 7px', borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Required</span>
                  ) : !r.required ? (
                    <span style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 600 }}>Optional</span>
                  ) : null}
                </div>
                <input
                  type={r.type || 'text'}
                  value={vals[r.id] || ''}
                  onChange={setVal(r.id)}
                  placeholder={r.placeholder}
                  aria-label={r.label}
                  style={{ ...inputStyle, borderColor: flag ? 'var(--status-error)' : 'var(--surface-border)' }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Button fullWidth onClick={save} style={{ opacity: canSave ? 1 : 0.55 }}>
            {missingStored > 0 ? 'Save and complete my profile' : 'Save'}
          </Button>
          {!canSave && (
            <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)' }}>
              {stillMissing.length} required {stillMissing.length === 1 ? 'detail' : 'details'} still to fill in
            </span>
          )}
        </div>
      </div>
    </PageOverlay>
  );
}
