'use client';

import { Ban, ChefHat, Phone, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { errorMessage } from '@/lib/errors';
import {
  cedis,
  dateTime,
  longDay,
  NETWORKS,
  phoneLocal,
  PURPOSES,
  time,
  timeRange,
} from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { BOOKING_SELECT, type Booking, PAYMENT_SELECT, type Payment } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { bookingTitle } from './BookingRow';
import { useCatalog } from './CatalogContext';
import { HutMap } from './HutMap';
import { Button, Card, ErrorState, Field, Notice, Pill, Skeleton, StatusPill } from './ui';
import styles from './Booking.module.css';

const CANCELLED_BY: Record<string, string> = {
  customer: 'the customer',
  joteku: 'Joteku',
  hold_expired: 'the system, because payment did not finish in time',
};

// Everything about one booking, and what the admin can do with it.
export function BookingDetail({ bookingId, onChanged }: { bookingId: string; onChanged: () => void }) {
  const load = useLoad(async () => {
    const supabase = createClient();
    const [booking, payments] = await Promise.all([
      supabase.from('bookings').select(BOOKING_SELECT).eq('id', bookingId).single(),
      supabase.from('payments').select(PAYMENT_SELECT).eq('booking_id', bookingId).order('created_at'),
    ]);
    return { booking: rows<Booking>(booking), payments: rows<Payment[]>(payments) };
  }, bookingId);

  if (load.error && !load.data) return <ErrorState message={load.error} onRetry={load.reload} />;
  if (!load.data || load.data.booking.id !== bookingId) return <DetailSkeleton />;

  const { booking, payments } = load.data;
  const changed = () => {
    load.reload();
    onChanged();
  };
  return <BookingView booking={booking} onChanged={changed} payments={payments} />;
}

function DetailSkeleton() {
  return (
    <div aria-label="Loading the booking" className={styles.detail} role="status">
      <Skeleton height={40} width="60%" />
      <Skeleton height={20} width={200} />
      <Skeleton height={180} />
      <Skeleton height={140} />
    </div>
  );
}

function quoteFieldId(bookingId: string) {
  return `quote-${bookingId}`;
}

// "GH₵ 14,000 by MTN MoMo": the booking's own payment, without catering.
function paidLine(booking: Booking, payments: Payment[]): string {
  if (Number(booking.amount_paid) <= 0) return 'Not paid yet';
  const payment = payments.find(
    (candidate) => candidate.type === 'payment' && candidate.status === 'success' && candidate.purpose !== 'catering_balance',
  );
  return payment ? `${cedis(booking.amount_paid)} by ${NETWORKS[payment.network]}` : cedis(booking.amount_paid);
}

function BookingView({
  booking,
  payments,
  onChanged,
}: {
  booking: Booking;
  payments: Payment[];
  onChanged: () => void;
}) {
  const { spaceName, unitsOf, decorationName } = useCatalog();
  const isTable = booking.kind === 'table';
  const active = booking.status === 'confirmed' || booking.status === 'pending_payment';
  const canQuote = booking.status === 'confirmed' && booking.catering !== null && booking.catering.status !== 'paid';

  const goToQuote = () => {
    const field = document.getElementById(quoteFieldId(booking.id));
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
  };

  return (
    <article className={styles.detail}>
      <header className={styles.detailHead}>
        <div className={styles.detailTitle}>
          <h2>{bookingTitle(booking, spaceName)}</h2>
          <div className={styles.headMeta}>
            <StatusPill status={booking.status} />
            <span className={`${styles.reference} num`}>{booking.reference}</span>
            {booking.date_change_used ? <Pill tone="neutral">Date changed once</Pill> : null}
          </div>
        </div>
        {!isTable ? <HutMap size="large" units={unitsOf(booking.space_id)} /> : null}
      </header>

      {active ? (
        <div className={styles.headActions}>
          {canQuote ? (
            <Button icon={<Send aria-hidden="true" size={18} />} onClick={goToQuote} variant="gold">
              {booking.catering?.status === 'quoted' ? 'Update catering quote' : 'Send catering quote'}
            </Button>
          ) : null}
          <CancelForJoteku booking={booking} onChanged={onChanged} />
        </div>
      ) : null}

      {booking.status === 'cancelled' && booking.cancelled_by ? (
        <Notice tone="info">
          Cancelled by {CANCELLED_BY[booking.cancelled_by]}
          {booking.cancelled_at ? ` on ${dateTime(booking.cancelled_at)}` : ''}.
          {Number(booking.refunded_amount) > 0 ? ` ${cedis(booking.refunded_amount)} refunded.` : ''}
        </Notice>
      ) : null}

      <Card>
        <dl className={styles.facts}>
          <Fact label="Date">{longDay(booking.starts_at)}</Fact>
          <Fact label="Time">
            {isTable ? time(booking.starts_at) : timeRange(booking.starts_at, booking.ends_at)}
          </Fact>
          <Fact label={isTable ? 'Party' : 'Guests'}>
            {isTable ? `${booking.party_size} people` : `${booking.guest_count} guests`}
          </Fact>
          <Fact label="Paid">{paidLine(booking, payments)}</Fact>
          <Fact label="Customer">
            <span>{booking.customer?.name ?? (booking.customer ? 'Guest' : 'Deleted account')}</span>
            <a className={styles.phone} href={`tel:${booking.phone}`}>
              <Phone aria-hidden="true" size={16} />
              {phoneLocal(booking.phone)}
            </a>
          </Fact>
          {!isTable ? <Fact label="Decoration">{decorationName(booking.decoration_id) ?? 'None'}</Fact> : null}
          <Fact label="Booked">{dateTime(booking.created_at)}</Fact>
          {booking.previous_starts_at ? <Fact label="Moved from">{longDay(booking.previous_starts_at)}</Fact> : null}
          {booking.status === 'pending_payment' && booking.hold_expires_at ? (
            <Fact label="Hold ends">{time(booking.hold_expires_at)}</Fact>
          ) : null}
        </dl>
        {booking.notes ? (
          <div className={styles.notes}>
            <span className={styles.factLabel}>Notes from the customer</span>
            <p>{booking.notes}</p>
          </div>
        ) : null}
      </Card>

      <Money booking={booking} />

      {isTable && booking.lines.length > 0 ? <PreOrder booking={booking} /> : null}

      {booking.catering ? <Catering booking={booking} onChanged={onChanged} /> : null}

      <Payments payments={payments} />
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{children}</dd>
    </div>
  );
}

function Money({ booking }: { booking: Booking }) {
  const lines: [string, number | null][] =
    booking.kind === 'table'
      ? [
          ['Pre-order', booking.pre_order_total],
          ['Deposit', booking.amount_due],
          ['Balance at the venue', booking.balance_at_venue],
        ]
      : [
          ['Venue hire', booking.venue_hire_amount],
          ['Decoration', booking.decoration_amount],
          ['Total', booking.amount_due],
        ];
  return (
    <Card>
      <h3 className={styles.cardTitle}>Money</h3>
      <dl className={styles.money}>
        {lines.map(([label, amount]) => (
          <div className={styles.moneyRow} key={label}>
            <dt>{label}</dt>
            <dd className="num">{cedis(amount)}</dd>
          </div>
        ))}
        <div className={`${styles.moneyRow} ${styles.moneyStrong}`}>
          <dt>Paid</dt>
          <dd className="num">{cedis(booking.amount_paid)}</dd>
        </div>
        {Number(booking.refunded_amount) > 0 ? (
          <div className={styles.moneyRow}>
            <dt>Refunded</dt>
            <dd className="num">−{cedis(booking.refunded_amount)}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

function PreOrder({ booking }: { booking: Booking }) {
  return (
    <Card>
      <h3 className={styles.cardTitle}>Pre-order</h3>
      <ul className={styles.lines}>
        {booking.lines.map((line) => (
          <li className={styles.line} key={line.item_id}>
            <span>
              <b className="num">{line.quantity} ×</b> {line.name}
            </span>
            <span className="num">{cedis(line.quantity * Number(line.unit_price))}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Catering({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const catering = booking.catering!;
  const [amount, setAmount] = useState(catering.quote_amount ? String(catering.quote_amount) : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const canQuote = booking.status === 'confirmed' && catering.status !== 'paid';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage({ tone: 'error', text: 'Enter the quote in cedis, more than 0.' });
      return;
    }
    setBusy(true);
    const { error } = await createClient().rpc('admin_quote_catering', { p_booking_id: booking.id, p_amount: value });
    setBusy(false);
    if (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The quote was not sent. Please try again.') });
      return;
    }
    setMessage({ tone: 'success', text: `Quote of ${cedis(value)} sent. The customer pays it in the app.` });
    onChanged();
  };

  return (
    <Card>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>
          <ChefHat aria-hidden="true" size={22} /> Catering
        </h3>
        <CateringPill status={catering.status} />
      </div>
      <p className={styles.request}>{catering.details}</p>
      {catering.status === 'paid' ? (
        <Notice tone="success">
          Paid {cedis(catering.quote_amount)}
          {catering.paid_at ? ` on ${dateTime(catering.paid_at)}` : ''}.
        </Notice>
      ) : null}
      {canQuote ? (
        <form className={styles.quote} noValidate onSubmit={submit}>
          <Field
            hint={catering.status === 'quoted' ? 'Change the amount to correct the quote.' : undefined}
            id={quoteFieldId(booking.id)}
            inputMode="decimal"
            label={catering.status === 'quoted' ? 'Quote' : 'Quote for this catering'}
            min="1"
            onChange={(event) => setAmount(event.target.value)}
            prefix="GH₵"
            step="0.01"
            type="number"
            value={amount}
          />
          <Button icon={<Send aria-hidden="true" size={18} />} loading={busy} type="submit" variant="gold">
            {catering.status === 'quoted' ? 'Update quote' : 'Send quote'}
          </Button>
        </form>
      ) : null}
      {!canQuote && catering.status !== 'paid' && booking.status === 'pending_payment' ? (
        <p className={styles.muted}>A quote can be sent once the booking is paid.</p>
      ) : null}
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
    </Card>
  );
}

export function CateringPill({ status }: { status: 'requested' | 'quoted' | 'paid' }) {
  if (status === 'requested') return <Pill tone="gold">Needs a quote</Pill>;
  if (status === 'quoted') return <Pill tone="pending">Quoted, not paid</Pill>;
  return <Pill tone="confirmed">Paid</Pill>;
}

function Payments({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <h3 className={styles.cardTitle}>Payments and refunds</h3>
      {payments.length === 0 ? (
        <p className={styles.muted}>No payment has been started for this booking yet.</p>
      ) : (
        <ul className={styles.lines}>
          {payments.map((payment) => (
            <li className={styles.payment} key={payment.id}>
              <span className={styles.paymentMain}>
                <b>{payment.type === 'refund' ? 'Refund' : PURPOSES[payment.purpose]}</b>
                <span className={styles.muted}>
                  {NETWORKS[payment.network]} · {phoneLocal(payment.phone)} · {dateTime(payment.created_at)}
                </span>
              </span>
              <span className={styles.paymentSide}>
                <span className="num">
                  {payment.type === 'refund' ? '−' : ''}
                  {cedis(payment.amount)}
                </span>
                <PaymentStatus status={payment.status} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PaymentStatus({ status }: { status: Payment['status'] }) {
  if (status === 'success') return <Pill tone="confirmed">Done</Pill>;
  if (status === 'pending') return <Pill tone="pending">Waiting</Pill>;
  return <Pill tone="cancelled">Failed</Pill>;
}

function CancelForJoteku({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cateringPaid = booking.catering?.status === 'paid' ? Number(booking.catering.quote_amount) : 0;
  const refund = Number(booking.amount_paid) - Number(booking.refunded_amount) + cateringPaid;

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc('admin_cancel_booking', { p_booking_id: booking.id });
    setBusy(false);
    if (rpcError) {
      setError(errorMessage(rpcError, 'The booking was not cancelled. Please try again.'));
      return;
    }
    setConfirming(false);
    onChanged();
  };

  if (!confirming) {
    return (
      <Button icon={<Ban aria-hidden="true" size={18} />} onClick={() => setConfirming(true)} variant="outline">
        Cancel for Joteku
      </Button>
    );
  }
  return (
    <div aria-labelledby={`cancel-${booking.id}`} className={styles.confirm} role="alertdialog">
      <h3 id={`cancel-${booking.id}`}>Cancel this booking for Joteku?</h3>
      <p>
        {refund > 0
          ? `The customer gets everything back: ${cedis(refund)} to the number that paid.`
          : 'Nothing has been paid, so there is nothing to refund.'}{' '}
        The time becomes free for other bookings. This cannot be undone.
      </p>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className={styles.confirmButtons}>
        <Button disabled={busy} onClick={() => setConfirming(false)} variant="quiet">
          Keep booking
        </Button>
        <Button loading={busy} onClick={cancel} variant="danger">
          Cancel and refund
        </Button>
      </div>
    </div>
  );
}
