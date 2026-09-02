import coatOfArms from '../../assets/guyana-coat-of-arms.png';

// The Kaieteur Falls hero scene: the single most bespoke visual asset in
// the source prototype, ported here as inline SVG with the same looping
// CSS keyframes (defined globally in src/styles/tokens.css).
export function WaterfallScene() {
  return (
    <svg aria-hidden="true" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <filter id="soften" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id="softenMore" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" /></filter>
        <radialGradient id="edgeVignette" cx="50%" cy="42%" r="62%">
          <stop offset="55%" stopColor="#04182a" stopOpacity="0" />
          <stop offset="100%" stopColor="#020d18" stopOpacity="0.85" />
        </radialGradient>
        <filter id="cloudBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
        <radialGradient id="skyGlow" cx="50%" cy="16%" r="66%">
          <stop offset="0%" stopColor="#8fd4e8" stopOpacity="0.16" />
          <stop offset="52%" stopColor="#3f8ba6" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#04182a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shaft" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#dff4ff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#bfe6f7" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#bfe6f7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fallSheet" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#eaf8ff" stopOpacity="0.20" />
          <stop offset="58%" stopColor="#a9dcef" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#a9dcef" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="threadFade" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#eaf8ff" stopOpacity="0.42" />
          <stop offset="60%" stopColor="#cfeaff" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#cfeaff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="spray" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e6f6ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#e6f6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cloudFill" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#123a52" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0a2438" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="farWall" cx="50%" cy="30%" r="66%">
          <stop offset="0%" stopColor="#04182a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#062338" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="waterLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7fd4e8" stopOpacity="0" />
          <stop offset="45%" stopColor="#7fd4e8" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#7fd4e8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* atmosphere: light gathering above the gorge */}
      <ellipse cx="195" cy="150" rx="300" ry="260" fill="url(#skyGlow)" />

      {/* cloud banks, blurred so they read as weather, not shapes */}
      <g filter="url(#cloudBlur)" opacity="0.75" data-splash-anim="mist" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mistBreathe 18s ease-in-out infinite' }}>
        <ellipse cx="70" cy="128" rx="96" ry="42" fill="url(#cloudFill)" />
        <ellipse cx="150" cy="104" rx="78" ry="34" fill="url(#cloudFill)" opacity="0.8" />
        <ellipse cx="300" cy="120" rx="104" ry="44" fill="url(#cloudFill)" />
        <ellipse cx="232" cy="86" rx="70" ry="30" fill="url(#cloudFill)" opacity="0.7" />
      </g>

      {/* light falling into the gorge */}
      <g style={{ mixBlendMode: 'screen' }} data-splash-anim="shafts">
        <path d="M150 40 L120 470 L196 470 Z" fill="url(#shaft)" filter="url(#softenMore)" style={{ animation: 'sheetGlow 9s ease-in-out infinite' }} />
        <path d="M240 40 L200 470 L272 470 Z" fill="url(#shaft)" filter="url(#softenMore)" opacity="0.8" style={{ animation: 'sheetGlow 11s ease-in-out infinite 1.6s' }} />
      </g>

      {/* the gorge wall behind the fall */}
      <ellipse cx="195" cy="330" rx="180" ry="200" fill="url(#farWall)" />

      {/* the fall: one wide sheet, threads inside it */}
      <g>
        <path d="M132 244C160 258 232 258 260 244C268 320 276 412 282 486C232 502 158 502 108 486C114 412 122 320 132 244Z" fill="url(#fallSheet)" filter="url(#softenMore)" data-splash-anim="sheet" style={{ animation: 'sheetGlow 7s ease-in-out infinite' }} />
        <path d="M168 248C180 254 210 254 222 248C226 322 230 414 232 484C212 492 178 492 158 484C160 414 164 322 168 248Z" fill="url(#fallSheet)" opacity="0.75" filter="url(#soften)" />
        <g stroke="url(#threadFade)" strokeLinecap="round" fill="none" filter="url(#soften)" strokeDasharray="52 82" data-splash-anim="threads" style={{ animation: 'fallDrift 6.5s linear infinite' }}>
          <path d="M140 252C134 330 128 410 124 468" strokeWidth="1.1" />
          <path d="M160 250C156 336 152 424 150 476" strokeWidth="0.9" opacity="0.7" />
          <path d="M182 248C180 340 178 430 178 480" strokeWidth="1.5" />
          <path d="M204 248C205 340 207 430 208 480" strokeWidth="1.2" opacity="0.8" />
          <path d="M228 250C232 336 236 424 240 476" strokeWidth="0.9" opacity="0.65" />
          <path d="M250 252C256 330 262 410 268 468" strokeWidth="1.1" opacity="0.6" />
        </g>
        <path d="M132 246C162 260 230 260 260 246" stroke="rgba(228,248,255,0.22)" strokeWidth="1.4" fill="none" filter="url(#soften)" />
      </g>

      {/* the plunge */}
      <ellipse cx="195" cy="498" rx="168" ry="58" fill="url(#spray)" data-splash-anim="mist" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mistBreathe 9s ease-in-out infinite' }} />
      <ellipse cx="164" cy="486" rx="104" ry="36" fill="url(#spray)" opacity="0.8" data-splash-anim="mist" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mistBreathe 11s ease-in-out infinite 1.4s' }} />
      <ellipse cx="232" cy="492" rx="84" ry="30" fill="url(#spray)" opacity="0.65" data-splash-anim="mist" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'mistBreathe 13s ease-in-out infinite 0.7s' }} />

      {/* the arrowhead, kept as a whisper in the mist */}
      <path d="M-10 300 L120 372 L-10 444" fill="none" stroke="rgba(240,200,106,0.10)" strokeWidth="1.2" strokeLinejoin="round" filter="url(#soften)" />

      {/* canopy ridges framing the gorge: far, mid, near */}
      <g filter="url(#soften)" opacity="0.9">
        <path d="M-20 214q14-24 30-12 12-24 30-12 14-22 32-8 12-18 26-4 14-14 28 0l0 420-146 0Z" fill="rgba(6,28,46,0.78)" />
        <path d="M410 204q-16-24-32-10-14-24-32-10-16-20-34-6-12-16-26-2-14-12-28 2l0 420 152 0Z" fill="rgba(6,28,46,0.78)" />
      </g>
      <g filter="url(#soften)">
        <path d="M-20 314q18-30 38-16 16-28 38-14 18-24 38-8 14-16 26-2 16-12 30 2l0 520-168 0Z" fill="rgba(3,18,32,0.92)" />
        <path d="M410 300q-20-30-40-14-18-28-40-12-18-22-38-6-14-14-26 0-16-10-30 4l0 520 174 0Z" fill="rgba(3,18,32,0.92)" />
      </g>

      {/* many waters running out of the plunge pool */}
      <g fill="none" strokeLinecap="round" filter="url(#soften)" data-splash-anim="rivers" style={{ animation: 'riverDrift 22s ease-in-out infinite' }}>
        <path d="M-30 540C70 522 132 562 214 550 296 538 348 572 420 558" stroke="url(#waterLine)" strokeWidth="1.6" />
        <path d="M-30 572C64 558 128 596 210 584 292 572 352 606 420 592" stroke="url(#waterLine)" strokeWidth="1.2" opacity="0.75" />
        <path d="M-30 606C80 590 140 632 226 618 312 604 356 638 420 626" stroke="url(#waterLine)" strokeWidth="1" opacity="0.5" />
      </g>

      {/* the near bank, darkest, in front of everything */}
      <g filter="url(#softenMore)">
        <path d="M-20 590q34-24 68-16 30 6 48 22 20 18 44 12 22-6 38-22 22-22 56-16 30 6 48 24 20 20 48 12 26-8 60-22l0 300-430 0Z" fill="rgba(2,14,26,0.96)" />
      </g>
      <path d="M-20 596q46-26 92-18 40 8 66 24 40 24 92 10 44-12 90-26 42-12 90-6" stroke="rgba(150,220,210,0.07)" strokeWidth="1" fill="none" filter="url(#soften)" />
      <rect x="-20" y="-20" width="430" height="884" fill="url(#edgeVignette)" />
    </svg>
  );
}

export default function AuthSplash({ onSignIn, onCreateAccount }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '56px 24px 26px',
        background: 'linear-gradient(175deg,#0b2d4a 0%,#08243c 42%,#04182a 100%)',
        color: '#fff', overflow: 'hidden',
      }}
    >
      <WaterfallScene />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', background: 'linear-gradient(180deg, rgba(4,24,42,0) 0%, rgba(4,24,42,0.55) 40%, rgba(4,24,42,0.92) 76%, #04182a 100%)' }} />

      {/* Coat of arms, pinned to the top-left corner. */}
      <span style={{ position: 'absolute', top: 'calc(22px + env(safe-area-inset-top, 0px))', left: 24, zIndex: 2, width: 56, height: 56, borderRadius: 15, background: '#fff', border: '1px solid rgba(255,255,255,0.17)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }}>
        <img src={coatOfArms} alt="Coat of arms of Guyana" style={{ width: 42, height: 'auto', display: 'block' }} />
      </span>

      <h1 style={{ position: 'relative', margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04, color: '#fff' }}>My Guyana</h1>
      <p style={{ position: 'relative', margin: '10px 0 28px', fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', maxWidth: 290 }}>
        One nation. One account. Every service.
      </p>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <button className="press focus-ring" onClick={onSignIn} style={{ width: '100%', minHeight: 54, border: 'none', borderRadius: 14, background: '#fff', color: '#0e2237', fontSize: 15.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign in
        </button>
        <button className="press focus-ring" onClick={onCreateAccount} style={{ width: '100%', minHeight: 52, border: '1px solid rgba(255,255,255,0.42)', borderRadius: 14, background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Create an account
        </button>
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ display: 'flex', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: '#009e60' }} />
            <span style={{ width: 7, height: 7, borderRadius: 2, background: '#fcaf17' }} />
            <span style={{ width: 7, height: 7, borderRadius: 2, background: '#ce1126' }} />
          </span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
          One People · One Nation · One Destiny
        </p>
      </div>
    </div>
  );
}
