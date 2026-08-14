import Icon from '../../components/ui/Icon';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import Button from '../../components/ui/Button';
import {
  EID_ABOUT_TABS, EID_BENEFITS, EID_HOW_STEPS, EID_ELIGIBILITY, EID_REQUIREMENTS, EID_BRING_PATHS,
} from './eidData';

// The "about" landing screen for the e-ID flow: three sub-tabs (why it
// matters / am I eligible / requirements to bring), then a "Start my
// application" CTA that hands off to step 1.
export default function EidAbout({ tab, onTabChange, onStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <SegmentedTabs tabs={EID_ABOUT_TABS} active={tab} onChange={onTabChange} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.55, color: 'var(--fg-2)' }}>
          One identity for every government service — issued by the <b style={{ fontWeight: 700, color: 'var(--fg-1)' }}>Digital Identity Card Registry</b>.
        </p>

        {tab === 'why' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EID_BENEFITS.map((b) => (
                <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, background: 'var(--surface-2)' }}>
                  <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'var(--agency-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={b.icon} size={18} color="var(--agency-accent-strong)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>{b.title}</span>
                    <span style={{ fontSize: 'var(--text-2xs)', lineHeight: 1.45, color: 'var(--fg-2)' }}>{b.sub}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="ds-eyebrow" style={{ margin: 0, fontSize: 11 }}>How it works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {EID_HOW_STEPS.map((st) => (
                  <div key={st.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 2px' }}>
                    <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800 }}>{st.n}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{st.title}</span>
                      <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>{st.sub}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'elig' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, background: EID_ELIGIBILITY.bg, border: `1px solid color-mix(in oklch, ${EID_ELIGIBILITY.color} 38%, transparent)` }}>
              <Icon name={EID_ELIGIBILITY.icon} size={32} color={EID_ELIGIBILITY.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--fg-1)' }}>{EID_ELIGIBILITY.label}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>{EID_ELIGIBILITY.sub}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EID_REQUIREMENTS.map((req) => (
                <div key={req.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: req.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon name={req.badgeIcon} size={13} color={req.badgeColor} />
                  </span>
                  <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45, color: 'var(--fg-1)' }}>{req.text}</p>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: req.badgeColor, flexShrink: 0, whiteSpace: 'nowrap', marginTop: 3 }}>{req.badgeSub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: 13, borderRadius: 14, background: 'var(--agency-accent-soft)' }}>
                <Icon name="languages" size={16} color="var(--agency-accent-strong)" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.3 }}>Originals, in English</span>
                <span style={{ fontSize: 11, lineHeight: 1.35, color: 'var(--fg-3)' }}>Otherwise a certified translation</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: 13, borderRadius: 14, background: 'var(--agency-accent-soft)' }}>
                <Icon name="scan-face" size={16} color="var(--agency-accent-strong)" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.3 }}>No photo needed</span>
                <span style={{ fontSize: 11, lineHeight: 1.35, color: 'var(--fg-3)' }}>Taken at the Centre</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>1</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>Your primary document</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Depends on how you became a citizen</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
                {EID_BRING_PATHS.map((p, i) => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: i < EID_BRING_PATHS.length - 1 ? '1px solid var(--surface-hairline)' : 'none' }}>
                    <span style={{ flexShrink: 0, width: '38%', fontSize: 12, lineHeight: 1.3, color: 'var(--fg-3)' }}>{p.label}</span>
                    <Icon name="arrow-right" size={13} color="var(--fg-4)" />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: 'var(--fg-1)', lineHeight: 1.3 }}>{p.doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>2</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>Photo ID</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>Guyana passport or GECOM card</span>
              </span>
              <Icon name="credit-card" size={19} color="var(--fg-4)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 16, borderRadius: 16, background: 'var(--surface-2)' }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: 'var(--agency-accent)', color: 'var(--agency-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>3</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--fg-1)' }}>Proof of address</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--fg-2)' }}>Bill, bank statement or stamped envelope — last 3 months</span>
              </span>
              <Icon name="map-pin" size={19} color="var(--fg-4)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderRadius: 16, border: '1.5px dashed var(--surface-border)' }}>
              <Icon name="file-signature" size={17} color="var(--fg-3)" />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-2)' }}>Changed your name?</span>
                <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--fg-3)' }}>Add a marriage certificate, deed poll or affidavit</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 20 }}>
        <Button fullWidth size="lg" onClick={onStart}>Start my application</Button>
      </div>
    </div>
  );
}
