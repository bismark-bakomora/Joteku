import { contact } from '@/data/contact';
import { eventTypes } from '@/data/eventTypes';
import { mobileMoneyNetworks } from '@/data/networks';
// Printed receipts are always on white paper, so they use the light palette.
import { lightColors as colors } from '@/theme/colors';
import { Booking, DecorationPackage, SpaceBooking, TableReservation } from '@/types/booking';
import { Payment } from '@/types/payment';
import { Space } from '@/types/space';
import { bookingEnd } from './availability';
import { toDateTime } from './dates';
import {
  formatDateLong,
  formatGhs,
  formatHours,
  formatStamp,
  formatTime12,
  formatTimeRange,
} from './format';
import { formatPhoneLocal } from './phone';

export type ReceiptRow = {
  label: string;
  value: string;
};

export type Receipt = {
  title: string;
  reference: string;
  details: ReceiptRow[];
  charges: ReceiptRow[];
  totalLabel: string;
  total: string;
  payment: ReceiptRow[];
  notes: string[];
};

export type CalendarEntry = {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes: string;
};

const VENUE_ADDRESS = `${contact.venueName}, ${contact.addressLine1}, ${contact.addressLine2}`;

export function eventTypeLabel(eventType: SpaceBooking['eventType']): string {
  return eventTypes.find((type) => type.id === eventType)?.label ?? 'Event';
}

export function networkName(network: Payment['network']): string {
  return mobileMoneyNetworks.find((candidate) => candidate.id === network)?.name ?? network;
}

function paymentRows(payment: Payment | null): ReceiptRow[] {
  if (!payment) {
    return [];
  }
  return [
    {
      label: 'Paid with',
      value: `${networkName(payment.network)} Mobile Money, ${formatPhoneLocal(payment.phone)}`,
    },
    { label: 'Paid on', value: formatStamp(payment.completedAt ?? payment.createdAt) },
  ];
}

function refundRows(booking: Booking): ReceiptRow[] {
  return booking.refundedAmount > 0
    ? [{ label: 'Refunded', value: formatGhs(booking.refundedAmount) }]
    : [];
}

export function spaceBookingReceipt(
  booking: SpaceBooking,
  space: Space,
  decoration: DecorationPackage | null,
  payment: Payment | null,
): Receipt {
  const hours = (toDateTime(booking.date, booking.endTime).getTime() -
    toDateTime(booking.date, booking.startTime).getTime()) / 3600000;
  const charges: ReceiptRow[] = [
    {
      label: `Venue hire, ${space.name} (${formatHours(booking.venueHireAmount / space.hourlyRate)} at ${formatGhs(space.hourlyRate)}/hr)`,
      value: formatGhs(booking.venueHireAmount),
    },
  ];
  if (decoration) {
    charges.push({ label: `${decoration.name} decoration`, value: formatGhs(booking.decorationAmount) });
  }
  const catering = booking.catering;
  const cateringPaid = catering?.status === 'paid' && catering.quoteAmount ? catering.quoteAmount : 0;
  if (cateringPaid > 0) {
    charges.push({ label: 'Custom catering (Pay Balance)', value: formatGhs(cateringPaid) });
  }

  const notes: string[] = [];
  if (catering?.status === 'requested') {
    notes.push('Custom catering requested. Joteku will send you a quote to pay in the app.');
  } else if (catering?.status === 'quoted' && catering.quoteAmount) {
    notes.push(
      `A catering quote of ${formatGhs(catering.quoteAmount)} is waiting. Pay it with Pay Balance in My Bookings.`,
    );
  }
  if (booking.previousDate) {
    notes.push(`Date changed from ${formatDateLong(booking.previousDate)}.`);
  }

  return {
    title: `${eventTypeLabel(booking.eventType)} at ${space.name}`,
    reference: booking.reference,
    details: [
      { label: 'Date', value: formatDateLong(booking.date) },
      { label: 'Time', value: `${formatTimeRange(booking.startTime, booking.endTime)} (${formatHours(hours)})` },
      { label: 'Space', value: space.name },
      { label: 'Guests', value: String(booking.guestCount) },
    ],
    charges,
    totalLabel: 'Total paid',
    total: formatGhs((booking.amountPaid > 0 ? booking.amountPaid : booking.amountDue) + cateringPaid),
    payment: [...paymentRows(payment), ...refundRows(booking)],
    notes,
  };
}

export function tableReservationReceipt(
  reservation: TableReservation,
  payment: Payment | null,
): Receipt {
  const charges: ReceiptRow[] = reservation.preOrder.map((line) => ({
    label: `${line.name} x ${line.quantity}`,
    value: formatGhs(line.unitPrice * line.quantity),
  }));
  if (reservation.preOrder.length > 0) {
    charges.push({ label: 'Pre-order total', value: formatGhs(reservation.preOrderTotal) });
  }

  const notes =
    reservation.balanceAtVenue > 0
      ? [`Balance of ${formatGhs(reservation.balanceAtVenue)} is paid at the venue.`]
      : [];

  return {
    title: `Table for ${reservation.partySize}`,
    reference: reservation.reference,
    details: [
      { label: 'Date', value: formatDateLong(reservation.date) },
      { label: 'Time', value: formatTime12(reservation.time) },
      { label: 'People', value: String(reservation.partySize) },
      {
        label: 'Pre-order',
        value:
          reservation.preOrder.length === 0
            ? 'None'
            : `${reservation.preOrder.length} ${reservation.preOrder.length === 1 ? 'item' : 'items'}`,
      },
    ],
    charges,
    totalLabel: 'Deposit paid',
    total: formatGhs(reservation.amountPaid > 0 ? reservation.amountPaid : reservation.amountDue),
    payment: [...paymentRows(payment), ...refundRows(reservation)],
    notes,
  };
}

export function receiptText(receipt: Receipt): string {
  const rows = (items: ReceiptRow[]) => items.map((row) => `${row.label}: ${row.value}`);
  return [
    `${contact.venueName} booking receipt`,
    `Reference: ${receipt.reference}`,
    receipt.title,
    ...rows(receipt.details),
    '',
    ...rows(receipt.charges),
    `${receipt.totalLabel}: ${receipt.total}`,
    ...rows(receipt.payment),
    ...receipt.notes,
    '',
    VENUE_ADDRESS,
    contact.phoneDisplay,
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function receiptHtml(receipt: Receipt): string {
  const rows = (items: ReceiptRow[]) =>
    items
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td><td class="value">${escapeHtml(row.value)}</td></tr>`,
      )
      .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Helvetica, Arial, sans-serif; color: ${colors.text}; padding: 32px; }
    h1 { color: ${colors.primary}; margin: 0; }
    .reference { color: ${colors.secondary}; font-size: 20px; font-weight: bold; margin: 8px 0 24px; }
    h2 { font-size: 16px; color: ${colors.primary}; border-bottom: 2px solid ${colors.border}; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td { padding: 6px 0; vertical-align: top; }
    td.value { text-align: right; font-weight: bold; }
    .total td { font-size: 18px; color: ${colors.primary}; border-top: 2px solid ${colors.border}; padding-top: 10px; }
    .note { color: ${colors.textSubtle}; }
    .footer { margin-top: 32px; color: ${colors.textMuted}; font-size: 13px; }
  </style></head><body>
    <h1>${escapeHtml(contact.venueName)}</h1>
    <div>Booking receipt</div>
    <div class="reference">${escapeHtml(receipt.reference)}</div>
    <h2>${escapeHtml(receipt.title)}</h2>
    <table>${rows(receipt.details)}</table>
    <h2>Charges</h2>
    <table>${rows(receipt.charges)}<tr class="total"><td>${escapeHtml(receipt.totalLabel)}</td><td class="value">${escapeHtml(receipt.total)}</td></tr></table>
    ${receipt.payment.length > 0 ? `<h2>Payment</h2><table>${rows(receipt.payment)}</table>` : ''}
    ${receipt.notes.map((note) => `<p class="note">${escapeHtml(note)}</p>`).join('')}
    <div class="footer">${escapeHtml(VENUE_ADDRESS)}<br>${escapeHtml(contact.phoneDisplay)}</div>
  </body></html>`;
}

export function spaceCalendarEntry(booking: SpaceBooking, space: Space): CalendarEntry {
  return {
    title: `${eventTypeLabel(booking.eventType)} at ${contact.venueName}`,
    startDate: toDateTime(booking.date, booking.startTime),
    endDate: toDateTime(booking.date, booking.endTime),
    location: VENUE_ADDRESS,
    notes: `${space.name}, ${booking.guestCount} guests. Booking reference ${booking.reference}.`,
  };
}

export function tableCalendarEntry(reservation: TableReservation): CalendarEntry {
  return {
    title: `Table for ${reservation.partySize} at ${contact.venueName}`,
    startDate: toDateTime(reservation.date, reservation.time),
    endDate: bookingEnd(reservation),
    location: VENUE_ADDRESS,
    notes: `Reservation reference ${reservation.reference}.`,
  };
}

function googleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(entry: CalendarEntry): string {
  const params = [
    ['action', 'TEMPLATE'],
    ['text', entry.title],
    ['dates', `${googleDate(entry.startDate)}/${googleDate(entry.endDate)}`],
    ['details', entry.notes],
    ['location', entry.location],
  ];
  return `https://calendar.google.com/calendar/render?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
}

export function bookingTitle(booking: Booking): string {
  if (booking.kind === 'table') {
    return `Table for ${booking.partySize}`;
  }
  return `${eventTypeLabel(booking.eventType)} at ${booking.spaceName}`;
}
