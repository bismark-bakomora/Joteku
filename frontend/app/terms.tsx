import { AsyncView } from '@/components/AsyncView';
import { Card } from '@/components/Card';
import { InfoBanner } from '@/components/InfoBanner';
import { PolicyList } from '@/components/PolicyList';
import { ScreenContainer } from '@/components/ScreenContainer';
import { contact } from '@/data/contact';
import { useAsync } from '@/hooks/useAsync';
import { cancellationPolicy, paymentTerms, tableReservationPolicy } from '@/lib/policies';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function TermsScreen() {
  const settings = useAsync(() => services.venue.getSettings());

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <Text style={styles.intro}>
        These terms apply to event bookings, table reservations and pre-orders made in the Joteku app.
      </Text>

      <AsyncView
        empty={{ title: 'Terms unavailable', message: 'Please check back soon.' }}
        isEmpty={() => false}
        state={settings}
      >
        {(value) =>
          [cancellationPolicy(value), tableReservationPolicy(value), paymentTerms(value)].map(
            (section) => (
              <Card key={section.title}>
                <PolicyList section={section} />
              </Card>
            ),
          )
        }
      </AsyncView>

      <InfoBanner
        actionLabel="Contact us"
        body={`Call or WhatsApp us on ${contact.phoneDisplay}.`}
        icon="help-circle-outline"
        onAction={() => router.push('/contact')}
        title="Questions about a booking?"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  intro: {
    ...typography.body,
    color: colors.textSubtle,
  },
});
