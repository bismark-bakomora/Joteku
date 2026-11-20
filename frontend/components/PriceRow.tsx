import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type PriceRowProps = {
  label: string;
  detail?: string;
  amount: string;
  last?: boolean;
};

export function PriceRow({ label, detail, amount, last = false }: PriceRowProps) {
  return (
    <View style={[styles.row, last ? undefined : styles.divider]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.titleSm,
    color: colors.text,
  },
  detail: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.titleSm,
    color: colors.secondary,
  },
});
