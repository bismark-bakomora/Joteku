import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DetailRow } from '@/components/DetailRow';
import { MobileMoneyForm } from '@/components/MobileMoneyForm';
import { PaymentProblem } from '@/components/PaymentProblem';
import { PaymentWaiting } from '@/components/PaymentWaiting';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useCart } from '@/context/CartContext';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { usePaymentResult } from '@/hooks/usePaymentResult';
import { errorMessage } from '@/lib/errors';
import {
  formatCountdown,
  formatDateLong,
  formatGhs,
  formatTime12,
  formatTimeRange,
} from '@/lib/format';
import { formatPhoneLocal } from '@/lib/phone';
import { eventTypeLabel } from '@/lib/receipt';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { Booking } from '@/types/booking';
import { MobileMoneyNetwork } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Phase =
  | { kind: 'form' }
  | { kind: 'waiting'; paymentId: string; phone: string }
  | { kind: 'failed'; message: string }
  | { kind: 'expired' };

export default function PayScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { clear: clearCart } = useCart();
  const bookingState = useAsync(() => services.bookings.getBooking(bookingId), [bookingId]);
  const spacesState = useAsync(() => services.venue.getSpaces());
  const now = useNow(1000);

  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const doneRef = useRef(false);

  const booking = bookingState.data;
  const holdLeft = booking?.holdExpiresAt
    ? new Date(booking.holdExpiresAt).getTime() - now.getTime()
    : 0;

  const goToReceipt = useCallback(() => {
    doneRef.current = true;
    router.dismissAll();
    router.push({ pathname: '/receipt/[bookingId]', params: { bookingId } });
  }, [bookingId]);

  // A booking that is already paid goes straight to its receipt, and one whose
  // hold ran out before paying shows the expired state.
  useEffect(() => {
    if (!booking) {
      return;
    }
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      goToReceipt();
    } else if (booking.status === 'cancelled' && phaseRef.current.kind === 'form') {
      setPhase({ kind: 'expired' });
    }
  }, [booking, goToReceipt]);

  // The hold running out before the payment is approved releases the time.
  useEffect(() => {
    if (
      booking?.status === 'pending_payment' &&
      holdLeft <= 0 &&
      (phase.kind === 'form' || phase.kind === 'waiting')
    ) {
      services.bookings.releaseHold(bookingId).catch(() => undefined);
      setPhase({ kind: 'expired' });
    }
  }, [booking, holdLeft, phase.kind, bookingId]);

  // Leaving before paying lets the time go, so it does not block anyone for 10 minutes.
  useEffect(
    () => () => {
      if (!doneRef.current && phaseRef.current.kind === 'form') {
        services.bookings.releaseHold(bookingId).catch(() => undefined);
      }
    },
    [bookingId],
  );

  usePaymentResult(phase.kind === 'waiting' ? phase.paymentId : null, async (payment) => {
    if (payment.status === 'failed') {
      await services.bookings.releaseHold(bookingId);
      setPhase({ kind: 'failed', message: 'The payment was declined or cancelled on your phone.' });
      return;
    }
    const updated = await services.bookings.getBooking(bookingId);
    if (updated.status === 'confirmed') {
      // The pre-order now belongs to the paid reservation.
      if (updated.kind === 'table' && updated.preOrder.length > 0) {
        clearCart();
      }
      goToReceipt();
    } else {
      setPhase({
        kind: 'failed',
        message: `Your time was taken while the payment was processing, so ${formatGhs(payment.amount)} is being refunded to ${formatPhoneLocal(payment.phone)}.`,
      });
    }
  });

  const pay = async (current: Booking, phone: string, network: MobileMoneyNetwork) => {
    setError(null);
    setBusy(true);
    try {
      const payment = await services.payments.startPayment({
        bookingId: current.id,
        bookingReference: current.reference,
        purpose: current.kind === 'space' ? 'space_booking' : 'table_deposit',
        amount: current.amountDue,
        phone,
        network,
        description:
          current.kind === 'space' ? `${eventTypeLabel(current.eventType)} booking` : 'Table reservation deposit',
      });
      setPhase({ kind: 'waiting', paymentId: payment.id, phone });
    } catch (caught) {
      setError(errorMessage(caught, 'We could not start the payment. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const tryAgain = async () => {
    setError(null);
    setBusy(true);
    try {
      await services.bookings.restartHold(bookingId);
      bookingState.reload();
      setPhase({ kind: 'form' });
    } catch (caught) {
      setError(errorMessage(caught, 'We could not hold your time again. Please choose another time.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        <AsyncView
          empty={{ title: 'Booking not found', message: 'Please start your booking again.' }}
          isEmpty={() => false}
          state={bookingState}
        >
          {(current) => {
            const space =
              current.kind === 'space'
                ? spacesState.data?.find((candidate) => candidate.id === current.spaceId)
                : undefined;
            return (
              <View style={styles.sections}>
                {phase.kind === 'form' || phase.kind === 'waiting' ? (
                  <View style={styles.hold}>
                    <View style={styles.holdIcon}>
                      <Ionicons color={colors.onSecondary} name="timer-outline" size={20} />
                    </View>
                    <View style={styles.holdText}>
                      <Text style={styles.holdLabel}>Time held for you</Text>
                      <Text accessibilityLiveRegion="polite" style={styles.holdTime}>
                        {formatCountdown(holdLeft)} left
                      </Text>
                    </View>
                    <Text style={styles.reference}>{current.reference}</Text>
                  </View>
                ) : null}

                <Card>
                  <Text style={styles.cardTitle}>
                    {current.kind === 'space'
                      ? `${eventTypeLabel(current.eventType)}${space ? ` at ${space.name}` : ''}`
                      : 'Table reservation'}
                  </Text>
                  <DetailRow label="Date" value={formatDateLong(current.date)} />
                  {current.kind === 'space' ? (
                    <>
                      <DetailRow label="Time" value={formatTimeRange(current.startTime, current.endTime)} />
                      <DetailRow label="Guests" value={String(current.guestCount)} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Time" value={formatTime12(current.time)} />
                      <DetailRow label="People" value={String(current.partySize)} />
                      {current.preOrderTotal > 0 ? (
                        <>
                          <DetailRow label="Pre-order total" value={formatGhs(current.preOrderTotal)} />
                          <DetailRow label="Balance at the venue" value={formatGhs(current.balanceAtVenue)} />
                        </>
                      ) : null}
                    </>
                  )}
                  <View style={styles.total}>
                    <Text style={styles.totalLabel}>
                      {current.kind === 'table' ? 'Deposit to pay now' : 'To pay now'}
                    </Text>
                    <Text style={styles.totalAmount}>{formatGhs(current.amountDue)}</Text>
                  </View>
                </Card>

                {phase.kind === 'form' ? (
                  <MobileMoneyForm
                    amount={current.amountDue}
                    busy={busy}
                    error={error}
                    onPay={(phone, network) => pay(current, phone, network)}
                  />
                ) : null}

                {phase.kind === 'waiting' ? (
                  <PaymentWaiting
                    amount={current.amountDue}
                    note="Still waiting? Make sure your phone has signal. The time stays held until the timer runs out."
                    outcome="Your booking is confirmed as soon as the payment goes through."
                    phone={phase.phone}
                  />
                ) : null}

                {phase.kind === 'failed' || phase.kind === 'expired' ? (
                  <PaymentProblem
                    error={error}
                    icon={phase.kind === 'failed' ? 'close-circle' : 'time-outline'}
                    message={
                      phase.kind === 'failed'
                        ? phase.message
                        : 'The payment was not finished in time, so the time was released. You can try again if it is still free.'
                    }
                    title={phase.kind === 'failed' ? 'Payment not completed' : 'Your time hold ran out'}
                  >
                    <Button label="Try again" loading={busy} onPress={tryAgain} />
                    <Button label="Choose another time" onPress={() => router.back()} variant="secondary" />
                  </PaymentProblem>
                ) : null}
              </View>
            );
          }}
        </AsyncView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
  },
  sections: {
    gap: spacing.lg,
  },
  hold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  holdIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdText: {
    flex: 1,
  },
  holdLabel: {
    ...typography.labelSm,
    color: colors.onSecondarySoft,
    textTransform: 'uppercase',
  },
  holdTime: {
    ...typography.title,
    color: colors.onSecondaryTint,
  },
  reference: {
    ...typography.labelMd,
    color: colors.secondary,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm + 4,
  },
  totalLabel: {
    ...typography.titleMd,
    color: colors.text,
  },
  totalAmount: {
    ...typography.headline,
    color: colors.primary,
  },
});
