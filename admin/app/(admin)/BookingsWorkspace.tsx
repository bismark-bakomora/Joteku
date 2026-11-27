'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BookingDetail } from '@/components/BookingDetail';
import { BookingRow } from '@/components/BookingRow';
import { EmptyState, ErrorState, Segmented, Skeleton } from '@/components/ui';
import { DetailBlank, Workspace } from '@/components/Workspace';
import { addDays, longDayIso, todayIso } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { BOOKING_SELECT, type Booking } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import styles from './bookings.module.css';

type When = 'today' | 'upcoming' | 'past' | 'cancelled';
type Kind = 'all' | 'space' | 'table';

const WHEN_OPTIONS: { value: When; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Coming up' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'space', label: 'Events' },
  { value: 'table', label: 'Tables' },
];

const EMPTY: Record<When, { title: string; body: string }> = {
  today: { title: 'Nothing booked today', body: 'New bookings for today appear here as soon as they are paid.' },
  upcoming: { title: 'Nothing coming up', body: 'Bookings from tomorrow onwards appear here.' },
  past: { title: 'No past bookings', body: 'Bookings that have finished appear here.' },
  cancelled: { title: 'No cancellations', body: 'Bookings cancelled by customers or by Joteku appear here.' },
};

async function fetchBookings(when: When): Promise<Booking[]> {
  const supabase = createClient();
  const today = todayIso();
  const tomorrow = addDays(today, 1);
  let query = supabase.from('bookings').select(BOOKING_SELECT);
  if (when === 'today') {
    query = query
      .neq('status', 'cancelled')
      .gte('starts_at', `${today}T00:00:00Z`)
      .lt('starts_at', `${tomorrow}T00:00:00Z`)
      .order('starts_at');
  } else if (when === 'upcoming') {
    query = query
      .in('status', ['pending_payment', 'confirmed'])
      .gte('starts_at', `${tomorrow}T00:00:00Z`)
      .order('starts_at')
      .limit(200);
  } else if (when === 'past') {
    query = query
      .in('status', ['confirmed', 'completed'])
      .lt('starts_at', `${today}T00:00:00Z`)
      .order('starts_at', { ascending: false })
      .limit(200);
  } else {
    query = query.eq('status', 'cancelled').order('starts_at', { ascending: false }).limit(200);
  }
  return rows<Booking[]>(await query);
}

export function BookingsWorkspace() {
  const [whenParam, setWhen] = useParam('when');
  const [kindParam, setKind] = useParam('kind');
  const [selectedId, setSelected] = useParam('id');
  const [search, setSearch] = useState('');
  const when = (WHEN_OPTIONS.some((option) => option.value === whenParam) ? whenParam : 'today') as When;
  const kind = (KIND_OPTIONS.some((option) => option.value === kindParam) ? kindParam : 'all') as Kind;

  const load = useLoad(() => fetchBookings(when), when);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase().replace(/\s+/g, '');
    return (load.data ?? []).filter((booking) => {
      if (kind !== 'all' && booking.kind !== kind) return false;
      if (!needle) return true;
      const phoneLocal = booking.phone.replace('+233', '0');
      return (
        booking.reference.toLowerCase().includes(needle) ||
        phoneLocal.includes(needle) ||
        booking.phone.includes(needle) ||
        (booking.customer?.name ?? '').toLowerCase().replace(/\s+/g, '').includes(needle)
      );
    });
  }, [load.data, kind, search]);

  const events = (load.data ?? []).filter((booking) => booking.kind === 'space').length;
  const tables = (load.data ?? []).length - events;

  const toolbar = (
    <>
      {when === 'today' ? (
        <p className={styles.summary}>
          {longDayIso(todayIso())}
          {load.data ? ` · ${events} ${events === 1 ? 'event' : 'events'}, ${tables} ${tables === 1 ? 'table' : 'tables'}` : ''}
        </p>
      ) : null}
      <Segmented label="When" onChange={(value) => setWhen(value === 'today' ? null : value)} options={WHEN_OPTIONS} value={when} />
      <Segmented label="Kind" onChange={(value) => setKind(value === 'all' ? null : value)} options={KIND_OPTIONS} value={kind} />
      <label className={styles.search}>
        <Search aria-hidden="true" size={20} />
        <span className="visually-hidden">Search bookings</span>
        <input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Reference, name or phone"
          type="search"
          value={search}
        />
      </label>
    </>
  );

  let list: React.ReactNode;
  if (load.error && !load.data) {
    list = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data || load.loading) {
    list = (
      <div aria-label="Loading bookings" className={styles.skeletons} role="status">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton height={92} key={index} />
        ))}
      </div>
    );
  } else if (shown.length === 0) {
    list = search ? (
      <EmptyState body="Check the reference or number, or clear the search." title="No booking matches" />
    ) : (
      <EmptyState body={EMPTY[when].body} title={EMPTY[when].title} />
    );
  } else {
    list = shown.map((booking) => (
      <BookingRow booking={booking} key={booking.id} onSelect={() => setSelected(booking.id)} selected={booking.id === selectedId} />
    ));
  }

  return (
    <Workspace
      backLabel="All bookings"
      detail={
        selectedId ? (
          <BookingDetail bookingId={selectedId} onChanged={load.reload} />
        ) : (
          <DetailBlank>
            <p>Choose a booking on the left to see who, when, what was paid, and what to do next.</p>
          </DetailBlank>
        )
      }
      hasSelection={Boolean(selectedId)}
      list={list}
      onBack={() => setSelected(null)}
      title="Bookings"
      toolbar={toolbar}
    />
  );
}
