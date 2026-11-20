import { services } from '@/services';
import { Payment } from '@/types/payment';
import { useEffect, useRef } from 'react';

const POLL_MS = 2000;

// Checks a payment every few seconds and calls `onResult` once it succeeds or
// fails. A dropped connection is simply retried on the next check.
export function usePaymentResult(
  paymentId: string | null,
  onResult: (payment: Payment) => void | Promise<void>,
): void {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!paymentId) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const payment = await services.payments.getPayment(paymentId);
        if (cancelled) {
          return;
        }
        if (payment.status !== 'pending') {
          await onResultRef.current(payment);
          return;
        }
      } catch {
        // Retried below.
      }
      if (!cancelled) {
        timer = setTimeout(poll, POLL_MS);
      }
    };
    timer = setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentId]);
}
