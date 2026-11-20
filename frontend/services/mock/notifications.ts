import { pricingSettings } from '@/data/pricing';
import { AppError } from '@/lib/errors';
import { buildNotifications } from '@/lib/notifications';
import { normalizeGhanaPhone } from '@/lib/phone';
import { storage } from '@/lib/storage';
import { AppNotification } from '@/types/notification';
import { NotificationService } from '../types';
import { readDatabase } from './database';

function readKey(phone: string): string {
  return `notifications-read:${phone}`;
}

function requirePhone(input: string): string {
  const phone = normalizeGhanaPhone(input);
  if (!phone) {
    throw new AppError('invalid_phone', 'Enter a valid phone number.');
  }
  return phone;
}

export class MockNotificationService implements NotificationService {
  async list(customerPhone: string): Promise<AppNotification[]> {
    const phone = requirePhone(customerPhone);
    const drafts = await readDatabase((db, now) => {
      const bookings = db.bookings.filter((booking) => booking.phone === phone);
      const bookingIds = new Set(bookings.map((booking) => booking.id));
      const transactions = db.transactions.filter((transaction) => bookingIds.has(transaction.bookingId));
      return buildNotifications(bookings, transactions, now, pricingSettings);
    });
    const read = new Set((await storage.get<string[]>(readKey(phone))) ?? []);
    return drafts.map((draft) => ({ ...draft, read: read.has(draft.id) }));
  }

  async markRead(customerPhone: string, ids: string[]): Promise<void> {
    const phone = requirePhone(customerPhone);
    const read = new Set((await storage.get<string[]>(readKey(phone))) ?? []);
    ids.forEach((id) => read.add(id));
    await storage.set(readKey(phone), [...read]);
  }
}
