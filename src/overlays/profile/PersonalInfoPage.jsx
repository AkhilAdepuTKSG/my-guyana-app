import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { profileSections } from '../../lib/profileFields';

// Personal information — the full page, laid out as the Final design: a
// "‹ Home" back chip, then four cards (Identity & contact · Demographics ·
// Family · Employment), each with an Edit link that turns its editable rows
// into inputs. Values the government record supplied are locked; empty values
// show "--" — except a field that blocks profile completion, which shows the
// red Required pill (backlog 2.3–2.5). Saving is OTP-gated like every change.
// Editing is hidden on request (code and functionality kept): the Edit links
// only appear on a card that still has a missing REQUIRED field, so profile
// completion (e.g. John's address) keeps working. Flip to true to show Edit
// on every card again.
const ALLOW_EDITS = false;

const inputStyle = {
  width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '10px 12px',
  border: '1px solid var(--surface-border)', borderRadius: 10, background: 'var(--surface-2)',
  fontFamily: 'inherit', fontSize: 14.5, color: 'var(--fg-1)', outline: 'none',
};

export default function PersonalInfoPage() {
  const { isOpen, closeOverlay, user, persona, screen, updateUser, requireOtp, addNotification, showToast } = useAppState();
  const open = isOpen('personalInfo');

  const [editing, setEditing] = useState(null); // section id being edited
  const [vals, setVals] = useState({});
  useEffect(() => {
    if (open) { setEditing(null); setVals({}); }
  }, [open]);

  if (!open) return null;

  const sections = profileSections(user, persona);
  const missingBefore = sections.flatMap((s) => s.fields).filter((f) => f.missing).length;
  const backLabel = screen === 'home' ? 'Home' : 'Back';

  const startEdit = (sec) => {
    const v = {};
    sec.fields.forEach((f) => {
      if (f.locked) return;
      v[f.id] = user?.profile?.[f.id] || (f.source === 'default' ? f.value : '');
    });
    setVals(v);
    setEditing(sec.id);
  };
  const cancelEdit = () => { setEditing(null); setVals({}); };
  const setVal = (id) => (e) => setVals((v) => ({ ...v, [id]: e.target.value }));

  const saveEdit = (sec) => {
    const editable = sec.fields.filter((f) => !f.locked);
    const stillMissing = editable.filter((f) => f.required && !(vals[f.id] || '').trim());
    if (stillMissing.length) { showToast(`Fill in ${stillMissing.map((f) => f.label.toLowerCase()).join(', ')}`); return; }
    requireOtp({
      title: 'Confirm your details',
      confirmLabel: 'Save',
      onConfirm: () => {
        const patch = {};
        editable.forEach((f) => { const v = (vals[f.id] || '').trim(); if (v) patch[f.id] = v; });
        const nextProfile = { ...(user?.profile || {}), ...patch };
        const missingAfter = profileSections({ ...user, profile: nextProfile }, persona)
          .flatMap((s) => s.fields).filter((f) => f.missing).length;
        updateUser({ profile: nextProfile, profileComplete: missingAfter === 0 });
        if (missingBefore > 0 && missingAfter === 0) {
          addNotification({
            agency: 'mops', icon: 'user-round-check', title: 'Profile completed',
            body: 'Thanks — your personal records and services are unlocking across My Guyana.',
          });
          showToast('Profile completed — your records are unlocking');
        } else {
          showToast('Details saved');
        }
        setEditing(null); setVals({});
      },
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', animation: 'pageSlideIn var(--dur-slow) var(--ease-emphasis)' }}>
      {/* Header — just the way back, as in the design */}
      <div style={{ flexShrink: 0, padding: '14px 16px 10px', background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-hairline)' }}>
        <button
          className="press focus-ring" onClick={() => closeOverlay('personalInfo')} aria-label={`Back to ${backLabel}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 36, padding: '0 14px 0 10px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Icon name="chevron-left" size={16} />{backLabel}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'var(--fg-1)' }}>Personal information</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)' }}>
            {persona.verified ? 'Identity verified. ' : ''}
            {ALLOW_EDITS || missingBefore > 0
              ? 'Update any of these and save when you are done.'
              : 'These details come from your government record and your profile.'}
            {missingBefore > 0 ? ` ${missingBefore} required ${missingBefore === 1 ? 'detail is' : 'details are'} still needed.` : ''}
          </p>
        </div>

        {sections.map((sec) => {
          const isEditing = editing === sec.id;
          return (
            <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="surface" style={{ padding: '16px 16px 4px', borderRadius: 18, display: 'flex', flexDirection: 'column' }}>
                {/* Card header: title + Edit (or Cancel / Save while editing) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--surface-hairline)' }}>
                  <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--fg-1)' }}>{sec.title}</h2>
                  {isEditing ? (
                    <>
                      <button className="press focus-ring" onClick={cancelEdit} style={{ minHeight: 32, padding: '0 12px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      <button className="press focus-ring" onClick={() => saveEdit(sec)} style={{ minHeight: 32, padding: '0 14px', borderRadius: 999, border: 'none', background: 'var(--brand-600)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    </>
                  ) : (ALLOW_EDITS || sec.fields.some((f) => f.missing)) ? (
                    <button className="press focus-ring" onClick={() => startEdit(sec)} aria-label={`Edit ${sec.title}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '4px 2px', color: 'var(--fg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Icon name="pencil" size={14} />Edit
                    </button>
                  ) : null}
                </div>

                {sec.fields.map((f, i) => {
                  const last = i === sec.fields.length - 1;
                  const border = last ? 'none' : '1px solid var(--surface-hairline)';
                  if (isEditing && !f.locked) {
                    const empty = !(vals[f.id] || '').trim();
                    const flag = f.required && empty;
                    return (
                      <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 0', borderBottom: border }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)' }}>{f.label}</label>
                          {flag && <span style={{ minHeight: 18, padding: '0 7px', borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Required</span>}
                        </div>
                        <input
                          type={f.type || 'text'} value={vals[f.id] || ''} onChange={setVal(f.id)} placeholder={f.placeholder || ''} aria-label={f.label}
                          style={{ ...inputStyle, borderColor: flag ? 'var(--status-error)' : 'var(--surface-border)' }}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 46, padding: '12px 0', borderBottom: border }}>
                      <span style={{ flexShrink: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--fg-2)' }}>{f.label}</span>
                      {f.display ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, textAlign: 'right', fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)', wordBreak: 'break-word' }}>
                          {f.display}
                          {isEditing && f.locked && <Icon name="lock" size={12} color="var(--fg-4)" />}
                        </span>
                      ) : f.missing ? (
                        <span style={{ minHeight: 18, padding: '0 7px', borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Required</span>
                      ) : (
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-3)' }}>--</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {sec.note && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 16, background: 'var(--status-warning-bg)' }}>
                  <Icon name="clock" size={17} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{sec.note}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
