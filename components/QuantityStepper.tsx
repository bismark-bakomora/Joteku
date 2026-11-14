import { colors, radii, sizes, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type QuantityStepperProps = {
  quantity: number;
  itemName: string;
  onChange: (quantity: number) => void;
};

export function QuantityStepper({ quantity, itemName, onChange }: QuantityStepperProps) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel={quantity === 1 ? `Remove ${itemName}` : `One less ${itemName}`}
        accessibilityRole="button"
        onPress={() => onChange(quantity - 1)}
        style={styles.button}
      >
        <Ionicons color={colors.primary} name={quantity === 1 ? 'trash-outline' : 'remove'} size={20} />
      </Pressable>
      <Text accessibilityLabel={`${quantity} in pre-order`} style={styles.count}>
        {quantity}
      </Text>
      <Pressable
        accessibilityLabel={`One more ${itemName}`}
        accessibilityRole="button"
        onPress={() => onChange(quantity + 1)}
        style={styles.button}
      >
        <Ionicons color={colors.primary} name="add" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
  },
  button: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...typography.titleMd,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
});
