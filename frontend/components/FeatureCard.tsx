import { makeStyles, radii, shadows, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
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
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.decoration} />
      <View style={styles.top}>
        <View style={styles.iconTile}>
          <Ionicons color={colors.onBrandTile} name={icon} size={28} />
        </View>
        <Pill label={badge} tone="gold" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Button label={ctaLabel} onPress={onPress} rightIcon="arrow-forward" variant="gold" />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.brand,
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
    backgroundColor: colors.brandTile,
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
    backgroundColor: colors.brandTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.titleLg,
    color: colors.onBrand,
  },
  description: {
    ...typography.caption,
    color: colors.onBrandMuted,
  },
}));
