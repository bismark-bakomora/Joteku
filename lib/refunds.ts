import { SpaceBooking, TableReservation } from '@/types/booking';
import { PricingSettings } from '@/types/pricing';
import { hoursBetween, toDateTime, wholeDaysBetween } from './dates';
import { roundMoney } from './pricing';

export type CancelledBy = 'customer' | 'joteku';

export function spaceRefundRate(daysBeforeEvent: number, settings: PricingSettings): number {
  const tiers = [...settings.spaceRefundTiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  const tier = tiers.find((candidate) => daysBeforeEvent >= candidate.minDaysBefore);
  return tier ? tier.refundRate : 0;
}

function spaceCancellationRate(
  booking: SpaceBooking,
  now: Date,
  cancelledBy: CancelledBy,
  settings: PricingSettings,
): number {
  if (cancelledBy === 'joteku') {
    return 1;
  }
  const eventStart = toDateTime(booking.date, booking.startTime);
  return spaceRefundRate(wholeDaysBetween(now, eventStart), settings);
}

export function spaceRefundAmount(
  booking: SpaceBooking,
  now: Date,
  cancelledBy: CancelledBy,
  settings: PricingSettings,
): number {
  if (booking.status !== 'confirmed' || booking.amountPaid <= 0) {
    return 0;
  }
  return roundMoney(booking.amountPaid * spaceCancellationRate(booking, now, cancelledBy, settings));
}

// The brief sets no separate rule for catering paid with Pay Balance, so it is
// refunded at the same rate as the booking itself.
export function cateringRefundAmount(
  booking: SpaceBooking,
  now: Date,
  cancelledBy: CancelledBy,
  settings: PricingSettings,
): number {
  const catering = booking.catering;
  if (booking.status !== 'confirmed' || catering?.status !== 'paid' || !catering.quoteAmount) {
    return 0;
  }
  return roundMoney(catering.quoteAmount * spaceCancellationRate(booking, now, cancelledBy, settings));
}

export function tableRefundAmount(
  reservation: TableReservation,
  now: Date,
  cancelledBy: CancelledBy,
  settings: PricingSettings,
): number {
  if (reservation.status !== 'confirmed' || reservation.amountPaid <= 0) {
    return 0;
  }
  if (cancelledBy === 'joteku') {
    return reservation.amountPaid;
  }
  const reservationTime = toDateTime(reservation.date, reservation.time);
  return hoursBetween(now, reservationTime) >= settings.tableFullRefundHours
    ? reservation.amountPaid
    : 0;
}
