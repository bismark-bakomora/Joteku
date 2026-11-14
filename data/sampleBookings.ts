import { addDays, toDateKey, toDateTime } from '@/lib/dates';
import {
  estimateSpaceBooking,
  preOrderTotal,
  roundMoney,
  tablePayment,
} from '@/lib/pricing';
import {
  Booking,
  BookingStatus,
  CateringRequest,
  DecorationId,
  EventType,
  SpaceBooking,
  TableReservation,
} from '@/types/booking';
import { PreOrderLine } from '@/types/menu';
import { MobileMoneyNetwork, Payment, Transaction } from '@/types/payment';
import { SpaceId } from '@/types/space';
import { getDecoration } from './decorations';
import { menu } from './menu';
import { pricingSettings } from './pricing';
import { getSpace } from './spaces';

export type SampleState = {
  bookings: Booking[];
  payments: Payment[];
  transactions: Transaction[];
};

const CUSTOMER_PHONE = '+233200000001';
const OTHER_PHONE = '+233500000002';

type SpaceSample = {
  reference: string;
  phone: string;
  eventType: EventType;
  spaceId: SpaceId;
  dayOffset: number;
  startTime: string;
  endTime: string;
  guestCount: number;
  decorationId: DecorationId | null;
  status: BookingStatus;
  bookedDaysAgo: number;
  network: MobileMoneyNetwork;
  catering?: CateringRequest;
  cancelledDaysAgo?: number;
};

type TableSample = {
  reference: string;
  phone: string;
  dayOffset: number;
  time: string;
  partySize: number;
  items: [string, number][];
  status: BookingStatus;
  bookedDaysAgo: number;
  network: MobileMoneyNetwork;
};

const SPACE_SAMPLES: SpaceSample[] = [
  {
    reference: 'JTK-W3D5N8',
    phone: CUSTOMER_PHONE,
    eventType: 'wedding',
    spaceId: 'whole-venue',
    dayOffset: 21,
    startTime: '12:00',
    endTime: '18:00',
    guestCount: 150,
    decorationId: 'premium',
    status: 'confirmed',
    bookedDaysAgo: 12,
    network: 'mtn',
    catering: {
      details: 'Buffet for 150 guests: jollof, banku with tilapia, grilled chicken and drinks service.',
      status: 'quoted',
      quoteAmount: 6500,
    },
  },
  {
    reference: 'JTK-M7K2P4',
    phone: CUSTOMER_PHONE,
    eventType: 'meeting',
    spaceId: 'hut-1',
    dayOffset: 3,
    startTime: '15:00',
    endTime: '17:00',
    guestCount: 18,
    decorationId: null,
    status: 'confirmed',
    bookedDaysAgo: 5,
    network: 'telecel',
  },
  {
    reference: 'JTK-B9R6T2',
    phone: OTHER_PHONE,
    eventType: 'birthday',
    spaceId: 'hut-3',
    dayOffset: 10,
    startTime: '14:00',
    endTime: '19:00',
    guestCount: 35,
    decorationId: 'standard',
    status: 'confirmed',
    bookedDaysAgo: 3,
    network: 'airteltigo',
  },
  {
    reference: 'JTK-E4X8Q6',
    phone: CUSTOMER_PHONE,
    eventType: 'engagement',
    spaceId: 'hut-4',
    dayOffset: 16,
    startTime: '13:00',
    endTime: '18:00',
    guestCount: 40,
    decorationId: 'basic',
    status: 'cancelled',
    bookedDaysAgo: 9,
    cancelledDaysAgo: 1,
    network: 'mtn',
  },
  {
    reference: 'JTK-C5L3V9',
    phone: CUSTOMER_PHONE,
    eventType: 'meeting',
    spaceId: 'hut-2',
    dayOffset: -20,
    startTime: '14:00',
    endTime: '16:00',
    guestCount: 15,
    decorationId: null,
    status: 'completed',
    bookedDaysAgo: 30,
    network: 'mtn',
  },
];

const TABLE_SAMPLES: TableSample[] = [
  {
    reference: 'JTK-T2H7J5',
    phone: CUSTOMER_PHONE,
    dayOffset: 2,
    time: '19:00',
    partySize: 4,
    items: [
      ['banku-fried-fish', 2],
      ['club-beer-large', 2],
    ],
    status: 'confirmed',
    bookedDaysAgo: 1,
    network: 'mtn',
  },
  {
    reference: 'JTK-T8F4G3',
    phone: CUSTOMER_PHONE,
    dayOffset: -12,
    time: '13:00',
    partySize: 2,
    items: [],
    status: 'completed',
    bookedDaysAgo: 14,
    network: 'mtn',
  },
];

export function buildSampleState(now: Date): SampleState {
  const state: SampleState = { bookings: [], payments: [], transactions: [] };

  const dateAt = (dayOffset: number) => toDateKey(addDays(now, dayOffset));
  const stampAt = (dayOffset: number, time: string) =>
    toDateTime(dateAt(dayOffset), time).toISOString();

  const recordPayment = (
    booking: Booking,
    purpose: Payment['purpose'],
    description: string,
    network: MobileMoneyNetwork,
    paidAt: string,
  ) => {
    state.payments.push({
      id: `pay-${booking.reference}`,
      bookingId: booking.id,
      bookingReference: booking.reference,
      purpose,
      amount: booking.amountPaid,
      phone: booking.phone,
      network,
      description,
      status: 'success',
      createdAt: paidAt,
      completedAt: paidAt,
    });
    state.transactions.push({
      id: `txn-${booking.reference}-payment`,
      type: 'payment',
      status: 'success',
      bookingId: booking.id,
      bookingReference: booking.reference,
      amount: booking.amountPaid,
      phone: booking.phone,
      network,
      description,
      date: paidAt,
    });
  };

  const recordRefund = (booking: Booking, network: MobileMoneyNetwork) => {
    state.transactions.push({
      id: `txn-${booking.reference}-refund`,
      type: 'refund',
      status: 'success',
      bookingId: booking.id,
      bookingReference: booking.reference,
      amount: booking.refundedAmount,
      phone: booking.phone,
      network,
      description: `Refund for ${booking.reference}`,
      date: booking.cancelledAt ?? stampAt(-1, '12:00'),
    });
  };

  for (const sample of SPACE_SAMPLES) {
    const space = getSpace(sample.spaceId);
    const decoration = sample.decorationId ? getDecoration(sample.decorationId) : null;
    const estimate = estimateSpaceBooking(space, sample.startTime, sample.endTime, decoration);
    const cancelled = sample.status === 'cancelled';
    const bookedAt = stampAt(-sample.bookedDaysAgo, '10:00');

    const booking: SpaceBooking = {
      kind: 'space',
      id: `space-${sample.reference}`,
      reference: sample.reference,
      status: sample.status,
      phone: sample.phone,
      createdAt: bookedAt,
      amountDue: estimate.total,
      amountPaid: estimate.total,
      paymentId: `pay-${sample.reference}`,
      refundedAmount: cancelled ? roundMoney(estimate.total * 0.8) : 0,
      cancelledAt: cancelled ? stampAt(-(sample.cancelledDaysAgo ?? 1), '12:00') : undefined,
      eventType: sample.eventType,
      spaceId: sample.spaceId,
      date: dateAt(sample.dayOffset),
      startTime: sample.startTime,
      endTime: sample.endTime,
      guestCount: sample.guestCount,
      decorationId: sample.decorationId,
      venueHireAmount: estimate.venueHire,
      decorationAmount: estimate.decoration,
      catering: sample.catering,
      dateChangeUsed: false,
    };

    state.bookings.push(booking);
    recordPayment(booking, 'space_booking', `${space.name} booking`, sample.network, bookedAt);
    if (cancelled) {
      recordRefund(booking, sample.network);
    }
  }

  for (const sample of TABLE_SAMPLES) {
    const preOrder: PreOrderLine[] = sample.items.map(([itemId, quantity]) => {
      const item = menu.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        throw new Error(`Unknown menu item in sample data: ${itemId}`);
      }
      return { itemId, name: item.name, unitPrice: item.price, quantity };
    });
    const orderTotal = preOrderTotal(preOrder);
    const { deposit, balanceAtVenue } = tablePayment(orderTotal, pricingSettings);
    const bookedAt = stampAt(-sample.bookedDaysAgo, '09:00');

    const reservation: TableReservation = {
      kind: 'table',
      id: `table-${sample.reference}`,
      reference: sample.reference,
      status: sample.status,
      phone: sample.phone,
      createdAt: bookedAt,
      amountDue: deposit,
      amountPaid: deposit,
      paymentId: `pay-${sample.reference}`,
      refundedAmount: 0,
      date: dateAt(sample.dayOffset),
      time: sample.time,
      partySize: sample.partySize,
      preOrder,
      preOrderTotal: orderTotal,
      balanceAtVenue,
    };

    state.bookings.push(reservation);
    recordPayment(reservation, 'table_deposit', 'Table reservation deposit', sample.network, bookedAt);
  }

  return state;
}
