import { formatGhs } from '@/lib/format';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { MenuItem } from '@/types/menu';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { Pill } from './Pill';
import { QuantityStepper } from './QuantityStepper';

type FoodCardProps = {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
};

export function FoodCard({ item, quantity, onAdd, onChangeQuantity }: FoodCardProps) {
  return (
    <View style={styles.card}>
      <PhotoPlaceholder
        accessibilityLabel={`${item.name} photo placeholder`}
        icon="restaurant-outline"
        iconSize={48}
        style={styles.photo}
      >
        {item.tag ? (
          <View style={styles.tag}>
            <Pill icon="ribbon-outline" label={item.tag} tone="light" />
          </View>
        ) : null}
        <View style={styles.price}>
          <Text style={styles.priceText}>{formatGhs(item.price)}</Text>
        </View>
      </PhotoPlaceholder>
      <View style={styles.text}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <View style={styles.footer}>
        {quantity > 0 ? (
          <QuantityStepper itemName={item.name} onChange={onChangeQuantity} quantity={quantity} />
        ) : (
          <Button label="Add to Pre-order" leftIcon="add" onPress={onAdd} style={styles.add} variant="gold" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    gap: spacing.sm + 4,
    ...shadows.card,
  },
  photo: {
    height: 176,
    borderRadius: radii.md,
  },
  tag: {
    position: 'absolute',
    left: spacing.sm + 2,
    bottom: spacing.sm + 2,
  },
  price: {
    position: 'absolute',
    right: spacing.sm + 2,
    bottom: spacing.sm + 2,
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  priceText: {
    ...typography.titleSm,
    color: colors.goldSoft,
  },
  text: {
    gap: spacing.xs,
  },
  name: {
    ...typography.titleLg,
    color: colors.text,
  },
  description: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  add: {
    paddingHorizontal: spacing.md,
  },
});
