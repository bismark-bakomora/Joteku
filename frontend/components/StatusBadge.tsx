import { BookingStatus } from '@/types/booking';
import { colors, radii, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

const labels: Record<BookingStatus, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const tones: Record<BookingStatus, { background: string; text: string }> = {
  pending_payment: { background: colors.pendingBackground, text: colors.pendingText },
  confirmed: { background: colors.confirmedBackground, text: colors.success },
  cancelled: { background: colors.cancelledBackground, text: colors.error },
  completed: { background: colors.surfaceHigh, text: colors.textSubtle },
};

type StatusBadgeProps = {
  status: BookingStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = tones[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Text style={[styles.label, { color: tone.text }]}>{labels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.labelSm,
    textTransform: 'uppercase',
  },
});
