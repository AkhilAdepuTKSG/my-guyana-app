import { useEffect, useState } from 'react';
import Sheet from '../../components/ui/Sheet';
import { useAppState } from '../../state/AppStateContext';

// Accessibility — text size, contrast and motion, per the Final design's
// profile quick access. Settings persist per device and are applied as data
// attributes on the document root (see the rules at the end of tokens.css).
const KEY = 'myguyana.a11y.v1';
const DEFAULTS = { textSize: 'default', contrast: 'standard', reduceMotion: false };

function load() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch { return DEFAULTS; }
}

function apply(s) {
  const root = document.documentElement;
  root.dataset.textSize = s.textSize;
  root.dataset.contrast = s.contrast;
  root.dataset.reduceMotion = s.reduceMotion ? 'on' : 'off';
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button" className="press focus-ring" onClick={onClick} aria-pressed={active}
      style={{
        minHeight: 40, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
        border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
        background: active ? 'var(--brand-600)' : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)',
        fontSize: 13.5, fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

export default function AccessibilitySheet() {
  const { isOpen, closeOverlay } = useAppState();
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    apply(settings);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <Sheet open={isOpen('accessibility')} onClose={() => closeOverlay('accessibility')} title="Accessibility">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Text size</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['default', 'Default'], ['large', 'Large'], ['largest', 'Largest']].map(([v, l]) => (
              <Chip key={v} label={l} active={settings.textSize === v} onClick={() => set({ textSize: v })} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Contrast</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['standard', 'Standard'], ['high', 'High contrast']].map(([v, l]) => (
              <Chip key={v} label={l} active={settings.contrast === v} onClick={() => set({ contrast: v })} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>Motion</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip label="Animations on" active={!settings.reduceMotion} onClick={() => set({ reduceMotion: false })} />
            <Chip label="Reduce motion" active={settings.reduceMotion} onClick={() => set({ reduceMotion: true })} />
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>
          These apply on this device only and take effect straight away.
        </p>
      </div>
    </Sheet>
  );
}
