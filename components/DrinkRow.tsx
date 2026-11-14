import { formatGhs } from '@/lib/format';
import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { MenuItem } from '@/types/menu';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { QuantityStepper } from './QuantityStepper';

type DrinkRowProps = {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
};

export function DrinkRow({ item, quantity, onAdd, onChangeQuantity }: DrinkRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.main}>
        <PhotoPlaceholder
          accessibilityLabel={`${item.name} photo placeholder`}
          icon={item.categoryId === 'beer' ? 'beer-outline' : 'wine-outline'}
          iconSize={28}
          style={styles.photo}
          tone="brown"
        />
        <View style={styles.text}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.price}>{formatGhs(item.price)}</Text>
        </View>
        {quantity === 0 ? (
          <Pressable
            accessibilityLabel={`Add ${item.name} to pre-order`}
            accessibilityRole="button"
            onPress={onAdd}
            style={styles.add}
          >
            <Ionicons color={colors.primary} name="add" size={24} />
          </Pressable>
        ) : null}
      </View>
      {quantity > 0 ? (
        <View style={styles.action}>
          <QuantityStepper itemName={item.name} onChange={onChangeQuantity} quantity={quantity} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    gap: spacing.sm,
    ...shadows.card,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
  },
  text: {
    flex: 1,
  },
  name: {
    ...typography.titleSm,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  price: {
    ...typography.titleSm,
    color: colors.secondary,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  add: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
