import { AsyncView } from '@/components/AsyncView';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SignInGate } from '@/components/SignInGate';
import { useSession } from '@/context/SessionContext';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { formatGhs, formatStamp } from '@/lib/format';
import { formatPhoneLocal } from '@/lib/phone';
import { networkName } from '@/lib/receipt';
import {
  filterTransactions,
  TransactionPeriod,
  transactionTotals,
  TransactionTypeFilter,
} from '@/lib/transactions';
import { services } from '@/services';
import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Transaction } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PeriodKey = 'all' | '30' | '90';

const TYPE_OPTIONS: { key: TransactionTypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'payment', label: 'Payments' },
  { key: 'refund', label: 'Refunds' },
];

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
];

function toPeriod(key: PeriodKey): TransactionPeriod {
  return key === 'all' ? 'all' : key === '30' ? 30 : 90;
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const refund = transaction.type === 'refund';
  const failed = transaction.status === 'failed';
  return (
    <Pressable
      accessibilityHint="Opens the receipt"
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/receipt/[bookingId]', params: { bookingId: transaction.bookingId } })
      }
      style={styles.row}
    >
      <View style={[styles.rowIcon, refund ? styles.refundIcon : undefined]}>
        <Ionicons
          color={refund ? colors.success : colors.secondary}
          name={refund ? 'return-down-back-outline' : 'arrow-up-outline'}
          size={20}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{transaction.description}</Text>
        <Text style={styles.rowMeta}>
          {transaction.bookingReference} · {formatStamp(transaction.date)}
        </Text>
        <Text style={styles.rowMeta}>
          {networkName(transaction.network)} {formatPhoneLocal(transaction.phone)}
        </Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.amount, refund ? styles.amountRefund : undefined, failed ? styles.amountFailed : undefined]}>
          {refund ? '+' : ''}
          {formatGhs(transaction.amount)}
        </Text>
        {failed ? <Text style={styles.failed}>Failed</Text> : null}
      </View>
    </Pressable>
  );
}

export default function TransactionsScreen() {
  const { session } = useSession();
  const now = useNow();
  const [type, setType] = useState<TransactionTypeFilter>('all');
  const [period, setPeriod] = useState<PeriodKey>('all');
  const phone = session?.phone ?? null;
  const transactions = useAsync(
    () => (phone ? services.payments.listTransactions(phone) : Promise.resolve([])),
    [phone],
  );
  const { reload } = transactions;

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!session) {
    return (
      <ScreenContainer contentStyle={styles.content} scroll>
        <SignInGate
          message="Your payments and refunds are linked to your phone number."
          redirect="/transactions"
          title="Sign in to see your transactions"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <FilterChips onSelect={setType} options={TYPE_OPTIONS} selected={type} />
      <FilterChips onSelect={setPeriod} options={PERIOD_OPTIONS} selected={period} />
      <AsyncView
        empty={{
          title: 'No transactions yet',
          message: 'Payments and refunds for your bookings will show here.',
        }}
        state={transactions}
      >
        {(items) => {
          const shown = filterTransactions(items, type, toPeriod(period), now);
          const totals = transactionTotals(shown);
          return (
            <View style={styles.sections}>
              <Card style={styles.totals}>
                <View style={styles.total}>
                  <Text style={styles.totalLabel}>Paid</Text>
                  <Text style={styles.totalAmount}>{formatGhs(totals.paid)}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.total}>
                  <Text style={styles.totalLabel}>Refunded</Text>
                  <Text style={[styles.totalAmount, styles.amountRefund]}>{formatGhs(totals.refunded)}</Text>
                </View>
              </Card>
              {shown.length === 0 ? (
                <EmptyState
                  message="Try another filter to see more of your history."
                  title="Nothing for this filter"
                />
              ) : (
                <View style={styles.list}>
                  {shown.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </View>
              )}
              <Text style={styles.note}>Tap a transaction to open its receipt.</Text>
            </View>
          );
        }}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sections: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  totals: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    flex: 1,
    alignItems: 'center',
  },
  totalDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalAmount: {
    ...typography.amount,
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
  },
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundIcon: {
    backgroundColor: colors.confirmedBackground,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.titleSm,
    color: colors.text,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.titleSm,
    color: colors.text,
  },
  amountRefund: {
    color: colors.success,
  },
  amountFailed: {
    color: colors.disabledText,
    textDecorationLine: 'line-through',
  },
  failed: {
    ...typography.labelSm,
    color: colors.error,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
