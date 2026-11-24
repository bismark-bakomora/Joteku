import { Receipt } from '@/lib/receipt';
import { colors, radii, spacing, typography } from '@/theme';
import { BookingStatus } from '@/types/booking';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { DetailRow } from './DetailRow';
import { PriceRow } from './PriceRow';
import { StatusBadge } from './StatusBadge';

type ReceiptCardProps = {
  receipt: Receipt;
  status: BookingStatus;
};

export function ReceiptCard({ receipt, status }: ReceiptCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{receipt.title}</Text>
        <StatusBadge status={status} />
      </View>
      {receipt.details.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
      <View style={styles.divider} />
      {receipt.charges.map((row) => (
        <PriceRow amount={row.value} key={row.label} label={row.label} />
      ))}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>{receipt.totalLabel}</Text>
        <Text style={styles.totalAmount}>{receipt.total}</Text>
      </View>
      {receipt.payment.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
      {receipt.notes.map((note) => (
        <Text key={note} style={styles.note}>
          {note}
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMd,
    color: colors.primary,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.titleSm,
    color: colors.text,
  },
  totalAmount: {
    ...typography.amount,
    color: colors.primary,
  },
  note: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
});
