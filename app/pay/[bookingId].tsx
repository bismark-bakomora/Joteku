import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChoiceCard } from '@/components/ChoiceCard';
import { DetailRow } from '@/components/DetailRow';
import { InfoBanner } from '@/components/InfoBanner';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { StepList } from '@/components/StepList';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/context/SessionContext';
import { contact } from '@/data/contact';
import { mobileMoneyNetworks } from '@/data/networks';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { errorMessage } from '@/lib/errors';
import {
  formatCountdown,
  formatDateLong,
  formatGhs,
  formatTime12,
  formatTimeRange,
} from '@/lib/format';
import { formatPhoneLocal, normalizeGhanaPhone, suggestNetwork } from '@/lib/phone';
import { eventTypeLabel } from '@/lib/receipt';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { Booking } from '@/types/booking';
import { MobileMoneyNetwork } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

const POLL_MS = 2000;

type Phase =
  | { kind: 'form' }
  | { kind: 'waiting'; paymentId: string }
  | { kind: 'failed'; message: string }
  | { kind: 'expired' };

export default function PayScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { session } = useSession();
  const { clear: clearCart } = useCart();
  const bookingState = useAsync(() => services.bookings.getBooking(bookingId), [bookingId]);
  const spacesState = useAsync(() => services.venue.getSpaces());
  const now = useNow(1000);

  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [phone, setPhone] = useState(session ? formatPhoneLocal(session.phone) : '');
  const [network, setNetwork] = useState<MobileMoneyNetwork | null>(
    session ? suggestNetwork(session.phone) : null,
  );
  const [networkChosen, setNetworkChosen] = useState(false);
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

  // Checks the payment every few seconds until it succeeds, fails or the hold runs out.
  useEffect(() => {
    if (phase.kind !== 'waiting') {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const payment = await services.payments.getPayment(phase.paymentId);
        if (cancelled) {
          return;
        }
        if (payment.status === 'success') {
          const updated = await services.bookings.getBooking(bookingId);
          if (cancelled) {
            return;
          }
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
          return;
        }
        if (payment.status === 'failed') {
          await services.bookings.releaseHold(bookingId);
          if (!cancelled) {
            setPhase({ kind: 'failed', message: 'The payment was declined or cancelled on your phone.' });
          }
          return;
        }
      } catch {
        // A dropped connection is retried on the next check.
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
  }, [phase, bookingId, goToReceipt, clearCart]);

  const changePhone = (text: string) => {
    setPhone(text);
    const normalized = normalizeGhanaPhone(text);
    if (normalized && !networkChosen) {
      setNetwork(suggestNetwork(normalized));
    }
  };

  const pay = async (current: Booking) => {
    setError(null);
    const normalized = normalizeGhanaPhone(phone);
    if (!normalized) {
      setError('Enter the mobile money number, like 024 123 4567.');
      return;
    }
    if (!network) {
      setError('Choose your mobile money network.');
      return;
    }
    setBusy(true);
    try {
      const payment = await services.payments.startPayment({
        bookingId: current.id,
        bookingReference: current.reference,
        purpose: current.kind === 'space' ? 'space_booking' : 'table_deposit',
        amount: current.amountDue,
        phone: normalized,
        network,
        description: current.kind === 'space' ? `${eventTypeLabel(current.eventType)} booking` : 'Table reservation deposit',
      });
      setPhase({ kind: 'waiting', paymentId: payment.id });
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
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
                  <>
                    <View>
                      <SectionHeader title="Your mobile money network" />
                      <View style={styles.list}>
                        {mobileMoneyNetworks.map((option) => (
                          <ChoiceCard
                            key={option.id}
                            leading={
                              <View style={styles.networkBadge}>
                                <Text style={styles.networkLetter}>{option.name.charAt(0)}</Text>
                              </View>
                            }
                            onPress={() => {
                              setNetwork(option.id);
                              setNetworkChosen(true);
                            }}
                            selected={network === option.id}
                            title={`${option.name} Mobile Money`}
                          />
                        ))}
                      </View>
                    </View>
                    <Input
                      autoComplete="tel"
                      keyboardType="phone-pad"
                      label="Mobile money number"
                      onChangeText={changePhone}
                      placeholder="024 123 4567"
                      textContentType="telephoneNumber"
                      value={phone}
                    />
                    {services.payments.testHint ? (
                      <InfoBanner body={services.payments.testHint} icon="construct-outline" title="Test mode" />
                    ) : null}
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Button
                      label={`Pay ${formatGhs(current.amountDue)}`}
                      leftIcon="lock-closed-outline"
                      loading={busy}
                      onPress={() => pay(current)}
                      variant="gold"
                    />
                  </>
                ) : null}

                {phase.kind === 'waiting' ? (
                  <Card style={styles.waiting}>
                    <View style={styles.waitingHeader}>
                      <ActivityIndicator color={colors.primary} size="large" />
                      <Text style={styles.waitingTitle}>Approve the payment on your phone</Text>
                    </View>
                    <StepList
                      steps={[
                        { title: 'Check your phone', body: `A payment prompt has been sent to ${phone}.` },
                        {
                          title: 'Enter your mobile money PIN',
                          body: `Approve ${formatGhs(current.amountDue)} to ${contact.venueName}.`,
                        },
                        {
                          title: 'Wait here',
                          body: 'Your booking is confirmed as soon as the payment goes through.',
                        },
                      ]}
                    />
                    <Text style={styles.waitingNote}>
                      Still waiting? Make sure your phone has signal. The time stays held until the timer runs out.
                    </Text>
                  </Card>
                ) : null}

                {phase.kind === 'failed' || phase.kind === 'expired' ? (
                  <Card style={styles.problem}>
                    <Ionicons
                      color={colors.error}
                      name={phase.kind === 'failed' ? 'close-circle' : 'time-outline'}
                      size={48}
                    />
                    <Text style={styles.problemTitle}>
                      {phase.kind === 'failed' ? 'Payment not completed' : 'Your time hold ran out'}
                    </Text>
                    <Text style={styles.problemBody}>
                      {phase.kind === 'failed'
                        ? phase.message
                        : 'The payment was not finished in time, so the time was released. You can try again if it is still free.'}
                    </Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Button label="Try again" loading={busy} onPress={tryAgain} style={styles.problemButton} />
                    <Button
                      label="Choose another time"
                      onPress={() => router.back()}
                      style={styles.problemButton}
                      variant="secondary"
                    />
                  </Card>
                ) : null}
              </View>
            );
          }}
        </AsyncView>
      </ScreenContainer>
    </KeyboardAvoidingView>
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
  list: {
    gap: spacing.sm,
  },
  networkBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkLetter: {
    ...typography.title,
    color: colors.primary,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  waiting: {
    gap: spacing.md,
  },
  waitingHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  waitingTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  waitingNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  problem: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  problemTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  problemButton: {
    alignSelf: 'stretch',
  },
  problemBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
