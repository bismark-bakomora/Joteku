import { getDecoration } from '@/data/decorations';
import { menu } from '@/data/menu';
import { pricingSettings } from '@/data/pricing';
import { spaces } from '@/data/spaces';
import { contact } from '@/data/contact';
import { bookingStart, findBusySlots, hasConflict } from '@/lib/availability';
import {
  addMinutes,
  isValidDateKey,
  isValidTime,
  minutesToTime,
  timeToMinutes,
  toDateTime,
} from '@/lib/dates';
import { delay } from '@/lib/async';
import { AppError } from '@/lib/errors';
import { isWithinOpeningHours } from '@/lib/hours';
import { createId, createReference } from '@/lib/ids';
import { normalizeGhanaPhone } from '@/lib/phone';
import {
  estimateSpaceBooking,
  preOrderTotal,
  roundMoney,
  tablePayment,
  validateSpaceTimes,
} from '@/lib/pricing';
import {
  CancelledBy,
  cateringRefundAmount,
  spaceRefundAmount,
  tableRefundAmount,
} from '@/lib/refunds';
import { Booking, BusySlot, SpaceBooking, TableReservation } from '@/types/booking';
import { PreOrderLine } from '@/types/menu';
import { SpaceId } from '@/types/space';
import {
  BookingService,
  CancellationQuote,
  CancellationResult,
  SpaceBookingDraft,
  TableReservationDraft,
} from '../types';
import { Database, readDatabase, recordRefund, writeDatabase } from './database';
import { applySuccessfulPayment, findBooking, reviveReleasedBooking, startHold } from './holds';
import { MOCK_LATENCY_MS } from './latency';

function requirePhone(input: string): string {
  const phone = normalizeGhanaPhone(input);
  if (!phone) {
    throw new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.');
  }
  return phone;
}

function requireFutureSlot(date: string, time: string, now: Date): void {
  if (!isValidDateKey(date) || !isValidTime(time)) {
    throw new AppError('invalid_booking', 'Choose a valid date and time.');
  }
  if (toDateTime(date, time) <= now) {
    throw new AppError('invalid_booking', 'Choose a date and time that has not passed.');
  }
}

function takenReferences(db: Database): Set<string> {
  return new Set(db.bookings.map((booking) => booking.reference));
}

function isCancellable(booking: Booking): boolean {
  return booking.status === 'pending_payment' || booking.status === 'confirmed';
}

function refundBreakdown(
  booking: Booking,
  now: Date,
  cancelledBy: CancelledBy,
): { venue: number; catering: number } {
  if (booking.kind === 'table') {
    return { venue: tableRefundAmount(booking, now, cancelledBy, pricingSettings), catering: 0 };
  }
  return {
    venue: spaceRefundAmount(booking, now, cancelledBy, pricingSettings),
    catering: cateringRefundAmount(booking, now, cancelledBy, pricingSettings),
  };
}

export class MockBookingService implements BookingService {
  getBusySlots(
    spaceId: SpaceId,
    fromDate: string,
    toDate: string,
    ignoreBookingId?: string,
  ): Promise<BusySlot[]> {
    return readDatabase((db, now) =>
      findBusySlots(db.bookings, spaceId, fromDate, toDate, now, ignoreBookingId),
    );
  }

  async createSpaceBooking(draft: SpaceBookingDraft): Promise<Booking> {
    await delay(MOCK_LATENCY_MS);
    const phone = requirePhone(draft.phone);
    const space = spaces.find((candidate) => candidate.id === draft.spaceId);
    if (!space) {
      throw new AppError('invalid_booking', 'Choose a space to book.');
    }

    return writeDatabase((db, now) => {
      requireFutureSlot(draft.date, draft.startTime, now);
      if (!isValidTime(draft.endTime)) {
        throw new AppError('invalid_booking', 'Choose a valid end time.');
      }
      const timeError = validateSpaceTimes(space, draft.startTime, draft.endTime);
      if (timeError) {
        throw new AppError('invalid_booking', timeError);
      }
      if (!Number.isInteger(draft.guestCount) || draft.guestCount < 1) {
        throw new AppError('invalid_booking', 'Enter the number of guests.');
      }
      if (space.maxGuests !== null && draft.guestCount > space.maxGuests) {
        throw new AppError('invalid_booking', `${space.name} fits up to ${space.maxGuests} guests.`);
      }
      if (hasConflict(db.bookings, space.id, draft.date, draft.startTime, draft.endTime, now)) {
        throw new AppError(
          'slot_unavailable',
          'Sorry, that time is no longer available. Please choose another time.',
        );
      }

      const decoration = draft.decorationId ? getDecoration(draft.decorationId) : null;
      const estimate = estimateSpaceBooking(space, draft.startTime, draft.endTime, decoration);
      const cateringDetails = draft.cateringDetails?.trim();

      const booking: SpaceBooking = {
        kind: 'space',
        id: createId('space'),
        reference: createReference(takenReferences(db)),
        status: 'pending_payment',
        phone,
        createdAt: now.toISOString(),
        holdExpiresAt: addMinutes(now, pricingSettings.holdMinutes).toISOString(),
        amountDue: estimate.total,
        amountPaid: 0,
        refundedAmount: 0,
        eventType: draft.eventType,
        spaceId: space.id,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        guestCount: draft.guestCount,
        notes: draft.notes?.trim() || undefined,
        decorationId: draft.decorationId,
        venueHireAmount: estimate.venueHire,
        decorationAmount: estimate.decoration,
        catering: cateringDetails ? { details: cateringDetails, status: 'requested' } : undefined,
        dateChangeUsed: false,
      };
      db.bookings.push(booking);
      return booking;
    });
  }

  async createTableReservation(draft: TableReservationDraft): Promise<Booking> {
    await delay(MOCK_LATENCY_MS);
    const phone = requirePhone(draft.phone);

    return writeDatabase((db, now) => {
      requireFutureSlot(draft.date, draft.time, now);
      if (!isWithinOpeningHours(draft.time, contact)) {
        throw new AppError(
          'invalid_booking',
          `Choose a time between ${contact.openingHours.replace(' to ', ' and ')}.`,
        );
      }
      if (!Number.isInteger(draft.partySize) || draft.partySize < 1) {
        throw new AppError('invalid_booking', 'Enter the number of people.');
      }

      const preOrder: PreOrderLine[] = draft.preOrder.map((line) => {
        const item = menu.items.find((candidate) => candidate.id === line.itemId && candidate.available);
        if (!item || !Number.isInteger(line.quantity) || line.quantity < 1) {
          throw new AppError('invalid_booking', 'One of the pre-order items is not available.');
        }
        return { itemId: item.id, name: item.name, unitPrice: item.price, quantity: line.quantity };
      });
      const orderTotal = preOrderTotal(preOrder);
      const { deposit, balanceAtVenue } = tablePayment(orderTotal, pricingSettings);

      const reservation: TableReservation = {
        kind: 'table',
        id: createId('table'),
        reference: createReference(takenReferences(db)),
        status: 'pending_payment',
        phone,
        createdAt: now.toISOString(),
        holdExpiresAt: addMinutes(now, pricingSettings.holdMinutes).toISOString(),
        amountDue: deposit,
        amountPaid: 0,
        refundedAmount: 0,
        date: draft.date,
        time: draft.time,
        partySize: draft.partySize,
        preOrder,
        preOrderTotal: orderTotal,
        balanceAtVenue,
      };
      db.bookings.push(reservation);
      return reservation;
    });
  }

  markPaid(bookingId: string, paymentId: string): Promise<Booking> {
    return writeDatabase((db, now) => {
      const payment = db.payments.find(
        (candidate) => candidate.id === paymentId && candidate.bookingId === bookingId,
      );
      if (!payment || payment.status !== 'success') {
        throw new AppError('invalid_state', 'This payment has not been completed.');
      }
      return applySuccessfulPayment(db, payment, now);
    });
  }

  releaseHold(bookingId: string): Promise<void> {
    return writeDatabase((db, now) => {
      const booking = findBooking(db, bookingId);
      if (booking.status === 'pending_payment') {
        booking.status = 'cancelled';
        booking.cancelledAt = now.toISOString();
      }
    });
  }

  restartHold(bookingId: string): Promise<Booking> {
    return writeDatabase((db, now) => {
      const booking = findBooking(db, bookingId);
      if (booking.status === 'pending_payment') {
        startHold(booking, now);
        return booking;
      }
      reviveReleasedBooking(db, booking, now);
      return booking;
    });
  }

  getCancellationQuote(bookingId: string): Promise<CancellationQuote> {
    return readDatabase((db, now) => {
      const booking = findBooking(db, bookingId);
      const refund = refundBreakdown(booking, now, 'customer');
      return {
        cancellable: isCancellable(booking),
        refundAmount: roundMoney(refund.venue + refund.catering),
      };
    });
  }

  async cancelBooking(
    bookingId: string,
    cancelledBy: CancelledBy = 'customer',
  ): Promise<CancellationResult> {
    await delay(MOCK_LATENCY_MS);
    return writeDatabase((db, now) => {
      const booking = findBooking(db, bookingId);
      if (!isCancellable(booking)) {
        throw new AppError('invalid_state', 'This booking cannot be cancelled.');
      }
      const refund = refundBreakdown(booking, now, cancelledBy);
      const cateringPaymentId = booking.kind === 'space' ? booking.catering?.paymentId : undefined;
      const refunds = [
        { amount: refund.venue, paymentId: booking.paymentId, description: `Refund for ${booking.reference}` },
        {
          amount: refund.catering,
          paymentId: cateringPaymentId,
          description: `Catering refund for ${booking.reference}`,
        },
      ];
      for (const { amount, paymentId, description } of refunds) {
        const payment = db.payments.find((candidate) => candidate.id === paymentId);
        if (amount > 0 && payment) {
          recordRefund(
            db,
            {
              bookingId: booking.id,
              bookingReference: booking.reference,
              amount,
              phone: payment.phone,
              network: payment.network,
              description,
            },
            now,
          );
        }
      }

      const refundAmount = roundMoney(refund.venue + refund.catering);
      booking.status = 'cancelled';
      booking.cancelledAt = now.toISOString();
      booking.refundedAmount = refundAmount;
      booking.holdExpiresAt = undefined;
      return { booking, refundAmount };
    });
  }

  // The policy allows one date change per event booking, into a free slot of the
  // same space and the same length. It does not change the price.
  async changeSpaceDate(bookingId: string, date: string, startTime: string): Promise<Booking> {
    await delay(MOCK_LATENCY_MS);
    return writeDatabase((db, now) => {
      const booking = findBooking(db, bookingId);
      if (booking.kind !== 'space' || booking.status !== 'confirmed') {
        throw new AppError('invalid_state', 'Only a confirmed event booking can change its date.');
      }
      if (booking.dateChangeUsed) {
        throw new AppError('invalid_state', 'This booking has already used its one date change.');
      }
      requireFutureSlot(date, startTime, now);
      const space = spaces.find((candidate) => candidate.id === booking.spaceId);
      if (!space) {
        throw new AppError('not_found', 'We could not find the space for this booking.');
      }
      const length = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
      const endTime = minutesToTime(timeToMinutes(startTime) + length);
      const timeError = validateSpaceTimes(space, startTime, endTime);
      if (timeError) {
        throw new AppError('invalid_booking', timeError);
      }
      if (date === booking.date && startTime === booking.startTime) {
        throw new AppError('invalid_booking', 'Choose a different date or time.');
      }
      if (hasConflict(db.bookings, space.id, date, startTime, endTime, now, booking.id)) {
        throw new AppError(
          'slot_unavailable',
          'Sorry, that time is no longer available. Please choose another time.',
        );
      }
      booking.previousDate = booking.date;
      booking.previousStartTime = booking.startTime;
      booking.date = date;
      booking.startTime = startTime;
      booking.endTime = endTime;
      booking.dateChangeUsed = true;
      booking.dateChangedAt = now.toISOString();
      return booking;
    });
  }

  getBooking(bookingId: string): Promise<Booking> {
    return readDatabase((db) => findBooking(db, bookingId));
  }

  listForPhone(customerPhone: string): Promise<Booking[]> {
    const phone = normalizeGhanaPhone(customerPhone);
    if (!phone) {
      return Promise.reject(
        new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.'),
      );
    }
    return readDatabase((db) =>
      db.bookings
        .filter((booking) => booking.phone === phone)
        .sort((a, b) => bookingStart(b).getTime() - bookingStart(a).getTime()),
    );
  }
}
