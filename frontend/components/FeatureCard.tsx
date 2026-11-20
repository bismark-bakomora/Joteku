import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Pill } from './Pill';

type FeatureCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
};

export function FeatureCard({
  icon,
  badge,
  title,
  description,
  ctaLabel,
  onPress,
}: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.decoration} />
      <View style={styles.top}>
        <View style={styles.iconTile}>
          <Ionicons color={colors.onPrimarySoft} name={icon} size={28} />
        </View>
        <Pill label={badge} tone="gold" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Button label={ctaLabel} onPress={onPress} rightIcon="arrow-forward" variant="gold" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  decoration: {
    position: 'absolute',
    right: -24,
    bottom: -24,
    width: 112,
    height: 112,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    opacity: 0.1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  iconTile: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.titleLg,
    color: colors.onPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.onPrimaryMuted,
  },
});
