'use client';

import { ChevronLeft, ChevronRight, Lock, LockOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';
import { bookingTitle } from '@/components/BookingRow';
import { useCatalog } from '@/components/CatalogContext';
import { HutMap, HutPicker } from '@/components/HutMap';
import { Button, Card, EmptyState, ErrorState, Field, Notice, Select, Skeleton, StatusPill } from '@/components/ui';
import { DetailBlank, Workspace } from '@/components/Workspace';
import { errorMessage } from '@/lib/errors';
import { addDays, longDayIso, time, timeRange, todayIso } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { BOOKING_SELECT, type BlockedTime, type Booking } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import styles from './calendar.module.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type MonthData = { bookings: Booking[]; blocks: BlockedTime[]; opensAt: string; closesAt: string };

function monthStart(month: string) {
  return `${month}-01`;
}

function shiftMonth(month: string, by: number): string {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// The days to draw: whole weeks, Monday first.
function gridDays(month: string): string[] {
  const first = new Date(`${month}-01T00:00:00Z`);
  const lead = (first.getUTCDay() + 6) % 7;
  const start = addDays(monthStart(month), -lead);
  const next = monthStart(shiftMonth(month, 1));
  const days: string[] = [];
  for (let day = start; day < next || days.length % 7 !== 0; day = addDays(day, 1)) days.push(day);
  return days;
}

export function CalendarWorkspace() {
  const today = todayIso();
  const [monthParam, setMonth] = useParam('month');
  const [selectedDay, setDay] = useParam('day');
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const { unitsOf } = useCatalog();

  const load = useLoad(async (): Promise<MonthData> => {
    const supabase = createClient();
    const from = `${monthStart(month)}T00:00:00Z`;
    const to = `${monthStart(shiftMonth(month, 1))}T00:00:00Z`;
    const [bookings, blocks, settings] = await Promise.all([
      supabase.from('bookings').select(BOOKING_SELECT).neq('status', 'cancelled').gte('starts_at', from).lt('starts_at', to).order('starts_at'),
      supabase.from('blocked_times').select('*').gte('starts_at', from).lt('starts_at', to).order('starts_at'),
      supabase.from('settings').select('opens_at, closes_at').single(),
    ]);
    const hours = rows<{ opens_at: string; closes_at: string }>(settings);
    return {
      bookings: rows<Booking[]>(bookings),
      blocks: rows<BlockedTime[]>(blocks),
      opensAt: hours.opens_at.slice(0, 5),
      closesAt: hours.closes_at.slice(0, 5),
    };
  }, month);

  const byDay = useMemo(() => {
    const map = new Map<string, { bookings: Booking[]; blocks: BlockedTime[]; units: Set<string> }>();
    const entry = (day: string) => {
      if (!map.has(day)) map.set(day, { bookings: [], blocks: [], units: new Set() });
      return map.get(day)!;
    };
    for (const booking of load.data?.bookings ?? []) {
      const day = entry(booking.starts_at.slice(0, 10));
      day.bookings.push(booking);
      if (booking.kind === 'space') unitsOf(booking.space_id).forEach((unit) => day.units.add(unit));
    }
    for (const block of load.data?.blocks ?? []) {
      const day = entry(block.starts_at.slice(0, 10));
      day.blocks.push(block);
      unitsOf(block.space_id).forEach((unit) => day.units.add(unit));
    }
    return map;
  }, [load.data, unitsOf]);

  const toolbar = (
    <div className={styles.monthBar}>
      <Button aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} size="small" variant="quiet">
        <ChevronLeft aria-hidden="true" size={20} />
      </Button>
      <h2 className={styles.monthName}>{monthLabel(month)}</h2>
      <Button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} size="small" variant="quiet">
        <ChevronRight aria-hidden="true" size={20} />
      </Button>
    </div>
  );

  let grid: React.ReactNode;
  if (load.error && !load.data) {
    grid = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data || load.loading) {
    grid = <Skeleton height={380} />;
  } else {
    grid = (
      <>
        <div className={styles.grid} aria-label={monthLabel(month)} role="group">
          {WEEKDAYS.map((name) => (
            <span className={styles.weekday} aria-hidden="true" key={name}>
              {name}
            </span>
          ))}
          {gridDays(month).map((day) => {
            const info = byDay.get(day);
            const outside = !day.startsWith(month);
            const count = info?.bookings.length ?? 0;
            return (
              <button
                aria-current={day === today ? 'date' : undefined}
                aria-label={`${longDayIso(day)}: ${count} ${count === 1 ? 'booking' : 'bookings'}${info?.blocks.length ? ', has blocked time' : ''}`}
                aria-pressed={day === selectedDay}
                className={styles.day}
                data-outside={outside || undefined}
                key={day}
                onClick={() => setDay(day)}
                type="button"
              >
                <span className={`${styles.dayNumber} num`}>{Number(day.slice(8))}</span>
                {info ? <HutMap size="mini" units={[...info.units]} /> : null}
                {count > 0 ? <span className={`${styles.dayCount} num`}>{count}</span> : null}
              </button>
            );
          })}
        </div>
        <p className={styles.legend}>
          Lit huts are taken for part of that day. The number is how many bookings, including tables.
        </p>
      </>
    );
  }

  return (
    <Workspace
      backLabel="Back to the month"
      detail={
        selectedDay && load.data ? (
          <DayDetail
            blocks={byDay.get(selectedDay)?.blocks ?? []}
            bookings={byDay.get(selectedDay)?.bookings ?? []}
            closesAt={load.data.closesAt}
            day={selectedDay}
            onChanged={load.reload}
            opensAt={load.data.opensAt}
          />
        ) : (
          <DetailBlank>
            <p>Choose a day to see its bookings and to block a time.</p>
          </DetailBlank>
        )
      }
      hasSelection={Boolean(selectedDay)}
      list={grid}
      onBack={() => setDay(null)}
      title="Calendar"
      toolbar={toolbar}
    />
  );
}

function DayDetail({
  day,
  bookings,
  blocks,
  opensAt,
  closesAt,
  onChanged,
}: {
  day: string;
  bookings: Booking[];
  blocks: BlockedTime[];
  opensAt: string;
  closesAt: string;
  onChanged: () => void;
}) {
  const { spaceName, unitsOf } = useCatalog();
  const [blocking, setBlocking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const past = day < todayIso();

  const items = [
    ...bookings.map((booking) => ({ at: booking.starts_at, kind: 'booking' as const, booking })),
    ...blocks.map((block) => ({ at: block.starts_at, kind: 'block' as const, block })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className={styles.dayDetail}>
      <header className={styles.dayHead}>
        <h2>{longDayIso(day)}</h2>
        {!past && !blocking ? (
          <Button icon={<Plus aria-hidden="true" size={20} />} onClick={() => setBlocking(true)} variant="gold">
            Block a time
          </Button>
        ) : null}
      </header>

      {message ? <Notice tone="success">{message}</Notice> : null}

      {blocking ? (
        <BlockForm
          closesAt={closesAt}
          day={day}
          onCancel={() => setBlocking(false)}
          onDone={(text) => {
            setBlocking(false);
            setMessage(text);
            onChanged();
          }}
          opensAt={opensAt}
        />
      ) : null}

      {items.length === 0 ? (
        <Card>
          <EmptyState
            body={past ? 'Nothing was booked or blocked on this day.' : 'Every hut is free all day. Block a time to keep a hut free.'}
            title="Nothing on this day"
          />
        </Card>
      ) : (
        <ul className={styles.dayList}>
          {items.map((item) =>
            item.kind === 'booking' ? (
              <li key={item.booking.id}>
                <Link className={styles.dayItem} href={`/?when=${dayWhen(day)}&id=${item.booking.id}`}>
                  <span className={`${styles.itemTime} num`}>
                    {item.booking.kind === 'table'
                      ? time(item.booking.starts_at)
                      : timeRange(item.booking.starts_at, item.booking.ends_at)}
                  </span>
                  <span className={styles.itemMain}>
                    <b>{bookingTitle(item.booking, spaceName)}</b>
                    <span className={styles.itemWho}>{item.booking.customer?.name ?? item.booking.reference}</span>
                  </span>
                  <span className={styles.itemSide}>
                    {item.booking.kind === 'space' ? <HutMap units={unitsOf(item.booking.space_id)} /> : null}
                    <StatusPill status={item.booking.status} />
                  </span>
                </Link>
              </li>
            ) : (
              <li key={`block-${item.block.id}`}>
                <BlockItem block={item.block} onChanged={onChanged} past={past} />
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function dayWhen(day: string): string {
  const today = todayIso();
  return day === today ? 'today' : day > today ? 'upcoming' : 'past';
}

function BlockItem({ block, past, onChanged }: { block: BlockedTime; past: boolean; onChanged: () => void }) {
  const { spaceName, unitsOf } = useCatalog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unblock = async () => {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc('admin_unblock_time', { p_block_id: block.id });
    setBusy(false);
    if (rpcError) {
      setError(errorMessage(rpcError, 'The time was not unblocked. Please try again.'));
      return;
    }
    onChanged();
  };

  return (
    <div className={`${styles.dayItem} ${styles.blockItem}`}>
      <span className={`${styles.itemTime} num`}>{timeRange(block.starts_at, block.ends_at)}</span>
      <span className={styles.itemMain}>
        <b>
          <Lock aria-hidden="true" size={16} /> Blocked · {spaceName(block.space_id)}
        </b>
        <span className={styles.itemWho}>{block.reason || 'No reason given'}</span>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </span>
      <span className={styles.itemSide}>
        <HutMap units={unitsOf(block.space_id)} />
        {!past ? (
          <Button icon={<LockOpen aria-hidden="true" size={16} />} loading={busy} onClick={unblock} size="small" variant="quiet">
            Unblock
          </Button>
        ) : null}
      </span>
    </div>
  );
}

function halfHours(from: string, to: string): string[] {
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const end = to === '00:00' ? 24 * 60 : toMinutes(to);
  const options: string[] = [];
  for (let minutes = toMinutes(from); minutes <= end; minutes += 30) {
    options.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }
  return options;
}

function BlockForm({
  day,
  opensAt,
  closesAt,
  onCancel,
  onDone,
}: {
  day: string;
  opensAt: string;
  closesAt: string;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const { spaceName } = useCatalog();
  const times = halfHours(opensAt, closesAt);
  const [space, setSpace] = useState('whole-venue');
  const [start, setStart] = useState(times[0]);
  const [end, setEnd] = useState(times[times.length - 1]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (end <= start) {
      setError('The end time must be after the start time.');
      return;
    }
    setBusy(true);
    const { error: rpcError } = await createClient().rpc('admin_block_time', {
      p_space_id: space === 'whole-venue' ? null : space,
      p_date: day,
      p_start_time: start,
      p_end_time: end,
      p_reason: reason.trim() || null,
    });
    setBusy(false);
    if (rpcError) {
      setError(errorMessage(rpcError, 'The time was not blocked. Please try again.'));
      return;
    }
    onDone(`${space === 'whole-venue' ? 'The whole venue' : spaceName(space)} is blocked from ${start} to ${end}.`);
  };

  return (
    <Card>
      <form className={styles.blockForm} noValidate onSubmit={submit}>
        <h3 className={styles.formTitle}>Block a time</h3>
        <p className={styles.formIntro}>Customers cannot book a blocked hut. Anything already booked stays booked.</p>
        <div className={styles.pickerField}>
          <span className={styles.pickerLabel}>Which huts</span>
          <HutPicker onChange={setSpace} value={space} />
        </div>
        <div className={styles.times}>
          <Select label="From" onChange={(event) => setStart(event.target.value)} value={start}>
            {times.slice(0, -1).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
          <Select label="Until" onChange={(event) => setEnd(event.target.value)} value={end}>
            {times.slice(1).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </div>
        <Field
          hint="Only you see this."
          label="Reason (optional)"
          maxLength={200}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Repairs, private event, staff training"
          value={reason}
        />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className={styles.formButtons}>
          <Button disabled={busy} onClick={onCancel} variant="quiet">
            Cancel
          </Button>
          <Button icon={<Lock aria-hidden="true" size={18} />} loading={busy} type="submit" variant="gold">
            Block this time
          </Button>
        </div>
      </form>
    </Card>
  );
}
