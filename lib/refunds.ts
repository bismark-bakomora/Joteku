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

export function spaceRefundAmount(
  booking: SpaceBooking,
  now: Date,
  cancelledBy: CancelledBy,
  settings: PricingSettings,
): number {
  if (booking.status !== 'confirmed' || booking.amountPaid <= 0) {
    return 0;
  }
  if (cancelledBy === 'joteku') {
    return booking.amountPaid;
  }
  const eventStart = toDateTime(booking.date, booking.startTime);
  const rate = spaceRefundRate(wholeDaysBetween(now, eventStart), settings);
  return roundMoney(booking.amountPaid * rate);
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
