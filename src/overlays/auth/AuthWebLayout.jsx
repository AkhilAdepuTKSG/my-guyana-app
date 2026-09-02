import Icon from '../../components/ui/Icon';
import coatOfArms from '../../assets/guyana-coat-of-arms.png';
import { WaterfallScene } from './AuthSplash';

/**
 * The width of the panel's content column, shared with every step of the flow
 * (see AUTH_COLUMN_WIDTH in ui.jsx). One measure means the heading on the
 * welcome screen and the heading on the step after it start on the same line
 * — different widths would shift the left edge as the citizen moves through.
 */
export const AUTH_COLUMN_WIDTH = 440;

// Signing in, on the web.
//
// The phone puts the identity of the service and the thing you came to do on
// one screen, one after the other, because that is all a phone has room for. A
// window has two halves: who this is on the left, and what you came to do on
// the right. Every step of the flow — sign in, the code, creating an account,
// scanning a card — renders into the right-hand panel, so the identity of the
// service never leaves the screen while a citizen is proving theirs.

const PROMISES = [
  { icon: 'shield-check', text: 'One government account for every agency and service.' },
  { icon: 'file-check-2', text: 'Your documents, applications and payments in one place.' },
  { icon: 'lock', text: 'Your records stay closed until your identity is confirmed.' },
];

/**
 * @param {{children: import('react').ReactNode}} props the current step of the
 *   flow, rendered into the right-hand panel. The steps position themselves
 *   absolutely (see ui.jsx `Screen`), which is why that panel is a positioned,
 *   definitely-sized box.
 */
export default function AuthWebLayout({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'grid',
      // The hero holds its half until the window gets tight, at which point the
      // panel takes the room — what the citizen is doing matters more than the
      // picture behind it.
      gridTemplateColumns: 'minmax(0, 1fr) minmax(min(100%, 520px), 1fr)',
      background: 'var(--surface-1)',
    }}>
      {/* ------------------------------ hero ------------------------------ */}
      <aside style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '56px 64px',
        background: 'linear-gradient(175deg,#0b2d4a 0%,#08243c 42%,#04182a 100%)',
        color: '#fff',
      }}>
        <WaterfallScene />
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(4,24,42,0.30) 0%, rgba(4,24,42,0.55) 55%, rgba(4,24,42,0.88) 100%)',
        }} />

        <span style={{
          position: 'absolute', top: 40, left: 64, zIndex: 2,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)',
        }}>
          Government of Guyana
        </span>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520 }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 84, height: 84, marginBottom: 30, borderRadius: 20,
            background: '#fff', border: '1px solid rgba(255,255,255,0.17)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
          }}>
            <img src={coatOfArms} alt="Coat of arms of Guyana" style={{ width: 62, height: 'auto', display: 'block' }} />
          </span>

          <h1 style={{
            margin: 0, fontSize: 'clamp(40px, 4vw, 58px)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.02, color: '#fff',
          }}>
            My Guyana
          </h1>
          <p style={{
            margin: '16px 0 34px', fontSize: 'clamp(17px, 1.4vw, 21px)',
            fontWeight: 700, lineHeight: 1.35, color: 'rgba(255,255,255,0.88)',
          }}>
            One nation. One account. Every service.
          </p>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROMISES.map((p) => (
              <li key={p.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon name={p.icon} size={17} color="rgba(255,255,255,0.62)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <span style={{
          position: 'absolute', bottom: 40, left: 64, zIndex: 2,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)',
        }}>
          One People · One Nation · One Destiny
        </span>
      </aside>

      {/* ------------------------------ panel ----------------------------- */}
      <main style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-1)' }}>
        {children}
      </main>
    </div>
  );
}

/**
 * The panel's first screen: what this account is, and the two ways in.
 *
 * The phone shows these over the hero image; here the hero has a half of its
 * own, so the choice gets a quiet white page and nothing competes with it.
 */
export function AuthWelcome({ onSignIn, onCreateAccount }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
      padding: 'clamp(32px, 6vh, 64px) clamp(28px, 5vw, 72px)',
    }}>
      {/* Centred the same way every step is — `auto` on all sides — so the
          column stays put as the citizen moves from here into the flow. */}
      <div style={{ width: '100%', maxWidth: AUTH_COLUMN_WIDTH, margin: 'auto' }}>
        <h2 style={{
          margin: 0, fontSize: 'clamp(28px, 2.4vw, 34px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--fg-1)',
        }}>
          Welcome to My Guyana
        </h2>
        <p style={{ margin: '14px 0 30px', fontSize: 15.5, lineHeight: 1.55, color: 'var(--fg-3)' }}>
          Your services, documents, applications and payments — in one account, on any device.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="press focus-ring"
            onClick={onSignIn}
            style={{
              width: '100%', minHeight: 56, borderRadius: 'var(--radius-md)', border: 'none',
              background: 'var(--brand-700)', color: '#fff',
              fontSize: 15.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign in
          </button>
          <button
            className="press focus-ring"
            onClick={onCreateAccount}
            style={{
              width: '100%', minHeight: 56, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
              color: 'var(--fg-1)', fontSize: 15.5, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
