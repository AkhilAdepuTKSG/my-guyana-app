import { useMemo } from 'react';
import Icon from '../../components/ui/Icon';
import { Screen, Heading, InfoBox, PrimaryButton, TextButton } from './ui';
import { SERVICE_CENTRES } from '../../state/mockData';
import { buildEidDateOptions, EID_TIME_OPTIONS } from '../eid/eidData';

// CREATE · non-e-ID path (TIN / passport) · we start an e-ID application by
// default once identity is confirmed, and the citizen picks when to visit a
// Service Centre. Reuses the same Centre/date/time data as the standalone
// e-ID wizard so a sign-up appointment and a MoPS-started one look identical.
export function EidBook({ st, on }) {
  const dateOptions = useMemo(() => buildEidDateOptions(), []);
  const ready = Boolean(st.eidApptOffice && st.eidApptDate && st.eidApptTime);

  return (
    <Screen gap={16}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--status-success)' }}>
        Identity confirmed
      </span>
      <Heading
        title="Let's set up your e-ID"
        sub="You don't have an e-ID yet, so we've started an application for you. It's the only thing left — pick when to visit a Service Centre to finish it."
      />
      <InfoBox tone="info" icon="fingerprint">
        Your e-ID is your key to every government service. Photo, signature and fingerprints are captured in person at the Centre.
      </InfoBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>Choose a Service Centre</label>
        {SERVICE_CENTRES.map((c, i) => {
          const active = st.eidApptOffice === c.name;
          return (
            <button
              key={c.id} className="press focus-ring" onClick={() => on.selectEidOffice(c.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 58, padding: '11px 14px',
                borderRadius: 12, border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                background: active ? 'var(--brand-100)' : 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{c.name}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--fg-3)' }}>{c.address}</span>
              </span>
              {i === 0 && !active && (
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)' }}>Nearest</span>
              )}
              {active && <Icon name="check" size={16} color="var(--brand-600)" />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>Available dates</label>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Service Centres open weekdays only.</p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px' }}>
          {dateOptions.map((dt) => {
            const active = st.eidApptDate === dt.iso;
            return (
              <button
                key={dt.iso} className="press focus-ring" onClick={() => !dt.isFull && on.selectEidDate(dt.iso)} disabled={dt.isFull}
                style={{
                  flexShrink: 0, width: 56, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  borderRadius: 14, border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                  background: active ? 'var(--brand-600)' : 'var(--surface-1)', cursor: dt.isFull ? 'not-allowed' : 'pointer',
                  opacity: dt.isFull ? 0.45 : 1, fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em', color: active ? '#fff' : 'var(--fg-1)' }}>{dt.dayAbbr}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: active ? '#fff' : 'var(--fg-1)' }}>{dt.dateNum}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#fff' : (dt.isFull ? 'var(--status-error)' : 'var(--status-success)') }}>{dt.isFull ? 'Full' : 'Open'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>Available times</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EID_TIME_OPTIONS.map((t) => {
            const active = st.eidApptTime === t;
            return (
              <button
                key={t} className="press focus-ring" onClick={() => on.selectEidTime(t)}
                style={{
                  minHeight: 40, padding: '0 16px', borderRadius: 999, border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                  background: active ? 'var(--brand-600)' : 'var(--surface-1)', color: active ? '#fff' : 'var(--fg-1)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <PrimaryButton onClick={on.eidBookConfirm} style={{ opacity: ready ? 1 : 0.5 }} disabled={!ready}>
        Confirm appointment
      </PrimaryButton>
      <TextButton onClick={on.eidBookSkip}>Skip for now — I'll book later</TextButton>
    </Screen>
  );
}
