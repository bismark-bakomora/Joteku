import { formatGhs } from '@/lib/format';
import { makeStyles, radii, shadows, spacing, typography, useTheme } from '@/theme';
import { Space } from '@/types/space';
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { Button } from './Button';
import { Pill } from './Pill';
import { fillImageStyle, spaceImages } from './spaceImages';

type SpaceListCardProps = {
  space: Space;
  onBook: () => void;
};

export function SpaceListCard({ space, onBook }: SpaceListCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const wholeVenue = space.category === 'whole';

  return (
    <View style={styles.card}>
      {wholeVenue ? (
        <View style={styles.ribbon}>
          <Ionicons color={colors.onGold} name="ribbon" size={18} />
          <Text style={styles.ribbonText}>Best for weddings and large events</Text>
        </View>
      ) : null}
      <View style={[styles.photo, wholeVenue ? styles.photoLarge : undefined]}>
        <Image
          accessibilityLabel={`${space.name} at Joteku`}
          resizeMode="cover"
          source={spaceImages[space.id]}
          style={fillImageStyle}
        />
        <View style={styles.capacity}>
          <Pill icon="people-outline" label={space.capacityLabel} tone="light" />
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeAmount}>
            {formatGhs(space.hourlyRate)}
            <Text style={styles.priceBadgeUnit}> / hr</Text>
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <View>
          <Text style={styles.name}>{space.name}</Text>
          <Text style={styles.description}>{space.description}</Text>
        </View>
        <View style={styles.minimum}>
          <View style={styles.minimumLabel}>
            <Ionicons color={colors.pendingText} name="information-circle-outline" size={16} />
            <Text style={styles.minimumText}>Minimum {space.minHours} hours</Text>
          </View>
          <Text style={styles.minimumAmount}>
            From {formatGhs(space.hourlyRate * space.minHours)}
          </Text>
        </View>
        <Button
          label={`Book ${space.name}`}
          onPress={onBook}
          rightIcon="arrow-forward"
          variant={wholeVenue ? 'gold' : 'primary'}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ribbonText: {
    ...typography.labelMd,
    color: colors.onGold,
  },
  photo: {
    height: 176,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  photoLarge: {
    height: 208,
  },
  capacity: {
    position: 'absolute',
    top: spacing.sm + 4,
    left: spacing.sm + 4,
  },
  priceBadge: {
    position: 'absolute',
    right: spacing.sm + 4,
    bottom: spacing.sm + 4,
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  priceBadgeAmount: {
    ...typography.titleLg,
    color: colors.goldSoft,
  },
  priceBadgeUnit: {
    ...typography.caption,
    color: colors.surfaceHighest,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  name: {
    ...typography.title,
    color: colors.primary,
  },
  description: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: 2,
  },
  minimum: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  minimumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  minimumText: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  minimumAmount: {
    ...typography.titleSm,
    color: colors.text,
  },
}));
