import { Booking, BusySlot, SpaceBooking } from '@/types/booking';
import { Space, SpaceId } from '@/types/space';
import { addMinutes, minutesToTime, timeToMinutes, toDateTime } from './dates';

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
  ignoreBookingId?: string,
): BusySlot[] {
  return bookings
    .filter(
      (booking): booking is SpaceBooking =>
        booking.id !== ignoreBookingId &&
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

export type TimeOption = {
  time: string;
  available: boolean;
};

type OpeningHours = {
  opensAt: string;
  closesAt: string;
};

// Bookings start and end on the hour, matching the hourly price.
const SLOT_STEP_MINUTES = 60;

function busyOnDate(busy: BusySlot[], date: string): BusySlot[] {
  return busy.filter((slot) => slot.date === date);
}

// Every hour a booking could start on this date. A start is available when the
// space's minimum booking from that hour is free and has not already begun.
export function startTimeOptions(
  space: Space,
  date: string,
  busy: BusySlot[],
  now: Date,
  hours: OpeningHours,
): TimeOption[] {
  const opens = timeToMinutes(hours.opensAt);
  const closes = timeToMinutes(hours.closesAt);
  const minimum = space.minHours * 60;
  const taken = busyOnDate(busy, date);
  const options: TimeOption[] = [];
  for (let minute = opens; minute + minimum <= closes; minute += SLOT_STEP_MINUTES) {
    const start = minutesToTime(minute);
    const end = minutesToTime(minute + minimum);
    const free = !taken.some((slot) => intervalsOverlap(start, end, slot.startTime, slot.endTime));
    options.push({ time: start, available: free && toDateTime(date, start) > now });
  }
  return options;
}

// Every hour the booking could end, from the minimum length up to closing. Once
// the booking would run into a taken slot, every later end is unavailable too.
export function endTimeOptions(
  space: Space,
  date: string,
  startTime: string,
  busy: BusySlot[],
  hours: OpeningHours,
): TimeOption[] {
  const closes = timeToMinutes(hours.closesAt);
  const taken = busyOnDate(busy, date);
  const options: TimeOption[] = [];
  let blocked = false;
  for (
    let minute = timeToMinutes(startTime) + space.minHours * 60;
    minute <= closes;
    minute += SLOT_STEP_MINUTES
  ) {
    const end = minutesToTime(minute);
    if (!blocked && taken.some((slot) => intervalsOverlap(startTime, end, slot.startTime, slot.endTime))) {
      blocked = true;
    }
    options.push({ time: end, available: !blocked });
  }
  return options;
}

export function isDateFullyBooked(
  space: Space,
  date: string,
  busy: BusySlot[],
  now: Date,
  hours: OpeningHours,
): boolean {
  return !startTimeOptions(space, date, busy, now, hours).some((option) => option.available);
}

// Table reservation times run on the hour from opening until an hour before
// closing, so the last table still has time to eat.
const LAST_TABLE_BEFORE_CLOSE_MINUTES = 60;

export function tableTimeOptions(date: string, now: Date, hours: OpeningHours): TimeOption[] {
  const options: TimeOption[] = [];
  const last = timeToMinutes(hours.closesAt) - LAST_TABLE_BEFORE_CLOSE_MINUTES;
  for (let minute = timeToMinutes(hours.opensAt); minute <= last; minute += SLOT_STEP_MINUTES) {
    const time = minutesToTime(minute);
    options.push({ time, available: toDateTime(date, time) > now });
  }
  return options;
}
