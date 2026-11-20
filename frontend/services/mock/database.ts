import { buildSampleState, SampleState } from '@/data/sampleBookings';
import { bookingEnd } from '@/lib/availability';
import { createId } from '@/lib/ids';
import { storage } from '@/lib/storage';
import { RefundRequest, Transaction } from '@/types/payment';

export type Database = SampleState;

const STORAGE_KEY = 'mock-database-v1';

let current: Database | null = null;
let queue: Promise<unknown> = Promise.resolve();

function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

async function load(): Promise<Database> {
  if (current === null) {
    const stored = await storage.get<Database>(STORAGE_KEY);
    current = stored ?? buildSampleState(new Date());
  }
  return current;
}

// Releases payment holds that ran out and marks finished bookings as completed.
function settle(db: Database, now: Date): void {
  for (const booking of db.bookings) {
    if (
      booking.status === 'pending_payment' &&
      booking.holdExpiresAt !== undefined &&
      new Date(booking.holdExpiresAt) <= now
    ) {
      booking.status = 'cancelled';
      booking.cancelledAt = booking.holdExpiresAt;
    } else if (booking.status === 'confirmed' && bookingEnd(booking) <= now) {
      booking.status = 'completed';
    }
  }
}

// Changes run one at a time and are all-or-nothing, like a database transaction,
// so two requests can never both take the same slot.
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

export function readDatabase<T>(read: (db: Database, now: Date) => T): Promise<T> {
  return enqueue(async () => {
    const snapshot = clone(await load());
    const now = new Date();
    settle(snapshot, now);
    return read(snapshot, now);
  });
}

export function writeDatabase<T>(write: (db: Database, now: Date) => T): Promise<T> {
  return enqueue(async () => {
    const draft = clone(await load());
    const now = new Date();
    settle(draft, now);
    const result = write(draft, now);
    await storage.set(STORAGE_KEY, draft);
    current = draft;
    return clone(result);
  });
}

export function recordRefund(db: Database, request: RefundRequest, now: Date): Transaction {
  const transaction: Transaction = {
    id: createId('txn'),
    type: 'refund',
    status: 'success',
    bookingId: request.bookingId,
    bookingReference: request.bookingReference,
    amount: request.amount,
    phone: request.phone,
    network: request.network,
    description: request.description,
    date: now.toISOString(),
  };
  db.transactions.push(transaction);
  return transaction;
}
