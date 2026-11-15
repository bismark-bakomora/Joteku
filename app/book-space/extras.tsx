import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { ChoiceCard } from '@/components/ChoiceCard';
import { EmptyState } from '@/components/EmptyState';
import { EstimateCard } from '@/components/EstimateCard';
import { InfoBanner } from '@/components/InfoBanner';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { StepProgress } from '@/components/StepProgress';
import { BOOKING_STEPS, useBookingDraft } from '@/context/BookingDraftContext';
import { useAsync } from '@/hooks/useAsync';
import { formatGhs } from '@/lib/format';
import { services } from '@/services';
import { spacing } from '@/theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function BookingExtrasScreen() {
  const { draft, update } = useBookingDraft();
  const details = useAsync(() =>
    Promise.all([services.venue.getSpaces(), services.venue.getDecorations()]),
  );

  if (!draft.spaceId || !draft.date || !draft.startTime || !draft.endTime) {
    return (
      <ScreenContainer>
        <EmptyState
          actionLabel="Start your booking"
          message="Choose your space, date and time first."
          onAction={() => router.navigate('/book-space/details')}
          title="Your booking is not started"
        />
      </ScreenContainer>
    );
  }
  const { startTime, endTime } = draft;

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <StepProgress current={1} steps={BOOKING_STEPS} />

      <AsyncView
        empty={{ title: 'Extras unavailable', message: 'Please try again.' }}
        isEmpty={() => false}
        state={details}
      >
        {([spaces, decorations]) => {
          const space = spaces.find((candidate) => candidate.id === draft.spaceId);
          if (!space) {
            return null;
          }
          const decoration = decorations.find((candidate) => candidate.id === draft.decorationId) ?? null;
          return (
            <View style={styles.sections}>
              <View>
                <SectionHeader subtitle="Optional, paid with your booking." title="Decoration package" />
                <View style={styles.list}>
                  <ChoiceCard
                    onPress={() => update({ decorationId: null })}
                    selected={draft.decorationId === null}
                    subtitle="Use the space as it is, or bring your own decorator."
                    title="No decoration"
                    value={formatGhs(0)}
                  />
                  {decorations.map((candidate) => (
                    <ChoiceCard
                      key={candidate.id}
                      onPress={() => update({ decorationId: candidate.id })}
                      selected={draft.decorationId === candidate.id}
                      subtitle={candidate.description}
                      title={candidate.name}
                      value={formatGhs(candidate.price)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.list}>
                <SectionHeader subtitle="Optional." title="Custom catering" />
                <Input
                  label="Tell us the food and drinks you need"
                  multiline
                  onChangeText={(cateringDetails) => update({ cateringDetails })}
                  placeholder="For example: jollof buffet for 35 people with grilled chicken, and soft drinks"
                  style={styles.catering}
                  textAlignVertical="top"
                  value={draft.cateringDetails}
                />
                <InfoBanner
                  body="Catering is not in the price below. Joteku sends you a quote after you book, and you pay it in the app with Pay Balance."
                  icon="restaurant-outline"
                  title="Catering is quoted separately"
                />
              </View>

              <EstimateCard
                cateringRequested={draft.cateringDetails.trim().length > 0}
                decoration={decoration}
                endTime={endTime}
                space={space}
                startTime={startTime}
              />
            </View>
          );
        }}
      </AsyncView>

      <Button
        label="Continue to summary"
        onPress={() => router.push('/book-space/summary')}
        rightIcon="arrow-forward"
      />
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
  list: {
    gap: spacing.sm,
  },
  catering: {
    minHeight: 112,
    paddingTop: spacing.sm + 4,
  },
});
