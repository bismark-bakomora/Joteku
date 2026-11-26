import { fromDatabaseStamp } from '@/lib/dates';
import { AppError, AppErrorCode } from '@/lib/errors';
import { Booking, CateringRequest, DecorationId, EventType } from '@/types/booking';
import { MobileMoneyNetwork, Payment, PaymentPurpose, PaymentStatus, Transaction } from '@/types/payment';
import { SpaceId } from '@/types/space';
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// The database's functions put the app's error code in HINT, with the message
// to show. Anything else (a dropped connection, say) is passed on as it is, so
// screens fall back to their own wording.
const APP_ERROR_CODES: readonly AppErrorCode[] = [
  'invalid_phone',
  'invalid_booking',
  'invalid_payment',
  'slot_unavailable',
  'not_found',
  'invalid_state',
  'not_signed_in',
];

export function failure(error: PostgrestError): AppError | PostgrestError {
  const code = APP_ERROR_CODES.find((candidate) => candidate === error.hint);
  return code ? new AppError(code, error.message) : error;
}

// Supabase returns { data, error }; this returns the data or throws.
export function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw failure(result.error);
  }
  if (result.data === null) {
    throw new AppError('not_found', 'We could not find that.');
  }
  return result.data;
}

// Calls a database function whose result needs no embedded rows.
export async function callFunction<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    throw failure(error);
  }
  return data as T;
}

// Venue time is UTC (see lib/dates), so a stored time splits straight into the
// app's 'YYYY-MM-DD' and 'HH:mm'.
function venueDate(stamp: string): string {
  return fromDatabaseStamp(stamp).slice(0, 10);
}

function venueTime(stamp: string): string {
  return fromDatabaseStamp(stamp).slice(11, 16);
}

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

// Every time from the database goes through fromDatabaseStamp (see lib/dates).
function optionalStamp(stamp: string | null): string | undefined {
  return stamp === null ? undefined : fromDatabaseStamp(stamp);
}

export const BOOKING_COLUMNS =
  '*, space:spaces(name), catering:catering_requests(*), pre_order:booking_pre_order_lines(item_id, name, unit_price, quantity)';

type CateringRow = {
  details: string;
  status: CateringRequest['status'];
  quote_amount: number | null;
  quoted_at: string | null;
  payment_id: string | null;
  paid_at: string | null;
};

export type BookingRow = {
  id: string;
  reference: string;
  kind: 'space' | 'table';
  phone: string;
  status: Booking['status'];
  created_at: string;
  hold_expires_at: string | null;
  starts_at: string;
  ends_at: string;
  amount_due: number;
  amount_paid: number;
  refunded_amount: number;
  payment_id: string | null;
  cancelled_at: string | null;
  event_type: EventType | null;
  space_id: SpaceId | null;
  guest_count: number | null;
  notes: string | null;
  decoration_id: DecorationId | null;
  venue_hire_amount: number | null;
  decoration_amount: number | null;
  date_change_used: boolean;
  previous_starts_at: string | null;
  date_changed_at: string | null;
  party_size: number | null;
  pre_order_total: number | null;
  balance_at_venue: number | null;
  space: { name: string } | null;
  catering: CateringRow | null;
  pre_order: { item_id: string; name: string; unit_price: number; quantity: number }[];
};

export function toBooking(row: BookingRow): Booking {
  const base = {
    id: row.id,
    reference: row.reference,
    status: row.status,
    phone: row.phone,
    createdAt: fromDatabaseStamp(row.created_at),
    holdExpiresAt: row.status === 'pending_payment' ? optionalStamp(row.hold_expires_at) : undefined,
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
    paymentId: optional(row.payment_id),
    refundedAmount: Number(row.refunded_amount),
    cancelledAt: optionalStamp(row.cancelled_at),
    date: venueDate(row.starts_at),
  };

  if (row.kind === 'table') {
    return {
      ...base,
      kind: 'table',
      time: venueTime(row.starts_at),
      partySize: row.party_size ?? 1,
      preOrder: row.pre_order.map((line) => ({
        itemId: line.item_id,
        name: line.name,
        unitPrice: Number(line.unit_price),
        quantity: line.quantity,
      })),
      preOrderTotal: Number(row.pre_order_total ?? 0),
      balanceAtVenue: Number(row.balance_at_venue ?? 0),
    };
  }

  const catering = row.catering;
  return {
    ...base,
    kind: 'space',
    eventType: row.event_type ?? 'other_reception',
    spaceId: row.space_id ?? 'whole-venue',
    spaceName: row.space?.name ?? 'Joteku',
    startTime: venueTime(row.starts_at),
    endTime: venueTime(row.ends_at),
    guestCount: row.guest_count ?? 1,
    notes: optional(row.notes),
    decorationId: row.decoration_id,
    venueHireAmount: Number(row.venue_hire_amount ?? 0),
    decorationAmount: Number(row.decoration_amount ?? 0),
    catering: catering
      ? {
          details: catering.details,
          status: catering.status,
          quoteAmount: catering.quote_amount === null ? undefined : Number(catering.quote_amount),
          quotedAt: optionalStamp(catering.quoted_at),
          paymentId: optional(catering.payment_id),
          paidAt: optionalStamp(catering.paid_at),
        }
      : undefined,
    dateChangeUsed: row.date_change_used,
    previousDate: row.previous_starts_at ? venueDate(row.previous_starts_at) : undefined,
    previousStartTime: row.previous_starts_at ? venueTime(row.previous_starts_at) : undefined,
    dateChangedAt: optionalStamp(row.date_changed_at),
  };
}

// payments has two links to bookings (each payment's booking, and each
// booking's own payment), so the embed names the one it follows.
export const PAYMENT_COLUMNS = '*, booking:bookings!payments_booking_id_fkey(reference)';

export type PaymentRow = {
  id: string;
  booking_id: string;
  type: 'payment' | 'refund';
  purpose: PaymentPurpose;
  status: PaymentStatus;
  amount: number;
  phone: string;
  network: MobileMoneyNetwork;
  description: string;
  created_at: string;
  completed_at: string | null;
  booking: { reference: string } | null;
};

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    bookingReference: row.booking?.reference ?? '',
    purpose: row.purpose,
    amount: Number(row.amount),
    phone: row.phone,
    network: row.network,
    description: row.description,
    status: row.status,
    createdAt: fromDatabaseStamp(row.created_at),
    completedAt: optionalStamp(row.completed_at),
  };
}

export function toTransaction(row: PaymentRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    bookingId: row.booking_id,
    bookingReference: row.booking?.reference ?? '',
    amount: Number(row.amount),
    phone: row.phone,
    network: row.network,
    description: row.description,
    date: fromDatabaseStamp(row.completed_at ?? row.created_at),
  };
}
