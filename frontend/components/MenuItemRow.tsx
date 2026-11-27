import { formatGhs } from '@/lib/format';
import { makeStyles, radii, shadows, spacing, typography } from '@/theme';
import { MenuItem } from '@/types/menu';
import { Text, View } from 'react-native';
import { Button } from './Button';
import { PhotoPlaceholder } from './PhotoPlaceholder';

type MenuItemRowProps = {
  item: MenuItem;
  onAdd: () => void;
};

export function MenuItemRow({ item, onAdd }: MenuItemRowProps) {
  const styles = useStyles();
  const isDrink = item.kind === 'drink';

  return (
    <View style={styles.row}>
      <PhotoPlaceholder
        accessibilityLabel={`${item.name} photo placeholder`}
        icon={isDrink ? 'beer-outline' : 'restaurant-outline'}
        iconSize={32}
        style={styles.photo}
        tone={isDrink ? 'brown' : 'cream'}
      />
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.name}>
            {item.name}
          </Text>
          <Text style={styles.price}>{formatGhs(item.price)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          {item.tag ? <Text style={styles.tag}>{item.tag}</Text> : <View />}
          <Button label="Pre-order" leftIcon="add" onPress={onAdd} style={styles.button} variant="neutral" />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    ...shadows.card,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.titleSm,
    color: colors.text,
    flex: 1,
  },
  price: {
    ...typography.titleSm,
    color: colors.secondary,
  },
  description: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tag: {
    ...typography.labelSm,
    color: colors.textMuted,
    flexShrink: 1,
  },
  button: {
    paddingHorizontal: spacing.md,
  },
}));
