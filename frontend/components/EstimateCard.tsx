import { formatGhs, formatHours } from '@/lib/format';
import { estimateSpaceBooking } from '@/lib/pricing';
import { colors, radii, spacing, typography } from '@/theme';
import { DecorationPackage } from '@/types/booking';
import { Space } from '@/types/space';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { PriceRow } from './PriceRow';

type EstimateCardProps = {
  space: Space;
  startTime: string;
  endTime: string;
  decoration: DecorationPackage | null;
  cateringRequested: boolean;
};

export function EstimateCard({
  space,
  startTime,
  endTime,
  decoration,
  cateringRequested,
}: EstimateCardProps) {
  const estimate = estimateSpaceBooking(space, startTime, endTime, decoration);
  const minimumNote = estimate.minimumApplied ? `, minimum ${formatHours(space.minHours)}` : '';

  return (
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Price estimate
      </Text>
      <PriceRow
        amount={formatGhs(estimate.venueHire)}
        detail={`${space.name}, ${formatHours(estimate.chargeableHours)} at ${formatGhs(space.hourlyRate)}/hr${minimumNote}`}
        label="Venue hire"
      />
      {decoration ? (
        <PriceRow amount={formatGhs(estimate.decoration)} label={`${decoration.name} decoration`} />
      ) : null}
      {cateringRequested ? (
        <PriceRow amount="Later" detail="Joteku sends you a quote after you book" label="Custom catering" />
      ) : null}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Total to pay now</Text>
        <Text style={styles.totalAmount}>{formatGhs(estimate.total)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  title: {
    ...typography.titleMd,
    color: colors.primary,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.titleSm,
    color: colors.text,
  },
  totalAmount: {
    ...typography.amount,
    color: colors.primary,
  },
});
