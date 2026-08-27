import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import MissingBadge from '../../components/ui/MissingBadge';
import { useAppState } from '../../state/AppStateContext';
import { personalRows } from '../../lib/profileFields';
import { useRegionName } from './regionStore';
import BiometricSettings from './BiometricSettings';

export default function ProfileSheet() {
  const { isOpen, closeOverlay, openOverlay, navigate, persona, user, showToast, signOut: endSession } = useAppState();
  const open = isOpen('profile');
  const region = useRegionName();

  // --- Personal Information (backlog 2.3–2.5) ---
  // One shared definition of the fields (lib/profileFields): values come from the
  // government record or what the citizen filled in; required fields with no
  // value anywhere badge the section and open the Personal Information page.
  const rows = personalRows(user);
  const missingPersonal = rows.filter((r) => r.missing).length;
  const visibleRows = rows.filter((r) => r.value || r.missing);

  const openPersonalInfo = () => {
    closeOverlay('profile'); // the page is a full-screen overlay below the sheet
    openOverlay('personalInfo');
  };

  // Access my e-ID — the e-ID's home is the Vault/profile, not Home (backlog 2.2).
  const openEid = () => {
    closeOverlay('profile');
    if (persona.eidStatus === 'issued') openOverlay('eidCard');
    else navigate('vault'); // application in progress — the card lives in the Vault
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

        {/* Your agencies — pin/manage sheet; pinned agencies lead the Home tiles. */}
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
            <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>Pin up to 6 to lead your Home</span>
          </span>
          <Icon name="chevron-right" size={17} color="var(--fg-3)" />
        </button>

        {/* Personal Information — badged while required fields are missing (2.4);
            the section opens the full Personal Information page (2.3 / 2.5). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="press focus-ring"
            onClick={openPersonalInfo}
            aria-label={missingPersonal > 0 ? `Personal Information — ${missingPersonal} required missing, open to complete` : 'Personal Information — open'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Personal Information</h2>
            <MissingBadge count={missingPersonal} />
            <Icon name="chevron-right" size={13} color="var(--fg-4)" />
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
                    <span style={{ minHeight: 18, padding: '0 7px', borderRadius: 999, background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>Required</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {missingPersonal > 0 && (
            <button
              className="press focus-ring"
              onClick={openPersonalInfo}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 46, padding: '12px 14px', border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Icon name="user-round-pen" size={17} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                Complete your details — {missingPersonal} required {missingPersonal === 1 ? 'field' : 'fields'} missing
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
  );
}
