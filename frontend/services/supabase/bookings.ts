import { supabase } from '@/lib/supabase';
import { Booking, BusySlot } from '@/types/booking';
import { SpaceId } from '@/types/space';
import {
  BookingService,
  CancellationQuote,
  CancellationResult,
  SpaceBookingDraft,
  TableReservationDraft,
} from '../types';
import { BOOKING_COLUMNS, BookingRow, callFunction, toBooking, unwrap } from './rows';

// Bookings change only through the database's functions, which check the
// caller, the rules and the prices. Customers can read only their own bookings.
export class SupabaseBookingService implements BookingService {
  async getBusySlots(
    spaceId: SpaceId,
    fromDate: string,
    toDate: string,
    ignoreBookingId?: string,
  ): Promise<BusySlot[]> {
    const rows = await callFunction<{ date: string; start_time: string; end_time: string }[]>(
      'get_busy_slots',
      {
        p_space_id: spaceId,
        p_from: fromDate,
        p_to: toDate,
        p_ignore_booking_id: ignoreBookingId ?? null,
      },
    );
    return rows.map((row) => ({ date: row.date, startTime: row.start_time, endTime: row.end_time }));
  }

  async createSpaceBooking(draft: SpaceBookingDraft): Promise<Booking> {
    const row = unwrap(
      await supabase
        .rpc('create_space_booking', {
          p_event_type: draft.eventType,
          p_space_id: draft.spaceId,
          p_date: draft.date,
          p_start_time: draft.startTime,
          p_end_time: draft.endTime,
          p_guest_count: draft.guestCount,
          p_notes: draft.notes ?? null,
          p_decoration_id: draft.decorationId,
          p_catering_details: draft.cateringDetails ?? null,
        })
        .select(BOOKING_COLUMNS)
        .single<BookingRow>(),
    );
    return toBooking(row);
  }

  async createTableReservation(draft: TableReservationDraft): Promise<Booking> {
    const row = unwrap(
      await supabase
        .rpc('create_table_reservation', {
          p_date: draft.date,
          p_time: draft.time,
          p_party_size: draft.partySize,
          p_pre_order: draft.preOrder,
        })
        .select(BOOKING_COLUMNS)
        .single<BookingRow>(),
    );
    return toBooking(row);
  }

  async releaseHold(bookingId: string): Promise<void> {
    await callFunction<null>('release_hold', { p_booking_id: bookingId });
  }

  async restartHold(bookingId: string): Promise<Booking> {
    const row = unwrap(
      await supabase
        .rpc('restart_hold', { p_booking_id: bookingId })
        .select(BOOKING_COLUMNS)
        .single<BookingRow>(),
    );
    return toBooking(row);
  }

  async getCancellationQuote(bookingId: string): Promise<CancellationQuote> {
    const quote = await callFunction<CancellationQuote>('get_cancellation_quote', {
      p_booking_id: bookingId,
    });
    return { cancellable: quote.cancellable, refundAmount: Number(quote.refundAmount) };
  }

  async cancelBooking(bookingId: string): Promise<CancellationResult> {
    const result = await callFunction<{ refundAmount: number }>('cancel_booking', {
      p_booking_id: bookingId,
    });
    return { booking: await this.getBooking(bookingId), refundAmount: Number(result.refundAmount) };
  }

  async changeSpaceDate(bookingId: string, date: string, startTime: string): Promise<Booking> {
    const row = unwrap(
      await supabase
        .rpc('change_space_date', { p_booking_id: bookingId, p_date: date, p_start_time: startTime })
        .select(BOOKING_COLUMNS)
        .single<BookingRow>(),
    );
    return toBooking(row);
  }

  async getBooking(bookingId: string): Promise<Booking> {
    const row = unwrap(
      await supabase
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .eq('id', bookingId)
        .maybeSingle<BookingRow>(),
    );
    return toBooking(row);
  }

  async listMine(): Promise<Booking[]> {
    const rows = unwrap(
      await supabase
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .order('starts_at', { ascending: false })
        .returns<BookingRow[]>(),
    );
    return rows.map(toBooking);
  }
}
