import { AppError } from '@/lib/errors';
import { buildNotifications } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/types/notification';
import { BookingService, NotificationService, PaymentService, VenueService } from '../types';
import { unwrap } from './rows';

// Notifications are worked out from the customer's bookings and payments each
// time, so they always match them. Only which ones were read is stored.
export class SupabaseNotificationService implements NotificationService {
  constructor(
    private readonly bookings: BookingService,
    private readonly payments: PaymentService,
    private readonly venue: VenueService,
  ) {}

  async list(): Promise<AppNotification[]> {
    const [bookings, transactions, settings, reads] = await Promise.all([
      this.bookings.listMine(),
      this.payments.listTransactions(),
      this.venue.getSettings(),
      supabase.from('notification_reads').select('notification_id').returns<{ notification_id: string }[]>(),
    ]);
    const read = new Set(unwrap(reads).map((row) => row.notification_id));
    return buildNotifications(bookings, transactions, new Date(), settings).map((draft) => ({
      ...draft,
      read: read.has(draft.id),
    }));
  }

  async markRead(ids: string[]): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const customerId = data.session?.user.id;
    if (!customerId) {
      throw new AppError('not_signed_in', 'Please sign in to continue.');
    }
    const { error } = await supabase.from('notification_reads').upsert(
      ids.map((id) => ({ customer_id: customerId, notification_id: id })),
      { onConflict: 'customer_id,notification_id', ignoreDuplicates: true },
    );
    if (error) {
      throw error;
    }
  }
}
