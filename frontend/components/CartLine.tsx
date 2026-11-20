import { formatGhs } from '@/lib/format';
import { roundMoney } from '@/lib/pricing';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { PreOrderLine } from '@/types/menu';
import { StyleSheet, Text, View } from 'react-native';
import { QuantityStepper } from './QuantityStepper';

type CartLineProps = {
  line: PreOrderLine;
  onChangeQuantity: (quantity: number) => void;
};

export function CartLine({ line, onChangeQuantity }: CartLineProps) {
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.name}>{line.name}</Text>
        <Text style={styles.lineTotal}>{formatGhs(roundMoney(line.unitPrice * line.quantity))}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.unit}>{formatGhs(line.unitPrice)} each</Text>
        <QuantityStepper itemName={line.name} onChange={onChangeQuantity} quantity={line.quantity} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: {
    ...typography.titleMd,
    color: colors.text,
    flex: 1,
  },
  lineTotal: {
    ...typography.titleMd,
    color: colors.secondary,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  unit: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
