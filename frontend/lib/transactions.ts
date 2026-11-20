import { Transaction } from '@/types/payment';
import { roundMoney } from './pricing';

export type TransactionTypeFilter = 'all' | 'payment' | 'refund';
export type TransactionPeriod = 'all' | 30 | 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export function filterTransactions(
  transactions: Transaction[],
  type: TransactionTypeFilter,
  period: TransactionPeriod,
  now: Date,
): Transaction[] {
  const since = period === 'all' ? null : now.getTime() - period * DAY_MS;
  return transactions.filter(
    (transaction) =>
      (type === 'all' || transaction.type === type) &&
      (since === null || new Date(transaction.date).getTime() >= since),
  );
}

// Only money that actually moved counts towards the totals, so failed payments are left out.
export function transactionTotals(transactions: Transaction[]): { paid: number; refunded: number } {
  let paid = 0;
  let refunded = 0;
  for (const transaction of transactions) {
    if (transaction.status !== 'success') {
      continue;
    }
    if (transaction.type === 'payment') {
      paid += transaction.amount;
    } else {
      refunded += transaction.amount;
    }
  }
  return { paid: roundMoney(paid), refunded: roundMoney(refunded) };
}
