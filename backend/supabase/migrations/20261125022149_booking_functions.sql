-- The booking rules. The app calls the public functions below (as RPCs); they
-- are the only way bookings change. They run as their owner so they can write
-- tables customers cannot, which is why each one first checks who is calling
-- (auth.uid()) and only touches that customer's bookings. Prices, deposits and
-- refunds are always worked out here, never taken from the app.
--
-- Errors are raised with the message to show in the app and, in HINT, the
-- app's error code (invalid_booking, slot_unavailable, invalid_state, ...).

-- ---------------------------------------------------------------------------
-- Helpers (private schema: not reachable from the app)
-- ---------------------------------------------------------------------------
create function private.app_error(p_code text, p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_message, hint = p_code;
end;
$$;

-- A venue date and time ('YYYY-MM-DD', 'HH:mm') as a point in time.
create function private.venue_time(p_date date, p_time time)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select (p_date + p_time) at time zone 'Africa/Accra';
$$;

create function private.settings()
returns public.settings
language sql
stable
set search_path = ''
as $$
  select * from public.settings where id;
$$;

create function private.require_customer()
returns public.profiles
language plpgsql
stable
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = (select auth.uid());
  if not found then
    perform private.app_error('not_signed_in', 'Please sign in to continue.');
  end if;
  return v_profile;
end;
$$;

-- One of the caller's own bookings. Other people's bookings are "not found".
create function private.own_booking(p_booking_id uuid, p_lock boolean)
returns public.bookings
language plpgsql
set search_path = ''
as $$
declare
  v_customer public.profiles := private.require_customer();
  v_booking public.bookings;
begin
  if p_lock then
    select * into v_booking from public.bookings
    where id = p_booking_id and customer_id = v_customer.id
    for update;
  else
    select * into v_booking from public.bookings
    where id = p_booking_id and customer_id = v_customer.id;
  end if;
  if not found then
    perform private.app_error('not_found', 'We could not find that booking.');
  end if;
  return v_booking;
end;
$$;

create function private.new_reference()
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_reference text;
begin
  loop
    select 'JTK-' || string_agg(substr(v_alphabet, 1 + floor(random() * 32)::integer, 1), '')
    into v_reference
    from generate_series(1, 6);
    exit when not exists (select 1 from public.bookings where reference = v_reference);
  end loop;
  return v_reference;
end;
$$;

-- Releases unpaid holds whose 10 minutes have run out. Runs every minute, and
-- before any booking is made, so a stale hold never blocks anyone.
create function private.expire_holds()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bookings
  set status = 'cancelled', cancelled_at = hold_expires_at, cancelled_by = 'hold_expired'
  where status = 'pending_payment' and hold_expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Marks confirmed bookings whose time has passed as completed.
create function private.complete_finished_bookings()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bookings set status = 'completed'
  where status = 'confirmed' and ends_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Opening hours as people say them, like "10am and 11pm".
create function private.hours_text(p_settings public.settings)
returns text
language sql
stable
set search_path = ''
as $$
  select lower(to_char(p_settings.opens_at, 'FMHH12am')) || ' and '
      || lower(to_char(p_settings.closes_at, 'FMHH12am'));
$$;

-- The same checks the app makes before showing a price.
create function private.check_space_times(
  p_space public.spaces,
  p_date date,
  p_start time,
  p_end time,
  p_settings public.settings
)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_date is null or p_start is null or p_end is null then
    perform private.app_error('invalid_booking', 'Choose a valid date and time.');
  end if;
  if private.venue_time(p_date, p_start) <= now() then
    perform private.app_error('invalid_booking', 'Choose a date and time that has not passed.');
  end if;
  if p_end <= p_start then
    perform private.app_error('invalid_booking', 'The end time must be after the start time.');
  end if;
  if p_start < p_settings.opens_at or p_end > p_settings.closes_at then
    perform private.app_error('invalid_booking',
      format('Choose times between %s.', private.hours_text(p_settings)));
  end if;
  if p_end - p_start < make_interval(hours => p_space.min_hours) then
    perform private.app_error('invalid_booking',
      format('%s has a minimum of %s hours.', p_space.name, p_space.min_hours));
  end if;
end;
$$;

-- What a cancellation would refund now, split into the booking itself and any
-- paid catering. Mirrors lib/refunds.ts in the app.
create function private.refund_amounts(
  p_booking public.bookings,
  p_cancelled_by text,
  out venue numeric,
  out catering numeric
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_settings public.settings := private.settings();
  v_rate numeric;
  v_days integer;
begin
  venue := 0;
  catering := 0;
  if p_booking.status <> 'confirmed' then
    return;
  end if;

  if p_booking.kind = 'table' then
    if p_booking.amount_paid > 0 and (
      p_cancelled_by = 'joteku'
      or extract(epoch from p_booking.starts_at - now()) / 3600 >= v_settings.table_full_refund_hours
    ) then
      venue := p_booking.amount_paid;
    end if;
    return;
  end if;

  if p_cancelled_by = 'joteku' then
    v_rate := 1;
  else
    v_days := floor(extract(epoch from p_booking.starts_at - now()) / 86400);
    select t.refund_rate into v_rate
    from public.refund_tiers t
    where t.min_days_before <= v_days
    order by t.min_days_before desc
    limit 1;
    v_rate := coalesce(v_rate, 0);
  end if;

  if p_booking.amount_paid > 0 then
    venue := round(p_booking.amount_paid * v_rate, 2);
  end if;
  select coalesce(round(c.quote_amount * v_rate, 2), 0) into catering
  from public.catering_requests c
  where c.booking_id = p_booking.id and c.status = 'paid';
  catering := coalesce(catering, 0);
end;
$$;

-- Records a refund of part or all of a payment, back to the number that paid.
-- The mock payment provider returns money at once; a real one will confirm later.
create function private.record_refund(
  p_booking public.bookings,
  p_payment_id uuid,
  p_amount numeric,
  p_description text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_amount <= 0 or p_payment_id is null then
    return;
  end if;
  insert into public.payments (
    booking_id, customer_id, type, purpose, status, amount, phone, network,
    description, refund_of, completed_at
  )
  select p_booking.id, p_booking.customer_id, 'refund', p.purpose, 'success', p_amount, p.phone,
    p.network, p_description, p.id, now()
  from public.payments p
  where p.id = p_payment_id and p.status = 'success';
end;
$$;

revoke execute on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public functions (the app calls these)
-- ---------------------------------------------------------------------------

-- Busy times for a space's calendar, day by day, without saying whose they
-- are. Includes other bookings that take the same huts and admin blocks.
-- Times are 'HH:mm'; a busy period running to midnight ends at '24:00'.
create function public.get_busy_slots(
  p_space_id text,
  p_from date,
  p_to date,
  p_ignore_booking_id uuid default null
)
returns table (date date, start_time text, end_time text)
language sql
stable
security definer
set search_path = ''
as $$
  with claims as (
    select distinct c.during
    from private.slot_claims c
    left join public.bookings b on b.id = c.booking_id
    where c.unit in (select su.unit from public.space_units su where su.space_id = p_space_id)
      and p_to >= p_from
      and p_to - p_from <= 400
      and c.during && tstzrange(private.venue_time(p_from, '00:00'), private.venue_time(p_to + 1, '00:00'))
      and (
        c.block_id is not null
        or (
          c.booking_id is distinct from p_ignore_booking_id
          and (b.status = 'confirmed' or (b.status = 'pending_payment' and b.hold_expires_at > now()))
        )
      )
  ),
  pieces as (
    select
      d::date as day,
      greatest(lower(c.during), private.venue_time(d::date, '00:00')) as piece_start,
      least(upper(c.during), private.venue_time(d::date + 1, '00:00')) as piece_end
    from claims c
    cross join lateral generate_series(
      (lower(c.during) at time zone 'Africa/Accra')::date,
      ((upper(c.during) - interval '1 microsecond') at time zone 'Africa/Accra')::date,
      interval '1 day'
    ) as d
  )
  select distinct
    p.day,
    to_char(p.piece_start at time zone 'Africa/Accra', 'HH24:MI'),
    case
      when p.piece_end = private.venue_time(p.day + 1, '00:00') then '24:00'
      else to_char(p.piece_end at time zone 'Africa/Accra', 'HH24:MI')
    end
  from pieces p
  where p.day between p_from and p_to
  order by 1, 2;
$$;

-- Starts an event booking: checks it, prices it and holds the slot for the
-- payment. Fails with slot_unavailable if the time was taken meanwhile.
create function public.create_space_booking(
  p_event_type text,
  p_space_id text,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_guest_count integer,
  p_notes text default null,
  p_decoration_id text default null,
  p_catering_details text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := private.require_customer();
  v_settings public.settings := private.settings();
  v_space public.spaces;
  v_decoration public.decoration_packages;
  v_hours integer;
  v_venue_hire numeric;
  v_decoration_amount numeric := 0;
  v_catering text := nullif(btrim(p_catering_details), '');
  v_booking public.bookings;
begin
  if p_event_type is null
    or p_event_type not in ('wedding', 'engagement', 'birthday', 'other_reception', 'meeting') then
    perform private.app_error('invalid_booking', 'Choose the type of event.');
  end if;
  select * into v_space from public.spaces where id = p_space_id and active;
  if not found then
    perform private.app_error('invalid_booking', 'Choose a space to book.');
  end if;
  perform private.check_space_times(v_space, p_date, p_start_time, p_end_time, v_settings);
  if p_guest_count is null or p_guest_count < 1 then
    perform private.app_error('invalid_booking', 'Enter the number of guests.');
  end if;
  if v_space.max_guests is not null and p_guest_count > v_space.max_guests then
    perform private.app_error('invalid_booking',
      format('%s fits up to %s guests.', v_space.name, v_space.max_guests));
  end if;
  if p_decoration_id is not null then
    select * into v_decoration from public.decoration_packages where id = p_decoration_id and active;
    if not found then
      perform private.app_error('invalid_booking', 'Choose a decoration package.');
    end if;
    v_decoration_amount := v_decoration.price;
  end if;

  -- Venue hire is charged for each started hour, and never less than the minimum.
  v_hours := greatest(v_space.min_hours, ceil(extract(epoch from p_end_time - p_start_time) / 3600)::integer);
  v_venue_hire := round(v_space.hourly_rate * v_hours, 2);

  perform private.expire_holds();
  begin
    insert into public.bookings (
      reference, kind, customer_id, phone, hold_expires_at, starts_at, ends_at, amount_due,
      event_type, space_id, guest_count, notes, decoration_id, venue_hire_amount, decoration_amount
    ) values (
      private.new_reference(), 'space', v_customer.id, v_customer.phone,
      now() + make_interval(mins => v_settings.hold_minutes),
      private.venue_time(p_date, p_start_time), private.venue_time(p_date, p_end_time),
      v_venue_hire + v_decoration_amount,
      p_event_type, v_space.id, p_guest_count, nullif(btrim(p_notes), ''), p_decoration_id,
      v_venue_hire, v_decoration_amount
    )
    returning * into v_booking;
  exception
    when exclusion_violation then
      perform private.app_error('slot_unavailable',
        'Sorry, that time is no longer available. Please choose another time.');
  end;

  if v_catering is not null then
    insert into public.catering_requests (booking_id, details) values (v_booking.id, v_catering);
  end if;
  return v_booking;
end;
$$;

-- Starts a table reservation with an optional pre-order, and holds it for the
-- deposit payment. p_pre_order is a list of {"itemId": "...", "quantity": 2}.
create function public.create_table_reservation(
  p_date date,
  p_time time,
  p_party_size integer,
  p_pre_order jsonb default '[]'::jsonb
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := private.require_customer();
  v_settings public.settings := private.settings();
  v_lines jsonb := coalesce(p_pre_order, '[]'::jsonb);
  v_requested integer;
  v_found integer;
  v_total numeric;
  v_deposit numeric;
  v_booking public.bookings;
begin
  if p_date is null or p_time is null then
    perform private.app_error('invalid_booking', 'Choose a valid date and time.');
  end if;
  if private.venue_time(p_date, p_time) <= now() then
    perform private.app_error('invalid_booking', 'Choose a date and time that has not passed.');
  end if;
  if p_time < v_settings.opens_at
    or p_time > v_settings.closes_at - make_interval(mins => v_settings.last_table_before_close_minutes) then
    perform private.app_error('invalid_booking',
      format('Choose a time between %s.', private.hours_text(v_settings)));
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 200 then
    perform private.app_error('invalid_booking', 'Enter the number of people.');
  end if;
  if jsonb_typeof(v_lines) <> 'array' then
    perform private.app_error('invalid_booking', 'One of the pre-order items is not available.');
  end if;

  -- Every line must name an available item once, with a whole quantity of 1 to 99.
  select count(*), count(distinct line ->> 'itemId')
  into v_requested, v_found
  from jsonb_array_elements(v_lines) as line;
  if v_requested <> v_found or exists (
    select 1
    from jsonb_array_elements(v_lines) as line
    left join public.menu_items m on m.id = line ->> 'itemId' and m.available
    where m.id is null
      or jsonb_typeof(line -> 'quantity') <> 'number'
      or (line ->> 'quantity')::numeric not in (select generate_series(1, 99))
  ) then
    perform private.app_error('invalid_booking', 'One of the pre-order items is not available.');
  end if;

  select coalesce(round(sum(m.price * (line ->> 'quantity')::integer), 2), 0)
  into v_total
  from jsonb_array_elements(v_lines) as line
  join public.menu_items m on m.id = line ->> 'itemId';

  -- Deposit: a share of the pre-order, or a flat amount without one.
  v_deposit := case
    when v_total <= 0 then v_settings.table_deposit_flat
    else round(v_total * v_settings.table_deposit_rate, 2)
  end;

  insert into public.bookings (
    reference, kind, customer_id, phone, hold_expires_at, starts_at, ends_at, amount_due,
    party_size, pre_order_total, balance_at_venue
  ) values (
    private.new_reference(), 'table', v_customer.id, v_customer.phone,
    now() + make_interval(mins => v_settings.hold_minutes),
    private.venue_time(p_date, p_time),
    private.venue_time(p_date, p_time) + make_interval(mins => v_settings.table_visit_minutes),
    v_deposit, p_party_size, v_total, greatest(v_total - v_deposit, 0)
  )
  returning * into v_booking;

  insert into public.booking_pre_order_lines (booking_id, item_id, name, unit_price, quantity)
  select v_booking.id, m.id, m.name, m.price, (line ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line
  join public.menu_items m on m.id = line ->> 'itemId';

  return v_booking;
end;
$$;

-- Gives up an unpaid hold, for example when the customer leaves the pay screen.
create function public.release_hold(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.own_booking(p_booking_id, true);
begin
  if v_booking.status = 'pending_payment' then
    update public.bookings
    set status = 'cancelled', cancelled_at = now(), cancelled_by = 'customer'
    where id = v_booking.id;
  end if;
end;
$$;

-- Starts the hold again so the customer can retry paying. A released or
-- expired booking that was never paid comes back if its slot is still free.
create function public.restart_hold(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.settings := private.settings();
  v_booking public.bookings;
begin
  perform private.expire_holds();
  v_booking := private.own_booking(p_booking_id, true);
  if v_booking.starts_at <= now() then
    perform private.app_error('invalid_state', 'This booking can no longer be paid for.');
  end if;

  if v_booking.status = 'pending_payment' then
    update public.bookings
    set hold_expires_at = now() + make_interval(mins => v_settings.hold_minutes)
    where id = v_booking.id
    returning * into v_booking;
    return v_booking;
  end if;

  if v_booking.status <> 'cancelled' or v_booking.amount_paid > 0 or v_booking.refunded_amount > 0 then
    perform private.app_error('invalid_state', 'This booking can no longer be paid for.');
  end if;
  begin
    update public.bookings
    set status = 'pending_payment',
        hold_expires_at = now() + make_interval(mins => v_settings.hold_minutes),
        cancelled_at = null,
        cancelled_by = null
    where id = v_booking.id
    returning * into v_booking;
  exception
    when exclusion_violation then
      perform private.app_error('slot_unavailable',
        'Sorry, that time is no longer available. Please choose another time.');
  end;
  return v_booking;
end;
$$;

-- Whether the booking can be cancelled now, and how much would come back.
create function public.get_cancellation_quote(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.own_booking(p_booking_id, false);
  v_refund record;
begin
  select * into v_refund from private.refund_amounts(v_booking, 'customer');
  return jsonb_build_object(
    'cancellable', v_booking.status in ('pending_payment', 'confirmed'),
    'refundAmount', v_refund.venue + v_refund.catering
  );
end;
$$;

-- Cancels the caller's booking and refunds what the policy allows, to the
-- same mobile money number that paid.
create function public.cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.own_booking(p_booking_id, true);
  v_refund record;
  v_catering_payment uuid;
begin
  if v_booking.status not in ('pending_payment', 'confirmed') then
    perform private.app_error('invalid_state', 'This booking cannot be cancelled.');
  end if;
  select * into v_refund from private.refund_amounts(v_booking, 'customer');

  perform private.record_refund(v_booking, v_booking.payment_id, v_refund.venue,
    'Refund for ' || v_booking.reference);
  select c.payment_id into v_catering_payment
  from public.catering_requests c where c.booking_id = v_booking.id;
  perform private.record_refund(v_booking, v_catering_payment, v_refund.catering,
    'Catering refund for ' || v_booking.reference);

  update public.bookings
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = 'customer',
      refunded_amount = v_refund.venue + v_refund.catering,
      hold_expires_at = null
  where id = v_booking.id
  returning * into v_booking;

  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'refundAmount', v_refund.venue + v_refund.catering
  );
end;
$$;

-- The one date change an event booking allows: same space, same length, into
-- a free slot. The price does not change.
create function public.change_space_date(p_booking_id uuid, p_date date, p_start_time time)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.settings := private.settings();
  v_booking public.bookings := private.own_booking(p_booking_id, true);
  v_space public.spaces;
  v_length interval;
  v_end time;
begin
  if v_booking.kind <> 'space' or v_booking.status <> 'confirmed' then
    perform private.app_error('invalid_state', 'Only a confirmed event booking can change its date.');
  end if;
  if v_booking.date_change_used then
    perform private.app_error('invalid_state', 'This booking has already used its one date change.');
  end if;
  if p_date is null or p_start_time is null then
    perform private.app_error('invalid_booking', 'Choose a valid date and time.');
  end if;
  select * into v_space from public.spaces where id = v_booking.space_id;
  v_length := v_booking.ends_at - v_booking.starts_at;
  if p_start_time + v_length > v_settings.closes_at
    or private.venue_time(p_date, p_start_time) + v_length > private.venue_time(p_date + 1, '00:00') then
    perform private.app_error('invalid_booking',
      format('Choose times between %s.', private.hours_text(v_settings)));
  end if;
  v_end := p_start_time + v_length;
  perform private.check_space_times(v_space, p_date, p_start_time, v_end, v_settings);
  if private.venue_time(p_date, p_start_time) = v_booking.starts_at then
    perform private.app_error('invalid_booking', 'Choose a different date or time.');
  end if;

  perform private.expire_holds();
  begin
    update public.bookings
    set previous_starts_at = starts_at,
        starts_at = private.venue_time(p_date, p_start_time),
        ends_at = private.venue_time(p_date, p_start_time) + v_length,
        date_change_used = true,
        date_changed_at = now()
    where id = v_booking.id
    returning * into v_booking;
  exception
    when exclusion_violation then
      perform private.app_error('slot_unavailable',
        'Sorry, that time is no longer available. Please choose another time.');
  end;
  return v_booking;
end;
$$;

-- Only signed-in customers can book; anyone can see busy times.
revoke execute on function
  public.get_busy_slots(text, date, date, uuid),
  public.create_space_booking(text, text, date, time, time, integer, text, text, text),
  public.create_table_reservation(date, time, integer, jsonb),
  public.release_hold(uuid),
  public.restart_hold(uuid),
  public.get_cancellation_quote(uuid),
  public.cancel_booking(uuid),
  public.change_space_date(uuid, date, time)
from public, anon, authenticated;

grant execute on function public.get_busy_slots(text, date, date, uuid) to anon, authenticated;
grant execute on function
  public.create_space_booking(text, text, date, time, time, integer, text, text, text),
  public.create_table_reservation(date, time, integer, jsonb),
  public.release_hold(uuid),
  public.restart_hold(uuid),
  public.get_cancellation_quote(uuid),
  public.cancel_booking(uuid),
  public.change_space_date(uuid, date, time)
to authenticated;
