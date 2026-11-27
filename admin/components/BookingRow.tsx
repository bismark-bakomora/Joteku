'use client';

import { dayLabel, EVENT_TYPES, phoneLocal, timeRange, time } from '@/lib/format';
import type { Booking } from '@/lib/types';
import { useCatalog } from './CatalogContext';
import { HutMap } from './HutMap';
import { StatusPill } from './ui';
import { ListButton } from './Workspace';
import styles from './Booking.module.css';

export function bookingTitle(booking: Booking, spaceName: (id: string | null) => string): string {
  if (booking.kind === 'table') return `Table for ${booking.party_size}`;
  return `${EVENT_TYPES[booking.event_type ?? ''] ?? 'Event'} · ${spaceName(booking.space_id)}`;
}

export function BookingRow({
  booking,
  selected,
  onSelect,
}: {
  booking: Booking;
  selected: boolean;
  onSelect: () => void;
}) {
  const { spaceName, unitsOf } = useCatalog();
  const when =
    booking.kind === 'table'
      ? `${dayLabel(booking.starts_at)} · ${time(booking.starts_at)}`
      : `${dayLabel(booking.starts_at)} · ${timeRange(booking.starts_at, booking.ends_at)}`;
  return (
    <ListButton onSelect={onSelect} selected={selected}>
      <span className={styles.rowTop}>
        <span className={styles.rowTitle}>{bookingTitle(booking, spaceName)}</span>
        <StatusPill status={booking.status} />
      </span>
      <span className={`${styles.rowWhen} num`}>{when}</span>
      <span className={styles.rowBottom}>
        <span className={styles.rowWho}>{booking.customer?.name ?? phoneLocal(booking.phone)}</span>
        {booking.kind === 'space' ? <HutMap units={unitsOf(booking.space_id)} /> : null}
      </span>
    </ListButton>
  );
}
