import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import MissingBadge from '../../components/ui/MissingBadge';
import { useAppState } from '../../state/AppStateContext';
import { missingPersonalFields } from '../../lib/profileFields';
import { useRegionName } from './regionStore';

// The profile bottom sheet, laid out as the Final design: identity header with
// the e-ID number pill (the "access my e-ID" entry, backlog 2.2) · Region ·
// Quick access (Vault · My applications · Personal information · Sign-in &
// security · Accessibility) · Sign out. Rows with pending fields carry the
// missing-fields badge (backlog 2.4). "Who you are acting for" (family
// accounts) is the next piece of work and is not here yet.
function QuickRow({ icon, title, sub, badge = 0, onClick }) {
  return (
    <button
      className="press focus-ring"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 62, padding: '12px 14px', border: '1px solid var(--surface-border)', borderRadius: 16, background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
    >
      <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--fg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>{title}</span>
          <MissingBadge count={badge} />
        </span>
        <span style={{ display: 'block', marginTop: 1, fontSize: 12.5, color: 'var(--fg-2)' }}>{sub}</span>
      </span>
      <Icon name="chevron-right" size={17} color="var(--fg-3)" />
    </button>
  );
}

export default function ProfileSheet() {
  const { isOpen, closeOverlay, openOverlay, navigate, persona, user, showToast, signOut: endSession } = useAppState();
  const open = isOpen('profile');
  const region = useRegionName();

  const missingPersonal = missingPersonalFields(user, persona).length;
  const missingSecurity = user?.passwordSet ? 0 : 1;

  const go = (fn) => () => { closeOverlay('profile'); fn(); };
  const openEid = go(() => {
    if (persona.eidStatus === 'issued') openOverlay('eidCard');
    else navigate('vault'); // application in progress — the card lives in the Vault
  });

  const signOut = () => {
    closeOverlay('profile');
    endSession(); // clears the persisted session → app returns to the auth gate
  };

  return (
    <Sheet open={open} onClose={() => closeOverlay('profile')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Identity header — name + e-ID pill + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--agency-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
            {persona.initials}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--fg-1)', lineHeight: 1.15 }}>{persona.name}</span>
            {persona.eidStatus !== 'none' && (
              <button
                className="press focus-ring" onClick={openEid}
                aria-label={persona.eidStatus === 'issued' ? 'Access my e-ID' : 'e-ID application in progress — see it in your Vault'}
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 28, padding: '0 11px', borderRadius: 999, border: 'none', background: 'var(--surface-4)', color: 'var(--fg-1)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Icon name="badge-check" size={13} color="var(--fg-3)" />
                {persona.eidStatus === 'issued' ? `ID ${persona.eidNo || ''}`.trim() : 'e-ID pending'}
              </button>
            )}
          </div>
          <button
            className="press focus-ring" onClick={() => closeOverlay('profile')} aria-label="Close"
            style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'var(--surface-4)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Region */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Region</h2>
          <button
            className="press focus-ring"
            onClick={() => openOverlay('region')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-1)' }}>{region}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
              Change<Icon name="chevron-right" size={15} />
            </span>
          </button>
          <button
            className="press focus-ring"
            onClick={() => showToast('Location access is simulated in this preview')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 48, padding: '12px 14px', border: 'none', borderRadius: 14, background: 'var(--surface-4)', color: 'var(--fg-1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="locate-fixed" size={17} />
            Use my current location
          </button>
        </div>

        {/* Quick access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="ds-eyebrow" style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>Quick access</h2>
          <QuickRow icon="user-lock" title="Vault" sub="Your IDs, cards and certificates" onClick={go(() => navigate('vault'))} />
          <QuickRow icon="file-text" title="My applications" sub="Track everything you've applied for" onClick={go(() => navigate('applications'))} />
          <QuickRow icon="id-card" title="Personal information" sub="Identity, contact, family and employment" badge={missingPersonal} onClick={go(() => openOverlay('personalInfo'))} />
          <QuickRow icon="shield-check" title="Sign-in & security" sub="Easy sign-in and your account details" badge={missingSecurity} onClick={() => openOverlay('security')} />
          <QuickRow icon="accessibility" title="Accessibility" sub="Text size, contrast and motion" onClick={() => openOverlay('accessibility')} />
        </div>

        {!persona.verified && (
          <QuickRow icon="shield-alert" title="Confirm my identity" sub="Takes about two minutes and opens your own records" onClick={go(() => openOverlay('idv', { purpose: 'sensitive' }))} />
        )}

        <button
          className="press focus-ring"
          onClick={signOut}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 50, border: '1px solid var(--status-error)', borderRadius: 14, background: 'var(--surface-1)', color: 'var(--status-error)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Icon name="log-out" size={17} color="var(--status-error)" />
          Sign out
        </button>

        <div style={{ paddingTop: 4, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>My Guyana — Version 1.0.0</span>
        </div>
      </div>
    </Sheet>
  );
}
