import { formatDateShort, formatGhs } from '@/lib/format';
import { bookingTitle } from '@/lib/receipt';
import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Booking } from '@/types/booking';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from './StatusBadge';

type PastBookingRowProps = {
  booking: Booking;
  onPress: () => void;
};

export function PastBookingRow({ booking, onPress }: PastBookingRowProps) {
  const refunded = booking.refundedAmount > 0;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.icon}>
        <Ionicons
          color={colors.primary}
          name={booking.kind === 'table' ? 'restaurant-outline' : 'people-outline'}
          size={20}
        />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {bookingTitle(booking)}
        </Text>
        <Text style={styles.meta}>
          {formatDateShort(booking.date)} · {booking.reference}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      <View style={styles.amountWrap}>
        <Text style={styles.amount}>{formatGhs(refunded ? booking.refundedAmount : booking.amountPaid)}</Text>
        <Text style={styles.amountLabel}>{refunded ? 'refunded' : 'paid'}</Text>
      </View>
      <Ionicons color={colors.outline} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.tapTarget + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    ...shadows.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.titleSm,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.titleSm,
    color: colors.text,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
