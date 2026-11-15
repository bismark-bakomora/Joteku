import { delay } from '@/lib/async';
import { AppError } from '@/lib/errors';
import { createId } from '@/lib/ids';
import { normalizeGhanaPhone } from '@/lib/phone';
import { Payment, PaymentRequest, PaymentStatus, RefundRequest, Transaction } from '@/types/payment';
import { PaymentService } from '../types';
import { Database, readDatabase, recordRefund, writeDatabase } from './database';
import { applySuccessfulPayment } from './holds';
import { MOCK_LATENCY_MS } from './latency';

const PROCESSING_MS = 3000;

// The mobile money number decides the outcome, so every payment screen can be tested:
//   ends in 9999 -> fails, ends in 8888 -> stays pending, any other number -> succeeds.
function outcomeFor(phone: string): PaymentStatus {
  if (phone.endsWith('9999')) {
    return 'failed';
  }
  if (phone.endsWith('8888')) {
    return 'pending';
  }
  return 'success';
}

// Confirms the booking straight away. If its time was taken while the payment was
// pending, the money goes straight back to the same number.
function settleSuccessfulPayment(db: Database, payment: Payment, now: Date): void {
  try {
    applySuccessfulPayment(db, payment, now);
  } catch {
    const booking = db.bookings.find((candidate) => candidate.id === payment.bookingId);
    if (booking) {
      booking.refundedAmount = payment.amount;
    }
    recordRefund(
      db,
      {
        bookingId: payment.bookingId,
        bookingReference: payment.bookingReference,
        amount: payment.amount,
        phone: payment.phone,
        network: payment.network,
        description: `Refund for ${payment.bookingReference}: the time was no longer available`,
      },
      now,
    );
  }
}

export class MockPaymentService implements PaymentService {
  readonly testHint =
    'Numbers ending in 9999 fail and numbers ending in 8888 stay pending. Any other number is approved after a few seconds.';

  async startPayment(request: PaymentRequest): Promise<Payment> {
    await delay(MOCK_LATENCY_MS);
    const phone = normalizeGhanaPhone(request.phone);
    if (!phone) {
      throw new AppError('invalid_phone', 'Enter a valid mobile money number.');
    }
    if (!(request.amount > 0)) {
      throw new AppError('invalid_payment', 'The amount to pay must be more than zero.');
    }
    return writeDatabase((db, now) => {
      const payment: Payment = {
        ...request,
        phone,
        id: createId('pay'),
        status: 'pending',
        createdAt: now.toISOString(),
      };
      db.payments.push(payment);
      return payment;
    });
  }

  getPayment(paymentId: string): Promise<Payment> {
    return writeDatabase((db, now) => {
      const payment = db.payments.find((candidate) => candidate.id === paymentId);
      if (!payment) {
        throw new AppError('not_found', 'We could not find that payment.');
      }
      const age = now.getTime() - new Date(payment.createdAt).getTime();
      if (payment.status === 'pending' && age >= PROCESSING_MS) {
        const outcome = outcomeFor(payment.phone);
        if (outcome !== 'pending') {
          payment.status = outcome;
          payment.completedAt = now.toISOString();
          db.transactions.push({
            id: createId('txn'),
            type: 'payment',
            status: outcome,
            bookingId: payment.bookingId,
            bookingReference: payment.bookingReference,
            amount: payment.amount,
            phone: payment.phone,
            network: payment.network,
            description: payment.description,
            date: now.toISOString(),
          });
          if (outcome === 'success') {
            settleSuccessfulPayment(db, payment, now);
          }
        }
      }
      return payment;
    });
  }

  async refund(request: RefundRequest): Promise<Transaction> {
    await delay(MOCK_LATENCY_MS);
    if (!(request.amount > 0)) {
      throw new AppError('invalid_payment', 'The refund amount must be more than zero.');
    }
    return writeDatabase((db, now) => recordRefund(db, request, now));
  }

  listTransactions(customerPhone: string): Promise<Transaction[]> {
    const phone = normalizeGhanaPhone(customerPhone);
    if (!phone) {
      return Promise.reject(new AppError('invalid_phone', 'Enter a valid phone number.'));
    }
    return readDatabase((db) => {
      const bookingIds = new Set(
        db.bookings.filter((booking) => booking.phone === phone).map((booking) => booking.id),
      );
      return db.transactions
        .filter((transaction) => bookingIds.has(transaction.bookingId))
        .sort((a, b) => b.date.localeCompare(a.date));
    });
  }
}
