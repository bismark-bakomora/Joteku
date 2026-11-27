'use client';

import { BookingDetail, CateringPill } from '@/components/BookingDetail';
import { bookingTitle } from '@/components/BookingRow';
import { useCatalog } from '@/components/CatalogContext';
import { EmptyState, ErrorState, Segmented, Skeleton } from '@/components/ui';
import { DetailBlank, ListButton, Workspace } from '@/components/Workspace';
import { cedis, dayLabel, timeRange } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { BOOKING_SELECT, type Booking, type CateringStatus } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import styles from './catering.module.css';

const OPTIONS: { value: CateringStatus; label: string }[] = [
  { value: 'requested', label: 'Needs a quote' },
  { value: 'quoted', label: 'Waiting to pay' },
  { value: 'paid', label: 'Paid' },
];

const EMPTY: Record<CateringStatus, { title: string; body: string }> = {
  requested: { title: 'No quotes to send', body: 'When a customer asks for catering with a booking, it waits here for your price.' },
  quoted: { title: 'Nothing waiting', body: 'Quotes you have sent appear here until the customer pays them in the app.' },
  paid: { title: 'No paid catering yet', body: 'Catering the customer has paid for appears here.' },
};

// Only bookings with a catering request, of the chosen status.
const CATERING_SELECT = BOOKING_SELECT.replace('catering:catering_requests(', 'catering:catering_requests!inner(');

export function CateringWorkspace() {
  const [statusParam, setStatus] = useParam('status');
  const [selectedId, setSelected] = useParam('id');
  const status = (OPTIONS.some((option) => option.value === statusParam) ? statusParam : 'requested') as CateringStatus;
  const { spaceName } = useCatalog();

  const load = useLoad(async () => {
    const result = await createClient()
      .from('bookings')
      .select(CATERING_SELECT)
      .eq('catering.status', status)
      .neq('status', 'cancelled')
      .order('starts_at', { ascending: status !== 'paid' })
      .limit(200);
    return rows<Booking[]>(result);
  }, status);

  let list: React.ReactNode;
  if (load.error && !load.data) {
    list = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data || load.loading) {
    list = [0, 1, 2].map((index) => <Skeleton height={112} key={index} />);
  } else if (load.data.length === 0) {
    list = <EmptyState body={EMPTY[status].body} title={EMPTY[status].title} />;
  } else {
    list = load.data.map((booking) => (
      <ListButton key={booking.id} onSelect={() => setSelected(booking.id)} selected={booking.id === selectedId}>
        <span className={styles.top}>
          <b>{bookingTitle(booking, spaceName)}</b>
          {booking.catering?.quote_amount ? (
            <span className="num">{cedis(booking.catering.quote_amount)}</span>
          ) : (
            <CateringPill status={booking.catering!.status} />
          )}
        </span>
        <span className={`${styles.when} num`}>
          {dayLabel(booking.starts_at)} · {timeRange(booking.starts_at, booking.ends_at)} · {booking.guest_count} guests
        </span>
        <span className={styles.request}>{booking.catering?.details}</span>
      </ListButton>
    ));
  }

  return (
    <Workspace
      backLabel="All catering"
      detail={
        selectedId ? (
          <BookingDetail bookingId={selectedId} onChanged={load.reload} />
        ) : (
          <DetailBlank>
            <p>Choose a request to read it and send a quote. The customer pays it in the app.</p>
          </DetailBlank>
        )
      }
      hasSelection={Boolean(selectedId)}
      list={list}
      onBack={() => setSelected(null)}
      title="Catering quotes"
      toolbar={
        <Segmented
          label="Catering status"
          onChange={(value) => setStatus(value === 'requested' ? null : value)}
          options={OPTIONS}
          value={status}
        />
      }
    />
  );
}
