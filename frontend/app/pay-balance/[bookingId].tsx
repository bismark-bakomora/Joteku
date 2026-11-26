import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DetailRow } from '@/components/DetailRow';
import { EmptyState } from '@/components/EmptyState';
import { MobileMoneyForm } from '@/components/MobileMoneyForm';
import { PaymentProblem } from '@/components/PaymentProblem';
import { PaymentWaiting } from '@/components/PaymentWaiting';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useNotifications } from '@/context/NotificationsContext';
import { useAsync } from '@/hooks/useAsync';
import { usePaymentResult } from '@/hooks/usePaymentResult';
import { errorMessage } from '@/lib/errors';
import { formatDateLong, formatGhs } from '@/lib/format';
import { formatPhoneLocal } from '@/lib/phone';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { MobileMoneyNetwork } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Phase =
  | { kind: 'form' }
  | { kind: 'waiting'; paymentId: string; phone: string }
  | { kind: 'failed'; message: string }
  | { kind: 'paid' };

// Pay Balance: pays the custom catering quote on a booking that is already confirmed.
export default function PayBalanceScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { refresh } = useNotifications();
  const bookingState = useAsync(() => services.bookings.getBooking(bookingId), [bookingId]);
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  usePaymentResult(phase.kind === 'waiting' ? phase.paymentId : null, async (payment) => {
    if (payment.status === 'failed') {
      setPhase({ kind: 'failed', message: 'The payment was declined or cancelled on your phone.' });
      return;
    }
    const updated = await services.bookings.getBooking(bookingId);
    refresh();
    if (updated.kind === 'space' && updated.catering?.status === 'paid') {
      setPhase({ kind: 'paid' });
    } else {
      setPhase({
        kind: 'failed',
        message: `The payment could not be matched to your quote, so ${formatGhs(payment.amount)} is being refunded to ${formatPhoneLocal(payment.phone)}.`,
      });
    }
  });

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        <AsyncView
          empty={{ title: 'Booking not found', message: 'Find your booking in My Bookings.' }}
          isEmpty={() => false}
          state={bookingState}
        >
          {(booking) => {
            const catering = booking.kind === 'space' ? booking.catering : undefined;
            if (phase.kind === 'paid' || catering?.status === 'paid') {
              return (
                <Card style={styles.paid}>
                  <View style={styles.paidIcon}>
                    <Ionicons color={colors.onPrimarySoft} name="checkmark-circle" size={36} />
                  </View>
                  <Text style={styles.paidTitle}>Catering paid</Text>
                  <Text style={styles.paidBody}>
                    Thank you. Your catering for {booking.reference} is paid in full.
                  </Text>
                  <Button label="Back to booking" onPress={() => router.back()} style={styles.stretch} />
                </Card>
              );
            }
            if (booking.status !== 'confirmed' || catering?.status !== 'quoted' || !catering.quoteAmount) {
              return (
                <EmptyState
                  actionLabel="Back to booking"
                  message="There is no catering quote waiting to be paid on this booking."
                  onAction={() => router.back()}
                  title="Nothing to pay"
                />
              );
            }
            const amount = catering.quoteAmount;

            const pay = async (phone: string, network: MobileMoneyNetwork) => {
              setError(null);
              setBusy(true);
              try {
                const payment = await services.payments.startPayment({
                  bookingId: booking.id,
                  purpose: 'catering_balance',
                  phone,
                  network,
                });
                setPhase({ kind: 'waiting', paymentId: payment.id, phone });
              } catch (caught) {
                setError(errorMessage(caught, 'We could not start the payment. Please try again.'));
              } finally {
                setBusy(false);
              }
            };

            return (
              <View style={styles.sections}>
                <Card>
                  <Text style={styles.cardTitle}>Custom catering</Text>
                  <DetailRow label="Booking" value={booking.reference} />
                  <DetailRow label="Event date" value={formatDateLong(booking.date)} />
                  <Text style={styles.request}>{catering.details}</Text>
                  <View style={styles.total}>
                    <Text style={styles.totalLabel}>Catering quote</Text>
                    <Text style={styles.totalAmount}>{formatGhs(amount)}</Text>
                  </View>
                </Card>

                {phase.kind === 'form' ? (
                  <MobileMoneyForm amount={amount} busy={busy} error={error} onPay={pay} />
                ) : null}

                {phase.kind === 'waiting' ? (
                  <PaymentWaiting
                    amount={amount}
                    note="Still waiting? Make sure your phone has signal."
                    outcome="Your catering is marked as paid as soon as the payment goes through."
                    phone={phase.phone}
                  />
                ) : null}

                {phase.kind === 'failed' ? (
                  <PaymentProblem icon="close-circle" message={phase.message} title="Payment not completed">
                    <Button label="Try again" onPress={() => setPhase({ kind: 'form' })} />
                    <Button label="Back to booking" onPress={() => router.back()} variant="secondary" />
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
  cardTitle: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  request: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm + 4,
  },
  totalLabel: {
    ...typography.titleMd,
    color: colors.text,
  },
  totalAmount: {
    ...typography.amount,
    color: colors.primary,
  },
  paid: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  paidIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidTitle: {
    ...typography.title,
    color: colors.text,
  },
  paidBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});
