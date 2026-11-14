import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PolicyList } from '@/components/PolicyList';
import { PriceRow } from '@/components/PriceRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { StepList } from '@/components/StepList';
import { bookingSteps, tableSteps } from '@/data/howToBook';
import { useAsync } from '@/hooks/useAsync';
import { formatGhs } from '@/lib/format';
import { paymentTerms, tableReservationPolicy } from '@/lib/policies';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HowToBookScreen() {
  const details = useAsync(() =>
    Promise.all([
      services.venue.getSpaces(),
      services.venue.getDecorations(),
      services.venue.getSettings(),
    ]),
  );

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <Text style={styles.intro}>
        Booking a space takes a few minutes and is done all in the app. Here is how it works.
      </Text>

      <View>
        <SectionHeader title="Booking an event or meeting" />
        <StepList steps={bookingSteps} />
      </View>

      <AsyncView
        empty={{ title: 'Prices unavailable', message: 'Please check back soon.' }}
        isEmpty={() => false}
        state={details}
      >
        {([spaces, decorations, settings]) => (
          <View style={styles.sections}>
            <View>
              <SectionHeader
                subtitle="Venue hire per hour. Custom catering is quoted separately."
                title="Space prices"
              />
              <Card style={styles.priceCard}>
                {spaces.map((space, index) => (
                  <PriceRow
                    amount={`${formatGhs(space.hourlyRate)} / hr`}
                    detail={`${space.capacityLabel} · minimum ${space.minHours} hours`}
                    key={space.id}
                    label={space.name}
                    last={index === spaces.length - 1}
                  />
                ))}
              </Card>
            </View>

            <View>
              <SectionHeader subtitle="Optional, paid with your booking." title="Decoration packages" />
              <Card style={styles.priceCard}>
                {decorations.map((decoration, index) => (
                  <PriceRow
                    amount={formatGhs(decoration.price)}
                    detail={decoration.description}
                    key={decoration.id}
                    label={decoration.name}
                    last={index === decorations.length - 1}
                  />
                ))}
              </Card>
            </View>

            <Card>
              <PolicyList section={paymentTerms(settings)} />
            </Card>

            <View>
              <SectionHeader title="Reserving a table" />
              <StepList steps={tableSteps} />
            </View>

            <Card>
              <PolicyList section={tableReservationPolicy(settings)} />
            </Card>
          </View>
        )}
      </AsyncView>

      <View style={styles.actions}>
        <Button label="Book a Space" onPress={() => router.push('/book-space')} rightIcon="arrow-forward" />
        <Button
          label="Cancellation and refund terms"
          onPress={() => router.push('/terms')}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    color: colors.textSubtle,
  },
  sections: {
    gap: spacing.lg,
  },
  priceCard: {
    paddingVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
});
