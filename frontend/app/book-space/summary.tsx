import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { DetailRow } from '@/components/DetailRow';
import { EmptyState } from '@/components/EmptyState';
import { EstimateCard } from '@/components/EstimateCard';
import { InfoBanner } from '@/components/InfoBanner';
import { PolicyList } from '@/components/PolicyList';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StepProgress } from '@/components/StepProgress';
import { TextLink } from '@/components/TextLink';
import { BOOKING_STEPS, useBookingDraft } from '@/context/BookingDraftContext';
import { useSession } from '@/context/SessionContext';
import { useAsync } from '@/hooks/useAsync';
import { AppErrorCode, errorCode, errorMessage } from '@/lib/errors';
import { formatDateLong, formatGhs, formatTimeRange } from '@/lib/format';
import { cancellationPolicy } from '@/lib/policies';
import { estimateSpaceBooking } from '@/lib/pricing';
import { eventTypeLabel } from '@/lib/receipt';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BookingSummaryScreen() {
  const { draft } = useBookingDraft();
  const { session } = useSession();
  const details = useAsync(() =>
    Promise.all([
      services.venue.getSpaces(),
      services.venue.getDecorations(),
      services.venue.getSettings(),
    ]),
  );
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<AppErrorCode | null>(null);

  const { eventType, spaceId, date, startTime, endTime } = draft;
  if (!eventType || !spaceId || !date || !startTime || !endTime || !session) {
    return (
      <ScreenContainer>
        <EmptyState
          actionLabel="Start your booking"
          message="Choose your event, space, date and time first."
          onAction={() => router.navigate('/book-space/details')}
          title="Your booking is not started"
        />
      </ScreenContainer>
    );
  }

  const continueToPayment = async () => {
    setError(null);
    setFailure(null);
    setSubmitting(true);
    try {
      const booking = await services.bookings.createSpaceBooking({
        phone: session.phone,
        eventType,
        spaceId,
        date,
        startTime,
        endTime,
        guestCount: draft.guestCount,
        notes: draft.notes,
        decorationId: draft.decorationId,
        cateringDetails: draft.cateringDetails,
      });
      router.push({ pathname: '/pay/[bookingId]', params: { bookingId: booking.id } });
    } catch (caught) {
      setError(errorMessage(caught, 'We could not hold your booking. Please try again.'));
      setFailure(errorCode(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <StepProgress current={2} steps={BOOKING_STEPS} />

      <AsyncView
        empty={{ title: 'Summary unavailable', message: 'Please try again.' }}
        isEmpty={() => false}
        state={details}
      >
        {([spaces, decorations, settings]) => {
          const space = spaces.find((candidate) => candidate.id === spaceId);
          if (!space) {
            return null;
          }
          const decoration = decorations.find((candidate) => candidate.id === draft.decorationId) ?? null;
          const total = estimateSpaceBooking(space, startTime, endTime, decoration).total;
          return (
            <View style={styles.sections}>
              <Card>
                <Text accessibilityRole="header" style={styles.cardTitle}>
                  Your booking
                </Text>
                <DetailRow label="Event" value={eventTypeLabel(eventType)} />
                <DetailRow label="Space" value={space.name} />
                <DetailRow label="Date" value={formatDateLong(date)} />
                <DetailRow label="Time" value={formatTimeRange(startTime, endTime)} />
                <DetailRow label="Guests" value={String(draft.guestCount)} />
                <DetailRow label="Decoration" value={decoration ? decoration.name : 'None'} />
                <DetailRow
                  label="Catering"
                  value={draft.cateringDetails.trim() ? 'Requested, quoted later' : 'None'}
                />
                {draft.notes.trim() ? <DetailRow label="Notes" value={draft.notes.trim()} /> : null}
                <TextLink label="Change details" onPress={() => router.navigate('/book-space/details')} />
              </Card>

              <EstimateCard
                cateringRequested={draft.cateringDetails.trim().length > 0}
                decoration={decoration}
                endTime={endTime}
                space={space}
                startTime={startTime}
              />

              <Card style={styles.policy}>
                <PolicyList section={cancellationPolicy(settings)} />
                <TextLink label="Read all terms" onPress={() => router.push('/terms')} />
                <Checkbox
                  checked={accepted}
                  label="I accept the cancellation and refund policy"
                  onChange={setAccepted}
                />
              </Card>

              <InfoBanner
                body={`When you continue, your time is held for ${settings.holdMinutes} minutes while you pay by mobile money.`}
                icon="timer-outline"
                title="Your time is held while you pay"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {error}
                  </Text>
                  {failure === 'slot_unavailable' ? (
                    <Button
                      label="Choose another time"
                      onPress={() => router.navigate('/book-space/details')}
                      variant="secondary"
                    />
                  ) : null}
                </View>
              ) : null}

              <Button
                disabled={!accepted}
                label={`Continue to payment · ${formatGhs(total)}`}
                leftIcon="wallet-outline"
                loading={submitting}
                onPress={continueToPayment}
                variant="gold"
              />
              {!accepted ? (
                <Text style={styles.hint}>Tick the box to accept the policy before you pay.</Text>
              ) : null}
            </View>
          );
        }}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  sections: {
    gap: spacing.lg,
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  policy: {
    gap: spacing.sm,
  },
  errorBox: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
