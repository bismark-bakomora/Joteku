import { pricingSettings } from '@/data/pricing';
import { hasConflict } from '@/lib/availability';
import { addMinutes } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import { Booking } from '@/types/booking';
import { Payment } from '@/types/payment';
import { Database } from './database';

export function findBooking(db: Database, bookingId: string): Booking {
  const booking = db.bookings.find((candidate) => candidate.id === bookingId);
  if (!booking) {
    throw new AppError('not_found', 'We could not find that booking.');
  }
  return booking;
}

export function startHold(booking: Booking, now: Date): void {
  booking.status = 'pending_payment';
  booking.holdExpiresAt = addMinutes(now, pricingSettings.holdMinutes).toISOString();
  booking.cancelledAt = undefined;
}

function slotIsFree(db: Database, booking: Booking, now: Date): boolean {
  return (
    booking.kind !== 'space' ||
    !hasConflict(
      db.bookings,
      booking.spaceId,
      booking.date,
      booking.startTime,
      booking.endTime,
      now,
      booking.id,
    )
  );
}

// A booking that was released before any payment can be revived if its slot is still free.
export function reviveReleasedBooking(db: Database, booking: Booking, now: Date): void {
  const neverPaid = booking.amountPaid === 0 && booking.refundedAmount === 0;
  if (booking.status !== 'cancelled' || !neverPaid) {
    throw new AppError('invalid_state', 'This booking can no longer be paid for.');
  }
  if (!slotIsFree(db, booking, now)) {
    throw new AppError(
      'slot_unavailable',
      'That time was taken while your payment was processing. Your payment will be refunded.',
    );
  }
  startHold(booking, now);
}

// Confirms the booking a successful payment belongs to. This is what a payment
// provider's callback does on the server, so bookings confirm automatically even
// if the customer closes the app while paying.
export function applySuccessfulPayment(db: Database, payment: Payment, now: Date): Booking {
  const booking = findBooking(db, payment.bookingId);
  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return booking;
  }
  if (payment.amount !== booking.amountDue) {
    throw new AppError('invalid_payment', 'The amount paid does not match this booking.');
  }
  if (booking.status === 'cancelled') {
    reviveReleasedBooking(db, booking, now);
  }
  booking.status = 'confirmed';
  booking.amountPaid = payment.amount;
  booking.paymentId = payment.id;
  booking.holdExpiresAt = undefined;
  return booking;
}
