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

// Summarise a citizen's own bookings on one Service Centre + date, across the
// set of candidate time slots. Used to mark date cells in the pickers: a date
// where you already hold a booking gets a marker, and one where every slot is
// taken is flagged as fully booked for you. `excludeId` skips the appointment
// being rescheduled so it doesn't count against its own date.
export function dateClashSummary(appointments, { location, date, times, excludeId } = {}) {
  const slots = times || [];
  const empty = { bookedCount: 0, total: slots.length, hasBooking: false, allBooked: false };
  if (!location || !date || slots.length === 0) return empty;
  let bookedCount = 0;
  for (const t of slots) {
    if (findSlotClash(appointments, { location, date, time: t, excludeId })) bookedCount += 1;
  }
  return {
    bookedCount,
    total: slots.length,
    hasBooking: bookedCount > 0,
    allBooked: bookedCount >= slots.length,
  };
}
