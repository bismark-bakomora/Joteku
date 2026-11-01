import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text } from 'react-native';

export default function BookingsScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.body}>Your bookings and reservations will appear here in a later stage.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.headline,
    color: colors.text,
    marginTop: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
