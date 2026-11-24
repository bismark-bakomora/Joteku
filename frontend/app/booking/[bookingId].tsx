import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InfoBanner } from '@/components/InfoBanner';
import { Pill } from '@/components/Pill';
import { ReceiptCard } from '@/components/ReceiptCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextLink } from '@/components/TextLink';
import { Toast } from '@/components/Toast';
import { useNotifications } from '@/context/NotificationsContext';
import { useSession } from '@/context/SessionContext';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { bookingStart } from '@/lib/availability';
import { AppError, errorMessage } from '@/lib/errors';
import { formatGhs, formatStamp } from '@/lib/format';
import { spaceBookingReceipt, tableReservationReceipt } from '@/lib/receipt';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { Booking } from '@/types/booking';
import { PricingSettings } from '@/types/pricing';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function cancellationMessage(booking: Booking, refund: number, settings: PricingSettings): string {
  if (booking.status === 'pending_payment') {
    return 'Nothing has been paid yet, so there is nothing to refund.';
  }
  if (refund > 0) {
    return `You will get ${formatGhs(refund)} back to the same mobile money number within ${settings.refundWorkingDays} working days.`;
  }
  if (booking.kind === 'table') {
    return `There is no refund within ${settings.tableFullRefundHours} hours of the reservation.`;
  }
  return booking.dateChangeUsed
    ? 'Under the cancellation policy there is no refund this close to the event.'
    : 'Under the cancellation policy there is no refund this close to the event. You can change the date once instead, if a time is free.';
}

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { session } = useSession();
  const { refresh } = useNotifications();
  const { toast, show } = useToast();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useAsync(async () => {
    const booking = await services.bookings.getBooking(bookingId);
    // Bookings are found by phone number, so only the owner may open one.
    if (!session || booking.phone !== session.phone) {
      throw new AppError('not_found', 'We could not find that booking.');
    }
    const [spaces, decorations, settings, quote, payment] = await Promise.all([
      services.venue.getSpaces(),
      services.venue.getDecorations(),
      services.venue.getSettings(),
      services.bookings.getCancellationQuote(bookingId),
      booking.paymentId ? services.payments.getPayment(booking.paymentId) : Promise.resolve(null),
    ]);
    let receipt;
    if (booking.kind === 'space') {
      const space = spaces.find((candidate) => candidate.id === booking.spaceId);
      if (!space) {
        throw new Error('Space not found');
      }
      const decoration = decorations.find((candidate) => candidate.id === booking.decorationId) ?? null;
      receipt = spaceBookingReceipt(booking, space, decoration, payment);
    } else {
      receipt = tableReservationReceipt(booking, payment);
    }
    return { booking, receipt, settings, quote };
  }, [bookingId, session?.phone]);
  const { reload } = data;

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const cancel = async () => {
    setError(null);
    setCancelling(true);
    try {
      const result = await services.bookings.cancelBooking(bookingId);
      setConfirmingCancel(false);
      show(
        result.refundAmount > 0
          ? `Cancelled. ${formatGhs(result.refundAmount)} is on its way back to you.`
          : 'Cancelled.',
      );
      refresh();
      reload();
    } catch (caught) {
      setError(errorMessage(caught, 'We could not cancel this booking. Please try again.'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        <AsyncView
          empty={{ title: 'Booking not found', message: 'Find your bookings in My Bookings.' }}
          isEmpty={() => false}
          state={data}
        >
          {({ booking, receipt, settings, quote }) => {
            const catering = booking.kind === 'space' ? booking.catering : undefined;
            const isFuture = bookingStart(booking).getTime() > Date.now();
            const canChangeDate =
              booking.kind === 'space' && booking.status === 'confirmed' && isFuture && !booking.dateChangeUsed;
            const isTable = booking.kind === 'table';

            return (
              <View style={styles.sections}>
                {booking.status === 'pending_payment' ? (
                  <InfoBanner
                    actionLabel="Pay now"
                    body={`Pay ${formatGhs(booking.amountDue)} by mobile money to confirm this ${isTable ? 'reservation' : 'booking'}.`}
                    icon="wallet-outline"
                    onAction={() =>
                      router.push({ pathname: '/pay/[bookingId]', params: { bookingId: booking.id } })
                    }
                    title="Waiting for payment"
                  />
                ) : null}

                {booking.status === 'cancelled' && booking.refundedAmount > 0 ? (
                  <InfoBanner
                    body={`${formatGhs(booking.refundedAmount)} was sent back to your mobile money${booking.cancelledAt ? ` on ${formatStamp(booking.cancelledAt)}` : ''}. It can take up to ${settings.refundWorkingDays} working days to arrive.`}
                    icon="return-down-back-outline"
                    title="Refund sent"
                  />
                ) : null}

                <ReceiptCard receipt={receipt} status={booking.status} />

                {catering ? (
                  <Card style={styles.catering}>
                    <View style={styles.cateringHeader}>
                      <Text style={styles.cardTitle}>Custom catering</Text>
                      <Pill
                        label={
                          catering.status === 'paid'
                            ? 'Paid'
                            : catering.status === 'quoted'
                              ? 'Quote ready'
                              : 'Waiting for quote'
                        }
                        tone={catering.status === 'quoted' ? 'gold' : 'neutral'}
                      />
                    </View>
                    <Text style={styles.request}>{catering.details}</Text>
                    {catering.status === 'requested' && booking.status === 'confirmed' ? (
                      <Text style={styles.cateringNote}>
                        Joteku will send you a quote. You will get a notification when it is ready.
                      </Text>
                    ) : null}
                    {catering.status === 'quoted' && catering.quoteAmount && booking.status === 'confirmed' ? (
                      <>
                        <Text style={styles.quoteAmount}>{formatGhs(catering.quoteAmount)}</Text>
                        <Button
                          label="Pay Balance"
                          leftIcon="wallet-outline"
                          onPress={() =>
                            router.push({ pathname: '/pay-balance/[bookingId]', params: { bookingId: booking.id } })
                          }
                          variant="gold"
                        />
                      </>
                    ) : null}
                  </Card>
                ) : null}

                <View style={styles.actions}>
                  {booking.amountPaid > 0 ? (
                    <Button
                      label="Receipt, calendar and sharing"
                      leftIcon="receipt-outline"
                      onPress={() =>
                        router.push({ pathname: '/receipt/[bookingId]', params: { bookingId: booking.id } })
                      }
                      variant="neutral"
                    />
                  ) : null}
                  {canChangeDate ? (
                    <Button
                      label="Change date"
                      leftIcon="calendar-outline"
                      onPress={() =>
                        router.push({ pathname: '/change-date/[bookingId]', params: { bookingId: booking.id } })
                      }
                      variant="secondary"
                    />
                  ) : null}
                  {booking.kind === 'space' && booking.dateChangeUsed && booking.status === 'confirmed' ? (
                    <Text style={styles.note}>This booking has used its one date change.</Text>
                  ) : null}
                </View>

                {quote.cancellable ? (
                  confirmingCancel ? (
                    <View style={styles.confirm}>
                      <Text style={styles.confirmTitle}>
                        Cancel this {isTable ? 'reservation' : 'booking'}?
                      </Text>
                      <Text style={styles.confirmBody}>
                        {cancellationMessage(booking, quote.refundAmount, settings)}
                      </Text>
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <View style={styles.confirmButtons}>
                        <Button
                          label="Keep it"
                          onPress={() => setConfirmingCancel(false)}
                          style={styles.confirmButton}
                          variant="neutral"
                        />
                        <Button
                          label="Yes, cancel"
                          loading={cancelling}
                          onPress={cancel}
                          style={styles.confirmButton}
                          variant="secondary"
                        />
                      </View>
                    </View>
                  ) : (
                    <Button
                      label={isTable ? 'Cancel reservation' : 'Cancel booking'}
                      leftIcon="close-circle-outline"
                      onPress={() => setConfirmingCancel(true)}
                      variant="secondary"
                    />
                  )
                ) : null}

                <TextLink label="Cancellation and refund terms" onPress={() => router.push('/terms')} />
              </View>
            );
          }}
        </AsyncView>
      </ScreenContainer>
      <Toast toast={toast} />
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
    gap: spacing.md,
  },
  catering: {
    gap: spacing.sm,
  },
  cateringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.primary,
  },
  request: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
  },
  cateringNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
  quoteAmount: {
    ...typography.amount,
    color: colors.primary,
  },
  actions: {
    gap: spacing.sm,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  confirm: {
    backgroundColor: colors.cancelledBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  confirmBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});
