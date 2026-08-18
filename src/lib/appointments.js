// Helpers for surfacing appointment clashes while booking. A citizen can't hold
// two appointments at the same Service Centre, date and time, so booking/reschedule
// pickers use these to badge and block a slot that's already taken.

// A short, human label for what a booked slot is for — shown on the badge
// (e.g. "Booked · e-ID"). Derived from the appointment's title, then agency.
export function appointmentPurpose(appt) {
  const t = (appt?.title || '').toLowerCase();
  if (/e-?id|enrol/.test(t)) return 'e-ID';
  if (/passport/.test(t)) return 'Passport';
  if (/nis/.test(t)) return 'NIS';
  if (/electric|gpl|power/.test(t)) return 'GPL';
  const byAgency = { mops: 'MoPS', immigration: 'Passport', nis: 'NIS', gpl: 'GPL', mof: 'MoF' };
  return byAgency[appt?.agency] || 'appointment';
}

// Find an existing appointment that clashes with a candidate slot at the SAME
// Service Centre (location), date and time. `excludeId` skips the appointment
// currently being rescheduled so it doesn't clash with itself.
export function findSlotClash(appointments, { location, date, time, excludeId } = {}) {
  if (!location || !date || !time) return null;
  return (
    (appointments || []).find(
      (a) => a.id !== excludeId && a.location === location && a.date === date && a.time === time,
    ) || null
  );
}
