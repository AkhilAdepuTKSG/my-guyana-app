import { useMemo, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Sheet from '../../components/ui/Sheet';
import Icon from '../../components/ui/Icon';
import ListRow from '../../components/ui/ListRow';
import StatusPill from '../../components/ui/StatusPill';
import { useAppState } from '../../state/AppStateContext';
import { PAYMENT_HISTORY, AGENCIES } from '../../state/mockData';

const RANGE_OPTIONS = ['Any time', 'Last 30 days', 'Last 3 months', 'Last 12 months'];
const RANGE_MONTHS = { 'Last 30 days': 1, 'Last 3 months': 3, 'Last 12 months': 12 };
const STATUS_TONE = { Paid: 'success', Pending: 'warning', Failed: 'error' };
// The app's fictional "today" (see currentDate context) — used only to bucket
// payments into the relative date-range filters below.
const TODAY = new Date('2026-08-14T00:00:00');

function formatCurrency(n) {
  return `G$ ${Number(n).toLocaleString('en-US')}`;
}
function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatPeriod(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function monthsAgo(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return (TODAY.getFullYear() - d.getFullYear()) * 12 + (TODAY.getMonth() - d.getMonth());
}

function ChipRow({ options, active, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map((o) => {
        const on = o === active;
        return (
          <button
            key={o}
            className="press focus-ring"
            onClick={() => onPick(o)}
            style={{
              minHeight: 38, padding: '0 13px', borderRadius: 999, fontFamily: 'inherit',
              border: `1px solid ${on ? 'var(--brand-600)' : 'var(--surface-border)'}`,
              background: on ? 'var(--brand-600)' : 'var(--surface-1)',
              color: on ? '#fff' : 'var(--fg-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function PaymentsHistory() {
  const { isOpen, closeOverlay, showToast } = useAppState();
  const open = isOpen('payments');

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [type, setType] = useState('All');
  const [range, setRange] = useState('Any time');
  const [statuses, setStatuses] = useState([]);

  const rows = useMemo(() => PAYMENT_HISTORY.map((p) => {
    const agency = AGENCIES[p.agency];
    return {
      ...p,
      agencyLabel: agency?.shortName || p.agency,
      icon: agency?.icon || 'receipt',
      amountLabel: formatCurrency(p.amount),
      dateLabel: formatDate(p.date),
      periodLabel: formatPeriod(p.date),
    };
  }), []);

  const typeOptions = useMemo(() => ['All', ...new Set(rows.map((p) => p.agencyLabel))], [rows]);
  const statusOptions = useMemo(() => [...new Set(rows.map((p) => p.status))], [rows]);

  const filtered = rows.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !`${p.title} ${p.agencyLabel} ${p.amountLabel}`.toLowerCase().includes(q)) return false;
    if (type !== 'All' && p.agencyLabel !== type) return false;
    if (statuses.length && !statuses.includes(p.status)) return false;
    if (range !== 'Any time' && monthsAgo(p.date) > RANGE_MONTHS[range]) return false;
    return true;
  });

  const filterCount = (type !== 'All' ? 1 : 0) + (range !== 'Any time' ? 1 : 0) + statuses.length;
  const active = filterCount > 0;

  const toggleStatus = (s) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const clearFilters = () => { setType('All'); setRange('Any time'); setStatuses([]); };

  return (
    <PageOverlay
      open={open}
      onClose={() => closeOverlay('payments')}
      title="All payments"
      headerRight={
        <button
          className="press focus-ring"
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', borderRadius: 999,
            border: `1px solid ${active ? 'var(--brand-600)' : 'var(--surface-border)'}`,
            background: active ? 'var(--brand-600)' : 'var(--surface-1)',
            color: active ? '#fff' : 'var(--fg-1)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
          }}
        >
          <Icon name="sliders-horizontal" size={14} color={active ? '#fff' : 'var(--fg-1)'} />
          {filterCount || 'Filters'}
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: '0 13px',
          borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-1)',
        }}>
          <Icon name="search" size={16} color="var(--fg-4)" />
          <input
            aria-label="Search payments"
            type="text"
            placeholder="Search by bill, agency or amount"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14.5, color: 'var(--fg-1)' }}
          />
        </div>

        {filtered.length > 0 ? (
          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden' }}>
            {filtered.map((p, i) => (
              <ListRow
                key={p.id}
                icon={p.icon}
                iconColor="var(--fg-2)"
                iconBg="var(--surface-2)"
                title={p.title}
                subtitle={`${p.periodLabel} · ${p.dateLabel}`}
                chevron={false}
                onClick={() => showToast(`${p.title} receipt — coming soon`)}
                trailing={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-1)' }}>{p.amountLabel}</span>
                    <StatusPill tone={STATUS_TONE[p.status] || 'neutral'}>{p.status}</StatusPill>
                  </div>
                }
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--surface-hairline)' : 'none', padding: '13px 14px' }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
            padding: '34px 20px', border: '1px dashed var(--surface-border)', borderRadius: 18, background: 'var(--surface-1)',
          }}>
            <Icon name="receipt-text" size={22} color="var(--fg-4)" />
            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--fg-1)' }}>No payments match</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)', maxWidth: 230 }}>Try a different search, or clear the filters.</span>
            <button
              className="press focus-ring"
              onClick={() => { clearFilters(); setSearch(''); }}
              style={{ minHeight: 40, padding: '0 14px', border: '1px solid var(--surface-border)', borderRadius: 12, background: 'var(--surface-1)', color: 'var(--fg-1)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
            <button
              className="press focus-ring"
              onClick={clearFilters}
              style={{ minHeight: 32, padding: '0 10px', border: 'none', background: 'none', color: 'var(--fg-3)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Payment type</span>
            <ChipRow options={typeOptions} active={type} onPick={setType} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Date range</span>
            <ChipRow options={RANGE_OPTIONS} active={range} onPick={setRange} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-1)' }}>Status</span>
            <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Choose as many as you need.</span>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--surface-border)', borderRadius: 14, overflow: 'hidden' }}>
              {statusOptions.map((o, i) => {
                const on = statuses.includes(o);
                return (
                  <button
                    key={o}
                    className="press focus-ring"
                    onClick={() => toggleStatus(o)}
                    aria-pressed={on}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 52, padding: '12px 14px',
                      border: 'none', borderBottom: i < statusOptions.length - 1 ? '1px solid var(--surface-hairline)' : 'none',
                      background: 'var(--surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <span aria-hidden="true" style={{
                      width: 22, height: 22, flexShrink: 0, borderRadius: 6,
                      border: `1.5px solid ${on ? 'var(--brand-600)' : 'var(--surface-border)'}`,
                      background: on ? 'var(--brand-600)' : 'var(--surface-1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="check" size={14} color="#fff" style={{ opacity: on ? 1 : 0 }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>{o}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="press focus-ring"
            onClick={() => setFilterOpen(false)}
            style={{ width: '100%', minHeight: 50, border: 'none', borderRadius: 14, background: 'var(--brand-600)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Show {filtered.length} {filtered.length === 1 ? 'payment' : 'payments'}
          </button>
        </div>
      </Sheet>
    </PageOverlay>
  );
}
