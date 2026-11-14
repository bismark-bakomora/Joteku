import { formatGhs } from '@/lib/format';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Space } from '@/types/space';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Pill } from './Pill';
import { spaceImages } from './spaceImages';

type SpaceCardProps = {
  space: Space;
  onBook: () => void;
};

export function SpaceCard({ space, onBook }: SpaceCardProps) {
  const wholeVenue = space.id === 'whole-venue';

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <Image
          accessibilityLabel={`${space.name} at Joteku`}
          resizeMode="cover"
          source={spaceImages[space.id]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badge}>
          <Pill icon="people-outline" label={space.capacityLabel} tone="light" />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{space.name}</Text>
        <Text numberOfLines={2} style={styles.description}>
          {space.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>
              {formatGhs(space.hourlyRate)}
              <Text style={styles.perHour}> / hr</Text>
            </Text>
          </View>
          <Button
            label={wholeVenue ? 'Book Venue' : 'Book Hut'}
            onPress={onBook}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 272,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  photo: {
    height: 144,
    backgroundColor: colors.surfaceHigh,
  },
  badge: {
    padding: spacing.sm,
  },
  body: {
    padding: spacing.sm + 4,
    gap: spacing.xs,
  },
  name: {
    ...typography.titleMd,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSubtle,
    minHeight: 36,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  priceBlock: {
    flex: 1,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  price: {
    ...typography.titleMd,
    color: colors.secondary,
  },
  perHour: {
    ...typography.caption,
    color: colors.textMuted,
  },
  button: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
  },
});
