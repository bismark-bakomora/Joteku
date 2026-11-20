import { contact } from '@/data/contact';
import { spaces } from '@/data/spaces';
import { Booking } from '@/types/booking';
import { AppNotification } from '@/types/notification';
import { Transaction } from '@/types/payment';
import { PricingSettings } from '@/types/pricing';
import { bookingStart } from './availability';
import { formatDateShort, formatGhs, formatTime12 } from './format';
import { formatPhoneLocal } from './phone';
import { eventTypeLabel, networkName } from './receipt';

export type DraftNotification = Omit<AppNotification, 'read'>;

const REMINDER_HOURS = 24;

function describe(booking: Booking): string {
  if (booking.kind === 'table') {
    return `Your table for ${booking.partySize}`;
  }
  const space = spaces.find((candidate) => candidate.id === booking.spaceId);
  return `Your ${eventTypeLabel(booking.eventType).toLowerCase()} at ${space?.name ?? 'Joteku'}`;
}

// `original` describes the date the booking had before any date change, so older
// notifications keep saying what was true when they were sent.
function startLabel(booking: Booking, original = false): string {
  if (original && booking.kind === 'space' && booking.previousDate && booking.previousStartTime) {
    return `${formatDateShort(booking.previousDate)} at ${formatTime12(booking.previousStartTime)}`;
  }
  const time = booking.kind === 'space' ? booking.startTime : booking.time;
  return `${formatDateShort(booking.date)} at ${formatTime12(time)}`;
}

// Notifications are worked out from the booking and payment history, so they
// always match it. Each one would also go out as a text message (mocked).
export function buildNotifications(
  bookings: Booking[],
  transactions: Transaction[],
  now: Date,
  settings: PricingSettings,
): DraftNotification[] {
  const items: DraftNotification[] = [];

  for (const booking of bookings) {
    const add = (
      key: string,
      kind: DraftNotification['kind'],
      date: string,
      title: string,
      body: string,
      sentByText = true,
    ) => items.push({ id: `${booking.id}:${key}`, bookingId: booking.id, kind, date, title, body, sentByText });

    if (booking.amountPaid > 0) {
      const paid = transactions.find(
        (transaction) =>
          transaction.bookingId === booking.id &&
          transaction.type === 'payment' &&
          transaction.status === 'success',
      );
      add(
        'confirmed',
        'confirmed',
        paid?.date ?? booking.createdAt,
        booking.kind === 'table' ? 'Table reserved' : 'Booking confirmed',
        `${describe(booking)} on ${startLabel(booking, true)} is confirmed. Reference ${booking.reference}. Your receipt is in My Bookings.`,
      );
    }

    const start = bookingStart(booking);
    const reminderAt = new Date(start.getTime() - REMINDER_HOURS * 60 * 60 * 1000);
    if (
      (booking.status === 'confirmed' || booking.status === 'completed') &&
      reminderAt > new Date(booking.createdAt)
    ) {
      add(
        'reminder',
        'reminder',
        reminderAt.toISOString(),
        'Reminder: see you tomorrow',
        `${describe(booking)} is tomorrow, ${startLabel(booking)}, at ${contact.addressLine1}.`,
      );
    }

    if (booking.kind === 'space' && booking.catering) {
      const { quotedAt, quoteAmount, paidAt } = booking.catering;
      if (quotedAt && quoteAmount) {
        add(
          'catering-quoted',
          'catering_quoted',
          quotedAt,
          'Catering quote ready',
          `Your catering quote for ${booking.reference} is ${formatGhs(quoteAmount)}. Pay it in the app with Pay Balance.`,
        );
      }
      if (paidAt && quoteAmount) {
        add(
          'catering-paid',
          'catering_paid',
          paidAt,
          'Catering paid',
          `Thank you. The ${formatGhs(quoteAmount)} catering balance for ${booking.reference} is paid.`,
          false,
        );
      }
    }

    if (booking.kind === 'space' && booking.dateChangedAt) {
      add(
        'date-changed',
        'date_changed',
        booking.dateChangedAt,
        'Date changed',
        `${describe(booking)} is now on ${startLabel(booking)}. Reference ${booking.reference}.`,
      );
    }

    if (booking.status === 'cancelled' && booking.cancelledAt && booking.amountPaid > 0) {
      add(
        'cancelled',
        'cancelled',
        booking.cancelledAt,
        'Booking cancelled',
        booking.refundedAmount > 0
          ? `${booking.reference} is cancelled. ${formatGhs(booking.refundedAmount)} will be refunded to your mobile money within ${settings.refundWorkingDays} working days.`
          : `${booking.reference} is cancelled. No refund applies under the cancellation policy.`,
      );
    }
  }

  for (const transaction of transactions) {
    if (transaction.type === 'refund') {
      items.push({
        id: transaction.id,
        bookingId: transaction.bookingId,
        kind: 'refund',
        date: transaction.date,
        title: 'Refund sent',
        body: `${formatGhs(transaction.amount)} was sent to ${networkName(transaction.network)} ${formatPhoneLocal(transaction.phone)}. ${transaction.description}.`,
        sentByText: true,
      });
    }
  }

  return items
    .filter((item) => new Date(item.date) <= now)
    .sort((a, b) => b.date.localeCompare(a.date));
}
