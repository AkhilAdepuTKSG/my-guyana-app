import { useAppState } from '../state/AppStateContext';
import Icon from '../components/ui/Icon';
import ListRow from '../components/ui/ListRow';
import StatusPill from '../components/ui/StatusPill';
import { PAYMENT_HISTORY, AGENCIES } from '../state/mockData';

// Invented locally — mockData.js has no bank/payment account list.
const BANK_ACCOUNTS = [
  { id: 'bank-1', bank: 'Republic Bank (Guyana) Ltd.', last4: '2231' },
  { id: 'bank-2', bank: 'GBTI — Guyana Bank for Trade & Industry', last4: '9075' },
];

const STATUS_TONE = { Paid: 'success', Pending: 'warning', Failed: 'error' };

function formatCurrency(n) {
  return `G$ ${Number(n).toLocaleString('en-US')}`;
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPeriod(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Wallet() {
  const { navigate, openOverlay, showToast } = useAppState();
  const recentPayments = PAYMENT_HISTORY.slice(0, 3);
  const hasPaymentHistory = recentPayments.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            className="press focus-ring"
            onClick={() => navigate('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: 3, minHeight: 36, padding: '0 12px 0 8px',
              borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--surface-border)',
              color: 'var(--fg-1)', fontSize: 'var(--text-xs)', fontWeight: 700,
            }}
          >
            <Icon name="chevron-left" size={18} color="var(--fg-1)" />Home
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="press focus-ring"
            onClick={() => openOverlay('notifications')}
            aria-label="Notifications"
            style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface-1)', border: '1px solid var(--surface-border)',
            }}
          >
            <Icon name="bell" size={17} color="var(--fg-2)" />
          </button>
        </div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Wallet</div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, color: 'var(--fg-3)', marginTop: 2 }}>Pay bills and receive benefit payments</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="ds-eyebrow" style={{ fontSize: 12, margin: 0 }}>Payment accounts</h2>
        <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
          {BANK_ACCOUNTS.map((b) => (
            <ListRow
              key={b.id}
              icon="landmark"
              iconColor="var(--brand-600)"
              iconBg="var(--brand-100)"
              title={b.bank}
              subtitle={
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--status-success)', fontWeight: 700 }}>
                  <Icon name="shield-check" size={12} color="var(--status-success)" />Verified · ****{b.last4}
                </span>
              }
              onClick={() => showToast(`${b.bank} · ****${b.last4} — coming soon`)}
              style={{ borderBottom: '1px solid var(--surface-hairline)', padding: '13px 14px' }}
            />
          ))}
          <ListRow
            icon="plus"
            iconColor="var(--fg-2)"
            iconBg="var(--surface-2)"
            title="Add a bank account"
            subtitle="Use it to pay bills and receive benefits"
            onClick={() => openOverlay('bank')}
            style={{ padding: '13px 14px' }}
          />
        </div>
      </div>

      {hasPaymentHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="ds-eyebrow" style={{ flex: 1, minWidth: 0, fontSize: 12, margin: 0 }}>Payment history</h2>
            <button
              className="press focus-ring"
              onClick={() => openOverlay('payments')}
              style={{ minHeight: 32, padding: '0 10px', border: 'none', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--fg-1)', fontSize: 12, fontWeight: 800 }}
            >
              See all
            </button>
          </div>
          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
            {recentPayments.map((p, i) => {
              const agency = AGENCIES[p.agency];
              return (
                <ListRow
                  key={p.id}
                  icon={agency?.icon || 'receipt'}
                  iconColor="var(--fg-2)"
                  iconBg="var(--surface-2)"
                  title={p.title}
                  subtitle={`${formatPeriod(p.date)} · ${formatDate(p.date)}`}
                  chevron={false}
                  onClick={() => showToast(`${p.title} receipt — coming soon`)}
                  trailing={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{formatCurrency(p.amount)}</span>
                      <StatusPill tone={STATUS_TONE[p.status] || 'neutral'}>{p.status}</StatusPill>
                    </div>
                  }
                  style={{ borderBottom: i < recentPayments.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px' }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', borderRadius: 14, background: 'var(--surface-2)' }}>
        <Icon name="shield-check" size={16} color="var(--brand-600)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          Every account is confirmed with your bank and a one-time code before it can be used. Your IDs and certificates live in the Vault, inside your profile.
        </p>
      </div>
    </div>
  );
}
