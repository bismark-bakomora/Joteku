import { normalizeGhanaPhone } from '@/lib/phone';
import { AppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { Payment, PaymentRequest, Transaction } from '@/types/payment';
import { PaymentService } from '../types';
import { PAYMENT_COLUMNS, PaymentRow, toPayment, toTransaction, unwrap } from './rows';

// Mobile money payments. The server works out the amount and, until a real
// aggregator is connected, runs a mock provider that decides the outcome from
// the paying number. A successful payment confirms its booking on the server.
export class SupabasePaymentService implements PaymentService {
  readonly testHint =
    'Numbers ending in 9999 fail and numbers ending in 8888 stay pending. Any other number is approved after a few seconds.';

  async startPayment(request: PaymentRequest): Promise<Payment> {
    const phone = normalizeGhanaPhone(request.phone);
    if (!phone) {
      throw new AppError('invalid_phone', 'Enter a valid mobile money number.');
    }
    const row = unwrap(
      await supabase
        .rpc('start_payment', {
          p_booking_id: request.bookingId,
          p_purpose: request.purpose,
          p_phone: phone,
          p_network: request.network,
        })
        .select(PAYMENT_COLUMNS)
        .single<PaymentRow>(),
    );
    return toPayment(row);
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const row = unwrap(
      await supabase
        .rpc('get_payment', { p_payment_id: paymentId })
        .select(PAYMENT_COLUMNS)
        .single<PaymentRow>(),
    );
    return toPayment(row);
  }

  // Finished payments and every refund, newest first. A payment still waiting
  // for approval on the customer's phone is not history yet.
  async listTransactions(): Promise<Transaction[]> {
    const rows = unwrap(
      await supabase
        .from('payments')
        .select(PAYMENT_COLUMNS)
        .neq('status', 'pending')
        .returns<PaymentRow[]>(),
    );
    return rows.map(toTransaction).sort((a, b) => b.date.localeCompare(a.date));
  }
}
