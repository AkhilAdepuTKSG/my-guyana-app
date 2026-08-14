// Shared helpers/constants for the GPL hub + its transactional flows.
// Not a component — kept out of Gpl.jsx / the overlay files so fast-refresh
// stays happy and so hub + overlays both import from one place.

// The mock persona.gpl object doesn't carry a meter number or service
// address, so those are invented placeholder flavor data here.
export const GPL_METER = 'M-88 219 004';
export const GPL_ADDRESS = 'Lot 42 Sheriff Street, Campbellville';

export function formatGyd(n) {
  return 'G$ ' + Math.round(n).toLocaleString('en-US');
}

export function formatDue(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function billPeriodLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  // The bill for a given due date covers the prior month's usage.
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
