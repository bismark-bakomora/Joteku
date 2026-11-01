import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text } from 'react-native';

export default function BookSpaceScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Book a Space</Text>
      <Text style={styles.body}>Venue and hut booking will be added in a later stage.</Text>
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
