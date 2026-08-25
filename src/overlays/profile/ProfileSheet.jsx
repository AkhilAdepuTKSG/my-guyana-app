import { useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import MissingBadge from '../../components/ui/MissingBadge';
import { useAppState } from '../../state/AppStateContext';
import { useRegionName } from './regionStore';
import BiometricSettings from './BiometricSettings';

export default function ProfileSheet() {
  const { isOpen, closeOverlay, openOverlay, navigate, persona, user, updateUser, requireOtp, addNotification, showToast, signOut: endSession } = useAppState();
  const open = isOpen('profile');
  const region = useRegionName();
  const gov = user?.gov || null;

  // --- Personal Information (backlog 2.4) ---
  // A value can come from the government record (gov) or from what the citizen
  // filled in themselves (user.profile). While the account says the profile is
  // incomplete, every required field with no value anywhere counts as missing
  // and badges the section — driven off the actual data, not a flag.
  const filled = user?.profile || {};
  const personalRows = [
    { id: 'email', icon: 'mail', label: 'Email', value: filled.email || gov?.email, required: true },
    { id: 'phone', icon: 'smartphone', label: 'Mobile', value: filled.phone || gov?.phone, required: true },
    { id: 'address', icon: 'map-pin', label: 'Address', value: filled.address || gov?.address, required: true },
    { id: 'occupation', icon: 'briefcase', label: 'Occupation', value: filled.occupation, required: true },
    { id: 'tin', icon: 'receipt', label: 'TIN', value: gov?.tin },
  ];
  const profileIncomplete = !!user && user.profileComplete === false;
  const missingPersonal = profileIncomplete
    ? personalRows.filter((r) => r.required && !r.value).length
    : 0;
  // Filled rows always show; missing required ones surface while incomplete so
  // the citizen sees exactly which fields are pending.
  const visibleRows = personalRows.filter((r) => r.value || (profileIncomplete && r.required));

  // Access my e-ID — the e-ID's home is the Vault/profile, not Home (backlog 2.2).
  const openEid = () => {
    closeOverlay('profile');
    if (persona.eidStatus === 'issued') openOverlay('eidCard');
    else navigate('vault'); // application in progress — the card lives in the Vault
  };

  // --- Complete the missing fields in a bottom sheet (backlog 2.5) ---
  // Only what could NOT be fetched from the master record is asked for; the
  // pre-filled fields never reappear as a task.
  const missingRows = profileIncomplete ? personalRows.filter((r) => r.required && !r.value) : [];
  const [fixOpen, setFixOpen] = useState(false);
  const [fixVals, setFixVals] = useState({});
  const openFix = () => { setFixVals({}); setFixOpen(true); };
  const setFix = (key) => (e) => setFixVals((v) => ({ ...v, [key]: e.target.value }));
  const fixComplete = missingRows.every((r) => (fixVals[r.id] || '').trim());

  const saveFix = () => {
    if (!fixComplete) { showToast('Fill in each missing detail'); return; }
    requireOtp({
      title: 'Confirm your details',
      confirmLabel: 'Save and finish',
      onConfirm: () => {
        const patch = {};
        missingRows.forEach((r) => { patch[r.id] = fixVals[r.id].trim(); });
        updateUser({ profile: { ...filled, ...patch }, profileComplete: true });
        addNotification({
          agency: 'mops', icon: 'user-round-check', title: 'Profile completed',
          body: 'Thanks — your personal records and services are unlocking across My Guyana.',
        });
        setFixOpen(false);
        setFixVals({});
        showToast('Profile completed — your records are unlocking');
      },
    });
  };

  const goVault = () => {
    closeOverlay('profile');
    navigate('vault');
  };

  const startVerify = () => {
    closeOverlay('profile');
    openOverlay('idv', { purpose: 'sensitive' });
  };

  const signOut = () => {
    closeOverlay('profile');
    endSession(); // clears the persisted session → app returns to the auth gate
  };

  return (
    <>
    <Sheet open={open} onClose={() => closeOverlay('profile')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Identity summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--agency-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 19, flexShrink: 0 }}>
            {persona.initials}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.2 }}>{persona.name}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--surface-4)', fontSize: 12, fontWeight: 700, color: 'var(--fg-2)' }}>
                <Icon name="badge-check" size={13} color="var(--fg-3)" />
                {persona.verified ? 'Identity verified' : 'Not yet verified'}
              </span>
              {persona.nisNumber && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--surface-4)', fontSize: 12, fontWeight: 700, color: 'var(--fg-2)' }}>
                  <Icon name="shield-check" size={13} color="var(--fg-3)" />
                  NIS {persona.nisNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Access my e-ID — the first item in the profile (backlog 2.2). */}
        {persona.eidStatus !== 'none' && (
          <button
            className="press focus-ring"
            onClick={openEid}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--brand-100)', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="fingerprint" size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Access my e-ID</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>
                {persona.eidStatus === 'issued' ? 'View and present your digital ID' : 'Application in progress — see it in your Vault'}
              </span>
            </span>
            <Icon name="chevron-right" size={17} color="var(--fg-3)" />
          </button>
        )}

        {/* Your agencies — the pin/manage sheet stays reachable now that the
            Home hero (Final design) carries only the pinned tiles + "See all". */}
        <button
          className="press focus-ring"
          onClick={() => { closeOverlay('profile'); openOverlay('addAgency'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layout-grid" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Your agencies</span>
            <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Pin the ones you use most — they lead your Home</span>
          </span>
          <Icon name="chevron-right" size={17} color="var(--fg-3)" />
        </button>

        {/* Personal Information — badged while fields are pending (backlog 2.4);
            tapping it opens the fill-in bottom sheet with only what's missing (2.5). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className={missingPersonal > 0 ? 'press focus-ring' : ''}
            onClick={missingPersonal > 0 ? openFix : undefined}
            aria-label={missingPersonal > 0 ? `Personal Information — ${missingPersonal} missing, tap to complete` : 'Personal Information'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: missingPersonal > 0 ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Personal Information</h2>
            <MissingBadge count={missingPersonal} />
            {missingPersonal > 0 && <Icon name="chevron-right" size={13} color="var(--fg-4)" />}
          </button>
          {visibleRows.length > 0 && (
            <div style={{ border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden' }}>
              {visibleRows.map((r, i) => (
                <div
                  key={r.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: i < visibleRows.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}
                >
                  <Icon name={r.icon} size={16} color="var(--fg-3)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--fg-3)' }}>{r.label}</span>
                  {r.value ? (
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', textAlign: 'right', wordBreak: 'break-word' }}>{r.value}</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-error)' }}>Not added yet</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {missingPersonal > 0 && (
            <button
              className="press focus-ring"
              onClick={openFix}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 46, padding: '12px 14px', border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Icon name="user-round-pen" size={17} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                Complete your details — {missingPersonal} {missingPersonal === 1 ? 'field' : 'fields'} missing
              </span>
              <Icon name="chevron-right" size={16} />
            </button>
          )}
        </div>

        {/* Region */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Region</h2>
          <button
            className="press focus-ring"
            onClick={() => openOverlay('region')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{region}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 13.5, fontWeight: 700, color: 'var(--agency-accent)' }}>
              Change<Icon name="chevron-right" size={15} />
            </span>
          </button>
          <button
            className="press focus-ring"
            onClick={() => showToast('Location access is simulated in this preview')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 46, padding: '12px 14px', border: 'none', borderRadius: 14, background: 'var(--agency-accent-soft)', color: 'var(--agency-accent-strong)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="locate-fixed" size={17} />
            Use my current location
          </button>
        </div>

        {/* Vault shortcut */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Your documents</h2>
          <button
            className="press focus-ring"
            onClick={goVault}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="user-lock" size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Vault</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Your IDs, cards and certificates</span>
            </span>
            <Icon name="chevron-right" size={17} color="var(--fg-3)" />
          </button>
        </div>

        {/* Sign-in & Security — password + Face ID for this device (badged) */}
        <BiometricSettings />

        {!persona.verified && (
          <button
            className="press focus-ring"
            onClick={startVerify}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 64, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--status-warning-bg)', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield-alert" size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Confirm my identity</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)' }}>Takes about two minutes and opens your own records</span>
            </span>
            <Icon name="chevron-right" size={17} color="var(--fg-3)" />
          </button>
        )}

        <button
          className="press focus-ring"
          onClick={signOut}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 48, border: '1px solid var(--surface-border)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Icon name="log-out" size={17} color="var(--fg-3)" />
          Sign out
        </button>

        <div style={{ paddingTop: 4, borderTop: '1px solid var(--surface-hairline)', textAlign: 'center' }}>
          <span style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>My Guyana — Version 1.0.0</span>
        </div>
      </div>
    </Sheet>

    {/* Fill in only what the master record couldn't supply (backlog 2.5) —
        opens from the badged Personal Information section above. */}
    <Sheet open={fixOpen} onClose={() => setFixOpen(false)} title="Complete your details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          Everything government already holds is filled in for you. Only {missingRows.length === 1 ? 'this detail is' : `these ${missingRows.length} details are`} still needed.
        </p>
        {missingRows.map((r) => (
          <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>{r.label}</label>
            <input
              type={r.id === 'email' ? 'email' : r.id === 'phone' ? 'tel' : 'text'}
              value={fixVals[r.id] || ''}
              onChange={setFix(r.id)}
              placeholder={r.id === 'email' ? 'you@example.gy' : r.id === 'phone' ? 'e.g. 677 4820' : r.id === 'address' ? 'Lot, street, village/ward' : 'e.g. Teacher'}
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px',
                border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-2)',
                fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)', outline: 'none',
              }}
            />
          </div>
        ))}
        <Button fullWidth disabled={!fixComplete} style={{ opacity: fixComplete ? 1 : 0.5 }} onClick={saveFix}>
          Save and finish
        </Button>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-4)' }}>
          You can update these any time from your profile.
        </p>
      </div>
    </Sheet>
    </>
  );
}
