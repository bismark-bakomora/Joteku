import { useCart } from '@/context/CartContext';
import { useAsync } from '@/hooks/useAsync';
import { formatGhs } from '@/lib/format';
import { tablePayment } from '@/lib/pricing';
import { services } from '@/services';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type PreOrderBarProps = {
  onHeightChange: (height: number) => void;
};

// Floats over the bottom of a screen while the pre-order has items. It reports
// its height so the screen can leave room for it.
export function PreOrderBar({ onHeightChange }: PreOrderBarProps) {
  const { itemCount, total } = useCart();
  const settings = useAsync(() => services.venue.getSettings());
  const deposit = settings.data ? tablePayment(total, settings.data).deposit : null;

  useEffect(() => {
    if (itemCount === 0) {
      onHeightChange(0);
    }
  }, [itemCount, onHeightChange]);

  if (itemCount === 0) {
    return null;
  }

  return (
    <View
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height + spacing.sm)}
      pointerEvents="box-none"
      style={styles.wrap}
    >
      <View style={styles.bar}>
        <Text style={styles.summary}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in pre-order
          <Text style={styles.total}> · {formatGhs(total)}</Text>
        </Text>
        {deposit !== null ? (
          <Text style={styles.deposit}>Deposit when you reserve a table: {formatGhs(deposit)}</Text>
        ) : null}
        <Button
          label="View Pre-order"
          leftIcon="bag-handle-outline"
          onPress={() => router.push('/cart')}
          rightIcon="arrow-forward"
          variant="gold"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
  },
  bar: {
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.raised,
  },
  summary: {
    ...typography.titleSm,
    color: colors.goldSoft,
  },
  total: {
    color: colors.onInverseSurface,
  },
  deposit: {
    ...typography.caption,
    color: colors.surfaceHigh,
  },
});
