import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CartLine } from '@/components/CartLine';
import { EmptyState } from '@/components/EmptyState';
import { InfoBanner } from '@/components/InfoBanner';
import { PriceRow } from '@/components/PriceRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useCart } from '@/context/CartContext';
import { useAsync } from '@/hooks/useAsync';
import { formatGhs } from '@/lib/format';
import { tablePayment } from '@/lib/pricing';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CartScreen() {
  const cart = useCart();
  const settings = useAsync(() => services.venue.getSettings());
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (cart.lines.length === 0) {
    return (
      <ScreenContainer contentStyle={styles.emptyWrap}>
        <EmptyState
          actionLabel="Browse the menu"
          message="Add food and drinks from the menu, then reserve a table to have them ready when you arrive."
          onAction={() => router.navigate('/menu')}
          title="Your pre-order is empty"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <View style={styles.lines}>
        {cart.lines.map((line) => (
          <CartLine
            key={line.itemId}
            line={line}
            onChangeQuantity={(quantity) => cart.setQuantity(line.itemId, quantity)}
          />
        ))}
      </View>

      <Card style={styles.summary}>
        <AsyncView
          empty={{ title: 'Totals unavailable', message: 'Please try again.' }}
          isEmpty={() => false}
          state={settings}
        >
          {(value) => {
            const { deposit, balanceAtVenue } = tablePayment(cart.total, value);
            return (
              <>
                <PriceRow amount={formatGhs(cart.total)} label="Pre-order total" />
                <PriceRow
                  amount={formatGhs(deposit)}
                  detail="Paid by mobile money when you reserve a table"
                  label="Deposit"
                />
                <PriceRow amount={formatGhs(balanceAtVenue)} label="Balance, paid at the venue" last />
              </>
            );
          }}
        </AsyncView>
      </Card>

      <InfoBanner
        body="A pre-order goes with a table reservation. Pay the deposit when you reserve, and the balance at the venue."
        icon="information-circle-outline"
        title="How pre-orders work"
      />

      <View style={styles.actions}>
        <Button
          label="Reserve a Table"
          onPress={() => router.push('/reserve-table')}
          rightIcon="arrow-forward"
        />
        <Button label="Add more items" onPress={() => router.navigate('/menu')} variant="secondary" />
        {confirmingClear ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmText}>Remove everything from your pre-order?</Text>
            <View style={styles.confirmButtons}>
              <Button
                label="Keep items"
                onPress={() => setConfirmingClear(false)}
                style={styles.confirmButton}
                variant="neutral"
              />
              <Button
                label="Remove all"
                onPress={() => {
                  cart.clear();
                  setConfirmingClear(false);
                }}
                style={styles.confirmButton}
                variant="secondary"
              />
            </View>
          </View>
        ) : (
          <Button
            label="Clear pre-order"
            leftIcon="trash-outline"
            onPress={() => setConfirmingClear(true)}
            variant="neutral"
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    justifyContent: 'center',
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  lines: {
    gap: spacing.sm,
  },
  summary: {
    paddingVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  confirm: {
    backgroundColor: colors.cancelledBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    ...typography.titleSm,
    color: colors.text,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});
