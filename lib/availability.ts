import { Booking, BusySlot, SpaceBooking } from '@/types/booking';
import { SpaceId } from '@/types/space';
import { addMinutes, timeToMinutes, toDateTime } from './dates';

// A table visit is assumed to last three hours when deciding it has finished.
const TABLE_VISIT_MINUTES = 180;

export function bookingStart(booking: Booking): Date {
  return booking.kind === 'space'
    ? toDateTime(booking.date, booking.startTime)
    : toDateTime(booking.date, booking.time);
}

export function bookingEnd(booking: Booking): Date {
  return booking.kind === 'space'
    ? toDateTime(booking.date, booking.endTime)
    : addMinutes(toDateTime(booking.date, booking.time), TABLE_VISIT_MINUTES);
}

export function isHoldActive(booking: Booking, now: Date): boolean {
  return (
    booking.status === 'pending_payment' &&
    booking.holdExpiresAt !== undefined &&
    new Date(booking.holdExpiresAt) > now
  );
}

// A space booking blocks its slot once confirmed, or while its 10 minute payment hold lasts.
export function occupiesSpace(booking: Booking, now: Date): booking is SpaceBooking {
  return booking.kind === 'space' && (booking.status === 'confirmed' || isHoldActive(booking, now));
}

// The whole venue includes every hut, so it conflicts with all spaces.
export function spacesConflict(a: SpaceId, b: SpaceId): boolean {
  return a === b || a === 'whole-venue' || b === 'whole-venue';
}

export function intervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

export function findBusySlots(
  bookings: Booking[],
  spaceId: SpaceId,
  fromDate: string,
  toDate: string,
  now: Date,
): BusySlot[] {
  return bookings
    .filter(
      (booking): booking is SpaceBooking =>
        occupiesSpace(booking, now) &&
        spacesConflict(booking.spaceId, spaceId) &&
        booking.date >= fromDate &&
        booking.date <= toDate,
    )
    .map((booking) => ({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
}

export function hasConflict(
  bookings: Booking[],
  spaceId: SpaceId,
  date: string,
  startTime: string,
  endTime: string,
  now: Date,
  ignoreBookingId?: string,
): boolean {
  return bookings.some(
    (booking) =>
      booking.id !== ignoreBookingId &&
      occupiesSpace(booking, now) &&
      spacesConflict(booking.spaceId, spaceId) &&
      booking.date === date &&
      intervalsOverlap(startTime, endTime, booking.startTime, booking.endTime),
  );
}
