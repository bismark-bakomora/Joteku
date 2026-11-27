'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { PaymentStatus } from '@/components/BookingDetail';
import { Button, EmptyState, ErrorState, Field, Segmented, Skeleton } from '@/components/ui';
import { addDays, cedis, dateTime, NETWORKS, phoneLocal, PURPOSES, todayIso } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { PAYMENT_SELECT, type Payment } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import styles from './payments.module.css';

type TypeFilter = 'all' | 'payment' | 'refund';

const isDay = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(payments: Payment[], from: string, to: string) {
  const header = ['Date (venue time)', 'Booking', 'Type', 'For', 'Status', 'Amount (GHS)', 'Network', 'Number', 'Description'];
  const lines = payments.map((payment) =>
    [
      payment.created_at.slice(0, 16).replace('T', ' '),
      payment.booking?.reference ?? '',
      payment.type === 'refund' ? 'Refund' : 'Payment',
      PURPOSES[payment.purpose],
      payment.status === 'success' ? 'Done' : payment.status === 'pending' ? 'Waiting' : 'Failed',
      (payment.type === 'refund' ? -1 : 1) * Number(payment.amount),
      NETWORKS[payment.network],
      phoneLocal(payment.phone),
      payment.description,
    ]
      .map(csvCell)
      .join(','),
  );
  // The byte-order mark makes Excel read the cedi sign and names correctly.
  const blob = new Blob([`﻿${[header.join(','), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `joteku-payments-${from}-to-${to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PaymentsReport() {
  const today = todayIso();
  const [fromParam, setFrom] = useParam('from');
  const [toParam, setTo] = useParam('to');
  const [typeParam, setType] = useParam('type');
  const from = isDay(fromParam) ? fromParam : addDays(today, -30);
  const to = isDay(toParam) ? toParam : today;
  const type: TypeFilter = typeParam === 'payment' || typeParam === 'refund' ? typeParam : 'all';

  const load = useLoad(async () => {
    let query = createClient()
      .from('payments')
      .select(PAYMENT_SELECT)
      .gte('created_at', `${from}T00:00:00Z`)
      .lt('created_at', `${addDays(to, 1)}T00:00:00Z`)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (type !== 'all') query = query.eq('type', type);
    return rows<Payment[]>(await query);
  }, `${from}|${to}|${type}`);

  const totals = useMemo(() => {
    const done = (load.data ?? []).filter((payment) => payment.status === 'success');
    const received = done.filter((p) => p.type === 'payment').reduce((sum, p) => sum + Number(p.amount), 0);
    const refunded = done.filter((p) => p.type === 'refund').reduce((sum, p) => sum + Number(p.amount), 0);
    return { received, refunded, net: received - refunded };
  }, [load.data]);

  let body: React.ReactNode;
  if (load.error && !load.data) {
    body = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data || load.loading) {
    body = (
      <div className={styles.skeletons} role="status" aria-label="Loading payments">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton height={56} key={index} />
        ))}
      </div>
    );
  } else if (load.data.length === 0) {
    body = <EmptyState body="Try a longer date range, or show both payments and refunds." title="No payments in these dates" />;
  } else {
    body = (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Payments and refunds from {from} to {to}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Booking</th>
              <th scope="col">For</th>
              <th scope="col">Paid with</th>
              <th scope="col">Status</th>
              <th className={styles.amountCol} scope="col">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {load.data.map((payment) => (
              <tr data-refund={payment.type === 'refund' || undefined} key={payment.id}>
                <td className="num" data-label="Date">
                  {dateTime(payment.created_at)}
                </td>
                <td data-label="Booking">
                  {payment.booking ? (
                    <Link className={`${styles.reference} num`} href={`/?when=upcoming&id=${payment.booking_id}`}>
                      {payment.booking.reference}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td data-label="For">
                  <b>{payment.type === 'refund' ? 'Refund' : PURPOSES[payment.purpose]}</b>
                </td>
                <td data-label="Paid with">
                  <span>
                    {NETWORKS[payment.network]}
                    <span className={styles.phone}>{phoneLocal(payment.phone)}</span>
                  </span>
                </td>
                <td data-label="Status">
                  <PaymentStatus status={payment.status} />
                </td>
                <td className={`${styles.amountCol} num`} data-label="Amount">
                  {payment.type === 'refund' ? '−' : ''}
                  {cedis(payment.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1>Payments</h1>
        <Button
          disabled={!load.data || load.data.length === 0}
          icon={<Download aria-hidden="true" size={18} />}
          onClick={() => load.data && downloadCsv(load.data, from, to)}
          variant="gold"
        >
          Download report
        </Button>
      </header>

      <div className={styles.filters}>
        <Field label="From" max={to} onChange={(event) => isDay(event.target.value) && setFrom(event.target.value)} type="date" value={from} />
        <Field label="To" max={today} min={from} onChange={(event) => isDay(event.target.value) && setTo(event.target.value)} type="date" value={to} />
        <div className={styles.typeFilter}>
          <span className={styles.filterLabel}>Show</span>
          <Segmented
            label="Payments or refunds"
            onChange={(value) => setType(value === 'all' ? null : value)}
            options={[
              { value: 'all', label: 'Both' },
              { value: 'payment', label: 'Payments' },
              { value: 'refund', label: 'Refunds' },
            ]}
            value={type}
          />
        </div>
      </div>

      {load.data && load.data.length > 0 ? (
        <dl className={styles.totals}>
          <div>
            <dt>Received</dt>
            <dd className="num">{cedis(totals.received)}</dd>
          </div>
          <div>
            <dt>Refunded</dt>
            <dd className="num">−{cedis(totals.refunded)}</dd>
          </div>
          <div className={styles.net}>
            <dt>Kept</dt>
            <dd className="num">{cedis(totals.net)}</dd>
          </div>
          <p className={styles.totalsNote}>Totals count finished payments only, not waiting or failed ones.</p>
        </dl>
      ) : null}

      {body}
    </div>
  );
}
