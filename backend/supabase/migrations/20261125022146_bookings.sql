-- Bookings, pre-orders, catering, payments and blocked times.
--
-- Customers can read only their own rows. They never write these tables
-- directly: every change goes through the functions in the next migration,
-- which check the rules and work out prices on the server.

-- ---------------------------------------------------------------------------
-- Bookings: event bookings ('space') and table reservations ('table').
-- Times are stored as timestamptz; venue time (Africa/Accra) is UTC.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^JTK-[A-HJ-NP-Z2-9]{6}$'),
  kind text not null check (kind in ('space', 'table')),
  customer_id uuid not null references public.profiles (id),
  -- The customer's number when they booked, as shown on receipts.
  phone text not null check (phone ~ '^\+233[0-9]{9}$'),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  -- While pending payment, the slot is held until this time.
  hold_expires_at timestamptz,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_due numeric(10, 2) not null check (amount_due >= 0),
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  refunded_amount numeric(10, 2) not null default 0 check (refunded_amount >= 0),
  payment_id uuid,
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('customer', 'joteku', 'hold_expired')),

  -- Event bookings
  event_type text
    check (event_type in ('wedding', 'engagement', 'birthday', 'other_reception', 'meeting')),
  space_id text references public.spaces (id),
  guest_count integer check (guest_count > 0),
  notes text check (char_length(notes) <= 1000),
  decoration_id text references public.decoration_packages (id),
  venue_hire_amount numeric(10, 2) check (venue_hire_amount >= 0),
  decoration_amount numeric(10, 2) check (decoration_amount >= 0),
  date_change_used boolean not null default false,
  previous_starts_at timestamptz,
  date_changed_at timestamptz,

  -- Table reservations
  party_size integer check (party_size > 0),
  pre_order_total numeric(10, 2) check (pre_order_total >= 0),
  balance_at_venue numeric(10, 2) check (balance_at_venue >= 0),

  constraint bookings_ends_after_start check (ends_at > starts_at),
  constraint bookings_pending_has_hold check (status <> 'pending_payment' or hold_expires_at is not null),
  constraint bookings_space_fields check (
    kind <> 'space' or (
      event_type is not null and space_id is not null and guest_count is not null
      and venue_hire_amount is not null and decoration_amount is not null
      and party_size is null and pre_order_total is null and balance_at_venue is null
    )
  ),
  constraint bookings_table_fields check (
    kind <> 'table' or (
      party_size is not null and pre_order_total is not null and balance_at_venue is not null
      and space_id is null and event_type is null and decoration_id is null
    )
  )
);

create index bookings_customer_id_starts_at_idx on public.bookings (customer_id, starts_at desc);
create index bookings_space_id_idx on public.bookings (space_id);
create index bookings_decoration_id_idx on public.bookings (decoration_id);
create index bookings_payment_id_idx on public.bookings (payment_id);
-- For the jobs that release unpaid holds and mark finished bookings completed.
create index bookings_pending_hold_idx on public.bookings (hold_expires_at)
  where status = 'pending_payment';
create index bookings_confirmed_ends_at_idx on public.bookings (ends_at)
  where status = 'confirmed';

-- Menu items ordered with a table reservation. Name and price are copied so
-- later menu changes do not change a past order.
create table public.booking_pre_order_lines (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  item_id text not null references public.menu_items (id),
  name text not null,
  unit_price numeric(10, 2) not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 99),
  primary key (booking_id, item_id)
);

create index booking_pre_order_lines_item_id_idx on public.booking_pre_order_lines (item_id);

-- Custom catering: requested with an event booking, priced by the admin later
-- and paid in the app with Pay Balance.
create table public.catering_requests (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  details text not null check (char_length(btrim(details)) between 1 and 1000),
  status text not null default 'requested' check (status in ('requested', 'quoted', 'paid')),
  quote_amount numeric(10, 2) check (quote_amount > 0),
  quoted_at timestamptz,
  payment_id uuid,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint catering_quote_when_quoted check (status = 'requested' or quote_amount is not null),
  constraint catering_payment_when_paid check (status <> 'paid' or payment_id is not null)
);

-- ---------------------------------------------------------------------------
-- Payments and refunds (the app's transaction history). Mobile money only.
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id),
  customer_id uuid not null references public.profiles (id),
  type text not null check (type in ('payment', 'refund')),
  purpose text not null check (purpose in ('space_booking', 'table_deposit', 'catering_balance')),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  amount numeric(10, 2) not null check (amount > 0),
  -- The mobile money number paid from, or refunded to.
  phone text not null check (phone ~ '^\+233[0-9]{9}$'),
  network text not null check (network in ('mtn', 'telecel', 'airteltigo')),
  description text not null,
  -- For a refund, the payment it returns money from.
  refund_of uuid references public.payments (id),
  -- Set by the real payment provider, once there is one.
  provider_reference text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint payments_refund_links_payment check ((type = 'refund') = (refund_of is not null))
);

create index payments_booking_id_idx on public.payments (booking_id);
create index payments_customer_id_created_at_idx on public.payments (customer_id, created_at desc);
create index payments_refund_of_idx on public.payments (refund_of);

alter table public.bookings
  add constraint bookings_payment_id_fkey foreign key (payment_id) references public.payments (id);
alter table public.catering_requests
  add constraint catering_requests_payment_id_fkey foreign key (payment_id) references public.payments (id);
create index catering_requests_payment_id_idx on public.catering_requests (payment_id);

-- ---------------------------------------------------------------------------
-- Times the admin blocks. No space means the whole venue.
-- ---------------------------------------------------------------------------
create table public.blocked_times (
  id bigint generated always as identity primary key,
  space_id text references public.spaces (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index blocked_times_space_id_idx on public.blocked_times (space_id);

-- ---------------------------------------------------------------------------
-- No double booking. Every hut a booking or block takes up, for its time, is
-- one claim. The database refuses two claims on the same hut whose times
-- overlap, so two people can never hold the same slot, even at the same instant.
-- Claims are kept in step with bookings and blocks by the triggers below.
-- ---------------------------------------------------------------------------
create table private.slot_claims (
  id bigint generated always as identity primary key,
  unit text not null,
  during tstzrange not null,
  booking_id uuid references public.bookings (id) on delete cascade,
  block_id bigint references public.blocked_times (id) on delete cascade,
  constraint slot_claims_one_owner check (num_nonnulls(booking_id, block_id) = 1),
  constraint slot_claims_no_overlap exclude using gist (unit with =, during with &&)
);

create index slot_claims_booking_id_idx on private.slot_claims (booking_id);
create index slot_claims_block_id_idx on private.slot_claims (block_id);

alter table private.slot_claims enable row level security;

-- An event booking takes its huts while it is pending payment or confirmed.
-- Releasing, expiring or cancelling the booking frees them.
create function private.sync_booking_claims()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.slot_claims where booking_id = new.id;
  if new.kind = 'space' and new.status in ('pending_payment', 'confirmed') then
    insert into private.slot_claims (unit, during, booking_id)
    select su.unit, tstzrange(new.starts_at, new.ends_at, '[)'), new.id
    from public.space_units su
    where su.space_id = new.space_id;
  end if;
  return null;
end;
$$;

create trigger bookings_sync_claims
  after insert or update of status, starts_at, ends_at, space_id on public.bookings
  for each row execute function private.sync_booking_claims();

create function private.sync_block_claims()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    return null;  -- the claims go with the block (on delete cascade)
  end if;
  delete from private.slot_claims where block_id = new.id;
  insert into private.slot_claims (unit, during, block_id)
  select distinct su.unit, tstzrange(new.starts_at, new.ends_at, '[)'), new.id
  from public.space_units su
  where new.space_id is null or su.space_id = new.space_id;
  return null;
end;
$$;

create trigger blocked_times_sync_claims
  after insert or update or delete on public.blocked_times
  for each row execute function private.sync_block_claims();

revoke execute on function private.sync_booking_claims() from public, anon, authenticated;
revoke execute on function private.sync_block_claims() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifications are built in the app from bookings and payments; only which
-- ones a customer has read is stored.
-- ---------------------------------------------------------------------------
create table public.notification_reads (
  customer_id uuid not null references public.profiles (id) on delete cascade,
  notification_id text not null check (char_length(notification_id) <= 200),
  read_at timestamptz not null default now(),
  primary key (customer_id, notification_id)
);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
alter table public.bookings enable row level security;
alter table public.booking_pre_order_lines enable row level security;
alter table public.catering_requests enable row level security;
alter table public.payments enable row level security;
alter table public.blocked_times enable row level security;
alter table public.notification_reads enable row level security;

grant select on
  public.bookings,
  public.booking_pre_order_lines,
  public.catering_requests,
  public.payments,
  public.notification_reads
to authenticated;
grant insert on public.notification_reads to authenticated;

create policy "Customers can read their own bookings" on public.bookings
  for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers can read the pre-orders of their own bookings" on public.booking_pre_order_lines
  for select to authenticated
  using (booking_id in (select b.id from public.bookings b where b.customer_id = (select auth.uid())));

create policy "Customers can read the catering requests of their own bookings" on public.catering_requests
  for select to authenticated
  using (booking_id in (select b.id from public.bookings b where b.customer_id = (select auth.uid())));

create policy "Customers can read their own payments and refunds" on public.payments
  for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers can read which notifications they have read" on public.notification_reads
  for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers can mark their own notifications as read" on public.notification_reads
  for insert to authenticated
  with check ((select auth.uid()) = customer_id);

-- blocked_times has no customer policies: the app sees blocks only as busy
-- times, through get_busy_slots.
