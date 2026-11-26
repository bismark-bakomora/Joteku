-- Checks the booking rules and access rules against a real database.
--
-- Everything runs in one block that always ends by raising an exception, so
-- every test booking and test customer is rolled back. Run it with
-- `npm test` (dev project only). It prints "JOTEKU TESTS PASSED (n checks)"
-- or the first check that failed.

create function pg_temp.check(p_ok boolean, p_name text)
returns void
language plpgsql
as $$
begin
  if p_ok is distinct from true then
    raise exception 'JOTEKU TEST FAILED: %', p_name;
  end if;
  perform set_config('joteku.checks', (coalesce(nullif(current_setting('joteku.checks', true), ''), '0')::integer + 1)::text, true);
end;
$$;

-- Runs p_sql and checks it fails with the app error code (HINT) or SQLSTATE given.
create function pg_temp.check_fails(p_sql text, p_expected text, p_name text)
returns void
language plpgsql
as $$
declare
  v_hint text;
  v_state text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_state = returned_sqlstate;
    perform pg_temp.check(v_hint = p_expected or v_state = p_expected,
      format('%s (got %s / %s)', p_name, v_hint, v_state));
    return;
  end;
  perform pg_temp.check(false, p_name || ' (it did not fail)');
end;
$$;

-- Acts as a signed-in customer, as the app does, or as a visitor (null).
create function pg_temp.act_as(p_user uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'none', true);
  if p_user is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
  end if;
end;
$$;

-- Back to the database owner, to set up test situations.
create function pg_temp.act_as_owner()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

do $$
declare
  v_ama uuid := gen_random_uuid();
  v_kofi uuid := gen_random_uuid();
  d date := current_date + 30;           -- a date well ahead
  b public.bookings;
  b2 public.bookings;
  v_count integer;
  v_json jsonb;
  v_payment uuid;
  p public.payments;
begin
  perform set_config('joteku.checks', '0', true);

  -- Two customers sign in with their phones; profiles are created for them.
  insert into auth.users (id, phone, aud, role) values
    (v_ama, '233200000901', 'authenticated', 'authenticated'),
    (v_kofi, '233200000902', 'authenticated', 'authenticated');
  perform pg_temp.check((select phone from public.profiles where id = v_ama) = '+233200000901',
    'a profile is created with the number in +233 form');
  perform pg_temp.check((select is_guest from public.profiles where id = v_ama), 'a new profile is a guest');

  -- ---------------------------------------------------------------- browsing
  perform pg_temp.act_as(null);
  perform pg_temp.check((select count(*) from public.spaces) = 5, 'visitors see the 5 spaces');
  perform pg_temp.check((select count(*) from public.menu_items) = 16, 'visitors see the 16 menu items');
  perform pg_temp.check((select hold_minutes from public.settings) = 10, 'visitors see the settings');
  perform pg_temp.check_fails('select * from public.bookings', '42501', 'visitors cannot read bookings');
  perform pg_temp.check_fails('select * from public.profiles', '42501', 'visitors cannot read profiles');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-1'', %L, ''12:00'', ''14:00'', 10)', d),
    '42501', 'visitors cannot book');

  -- ---------------------------------------------------- booking and pricing
  perform pg_temp.act_as(v_ama);
  b := public.create_space_booking('birthday', 'hut-1', d, '12:00', '14:00', 10);
  perform pg_temp.check(b.status = 'pending_payment', 'a new booking waits for payment');
  perform pg_temp.check(b.amount_due = 300, 'Hut 1 for 2 hours costs 300');
  perform pg_temp.check(b.hold_expires_at between now() + interval '9 minutes' and now() + interval '11 minutes',
    'the slot is held for 10 minutes');
  perform pg_temp.check(b.reference ~ '^JTK-[A-HJ-NP-Z2-9]{6}$', 'the reference looks like JTK-XXXXXX');
  perform pg_temp.check(b.phone = '+233200000901', 'the booking keeps the customer''s number');

  b2 := public.create_space_booking('meeting', 'hut-2', d, '12:00', '14:30', 5, null, 'standard', 'Jollof for 5');
  perform pg_temp.check(b2.venue_hire_amount = 450 and b2.decoration_amount = 2500 and b2.amount_due = 2950,
    'started hours are charged in full, plus decoration (450 + 2,500)');
  perform pg_temp.check((select status from public.catering_requests where booking_id = b2.id) = 'requested',
    'a catering request is saved with the booking');

  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-3'', %L, ''12:00'', ''14:00'', 10)', d + 5),
    'invalid_booking', 'Hut 3 needs at least 3 hours');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-1'', %L, ''12:00'', ''14:00'', 25)', d + 5),
    'invalid_booking', 'Hut 1 fits only 20 guests');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-1'', %L, ''09:00'', ''12:00'', 10)', d + 5),
    'invalid_booking', 'bookings stay within opening hours');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-1'', %L, ''12:00'', ''14:00'', 10)', current_date - 1),
    'invalid_booking', 'past dates cannot be booked');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''party'', ''hut-1'', %L, ''12:00'', ''14:00'', 10)', d + 5),
    'invalid_booking', 'the event type must be one of the five');

  -- ------------------------------------------------------ no double booking
  perform pg_temp.act_as(v_kofi);
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-1'', %L, ''13:00'', ''15:00'', 10)', d),
    'slot_unavailable', 'an overlapping time in the same hut is refused');
  perform pg_temp.check((public.create_space_booking('birthday', 'hut-1', d, '14:00', '16:00', 10)).status = 'pending_payment',
    'a booking that starts when the last one ends is fine');
  perform pg_temp.check((public.create_space_booking('birthday', 'hut-4', d, '12:00', '15:00', 10)).status = 'pending_payment',
    'another hut at the same time is fine');
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''wedding'', ''whole-venue'', %L, ''10:00'', ''15:00'', 150)', d),
    'slot_unavailable', 'the whole venue clashes with a booked hut');
  perform pg_temp.check((public.create_space_booking('wedding', 'whole-venue', d + 1, '10:00', '15:00', 150)).amount_due = 7500,
    'the whole venue for 5 hours costs 7,500');
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-3'', %L, ''12:00'', ''15:00'', 10)', d + 1),
    'slot_unavailable', 'every hut clashes with a whole-venue booking');

  -- --------------------------------------------------------- calendar view
  perform pg_temp.act_as(null);
  select count(*) into v_count from public.get_busy_slots('hut-1', d, d);
  perform pg_temp.check(v_count = 2, 'Hut 1 shows two busy times that day');
  perform pg_temp.check(exists (select 1 from public.get_busy_slots('hut-1', d, d) s
    where s.start_time = '12:00' and s.end_time = '14:00'), 'busy times are shown as HH:mm');
  select count(*) into v_count from public.get_busy_slots('whole-venue', d, d);
  perform pg_temp.check(v_count = 4, 'the whole venue shows the busy times of every hut');
  select count(*) into v_count from public.get_busy_slots('hut-1', d, d, b.id);
  perform pg_temp.check(v_count = 1, 'a booking can leave itself out (for changing its date)');

  -- ------------------------------------------------------- holds expiring
  perform pg_temp.act_as_owner();
  update public.bookings set hold_expires_at = now() - interval '1 minute' where id = b.id;
  perform pg_temp.act_as(v_kofi);
  select count(*) into v_count from public.get_busy_slots('hut-1', d, d);
  perform pg_temp.check(v_count = 1, 'an expired hold no longer shows as busy');
  b2 := public.create_space_booking('birthday', 'hut-1', d, '12:00', '14:00', 8);
  perform pg_temp.check(b2.status = 'pending_payment', 'an expired hold does not block the next customer');
  perform pg_temp.act_as_owner();
  perform pg_temp.check((select status = 'cancelled' and cancelled_by = 'hold_expired' from public.bookings where id = b.id),
    'the expired booking is released');

  perform pg_temp.act_as(v_ama);
  perform pg_temp.check_fails(format('select public.restart_hold(%L)', b.id),
    'slot_unavailable', 'a released booking cannot come back once its time is taken');

  perform pg_temp.act_as(v_kofi);
  perform public.release_hold(b2.id);
  perform pg_temp.check((select status from public.bookings where id = b2.id) = 'cancelled',
    'leaving the pay screen releases the hold');
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.restart_hold(b.id)).status = 'pending_payment',
    'a released booking comes back when its time is free again');

  -- ------------------------------------------------- customers stay private
  perform pg_temp.act_as(v_kofi);
  perform pg_temp.check(not exists (select 1 from public.bookings where id = b.id),
    'a customer cannot see someone else''s booking');
  perform pg_temp.check_fails(format('select public.cancel_booking(%L)', b.id),
    'not_found', 'a customer cannot cancel someone else''s booking');
  perform pg_temp.check_fails(format('select public.release_hold(%L)', b.id),
    'not_found', 'a customer cannot release someone else''s hold');
  perform pg_temp.check_fails(
    format('insert into public.bookings (reference, kind, customer_id, phone, hold_expires_at, starts_at, ends_at, amount_due, event_type, space_id, guest_count, venue_hire_amount, decoration_amount) values (''JTK-AAAAAA'', ''space'', %L, ''+233200000902'', now(), now() + interval ''1 day'', now() + interval ''1 day 2 hours'', 1, ''birthday'', ''hut-2'', 5, 1, 0)', v_kofi),
    '42501', 'customers cannot write bookings directly (and so cannot set their own price)');

  -- ---------------------------------------------------------------- profile
  perform pg_temp.act_as(v_ama);
  update public.profiles set name = 'Ama Mensah' where id = v_ama;
  perform pg_temp.check((select not is_guest from public.profiles where id = v_ama), 'giving a name makes an account');
  perform pg_temp.check_fails(format('update public.profiles set phone = ''+233200000999'' where id = %L', v_ama),
    '42501', 'a customer cannot change their phone number');
  update public.profiles set name = 'Someone else' where id = v_kofi;
  perform pg_temp.act_as_owner();
  perform pg_temp.check((select name is null from public.profiles where id = v_kofi),
    'a customer cannot change someone else''s profile');

  -- ------------------------------------------------------ table reservations
  perform pg_temp.act_as(v_ama);
  b2 := public.create_table_reservation(d, '19:00', 4);
  perform pg_temp.check(b2.amount_due = 50 and b2.balance_at_venue = 0, 'no pre-order: a flat 50 deposit');
  b2 := public.create_table_reservation(d, '19:00', 4,
    '[{"itemId": "jollof-grilled-tilapia", "quantity": 2}, {"itemId": "club-beer-large", "quantity": 2}]');
  perform pg_temp.check(b2.pre_order_total = 200 and b2.amount_due = 100 and b2.balance_at_venue = 100,
    'with a pre-order: half the total as deposit, the rest at the venue');
  perform pg_temp.check((select count(*) from public.booking_pre_order_lines where booking_id = b2.id) = 2,
    'the pre-order lines are saved with the reservation');
  perform pg_temp.check_fails(
    format('select public.create_table_reservation(%L, ''19:00'', 4, ''[{"itemId": "no-such-dish", "quantity": 1}]'')', d),
    'invalid_booking', 'unknown menu items are refused');
  perform pg_temp.check_fails(
    format('select public.create_table_reservation(%L, ''19:00'', 4, ''[{"itemId": "club-beer-large", "quantity": 0}]'')', d),
    'invalid_booking', 'quantities must be at least 1');
  perform pg_temp.check_fails(format('select public.create_table_reservation(%L, ''22:30'', 4)', d),
    'invalid_booking', 'the last table is an hour before closing');

  -- --------------------------------------------- refunds and cancellations
  -- Confirmed, paid bookings at different distances from the event.
  perform pg_temp.act_as_owner();
  insert into public.payments (booking_id, customer_id, type, purpose, status, amount, phone, network, description, completed_at)
  values (b.id, v_ama, 'payment', 'space_booking', 'success', 300, '+233200000901', 'mtn', 'Hut 1', now())
  returning id into v_payment;
  update public.bookings set status = 'confirmed', amount_paid = 300, payment_id = v_payment, hold_expires_at = null
  where id = b.id;

  perform pg_temp.act_as(v_ama);
  v_json := public.get_cancellation_quote(b.id);
  perform pg_temp.check((v_json ->> 'refundAmount')::numeric = 240 and (v_json ->> 'cancellable')::boolean,
    '14 days or more before: 80% back (240 of 300)');

  perform pg_temp.act_as_owner();
  update public.bookings set starts_at = now() + interval '10 days', ends_at = now() + interval '10 days 2 hours' where id = b.id;
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_cancellation_quote(b.id) ->> 'refundAmount')::numeric = 150,
    '7 to 13 days before: 50% back');

  perform pg_temp.act_as_owner();
  update public.bookings set starts_at = now() + interval '3 days', ends_at = now() + interval '3 days 2 hours' where id = b.id;
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_cancellation_quote(b.id) ->> 'refundAmount')::numeric = 0,
    'less than 7 days before: no refund');

  perform pg_temp.act_as_owner();
  update public.bookings set starts_at = d + time '12:00', ends_at = d + time '14:00' where id = b.id;
  perform pg_temp.act_as(v_ama);
  v_json := public.cancel_booking(b.id);
  perform pg_temp.check((v_json ->> 'refundAmount')::numeric = 240 and v_json -> 'booking' ->> 'status' = 'cancelled',
    'cancelling refunds what the policy allows');
  perform pg_temp.check((select amount = 240 and refund_of = v_payment and phone = '+233200000901' and network = 'mtn'
      from public.payments where booking_id = b.id and type = 'refund'),
    'the refund goes back to the number and network that paid');
  perform pg_temp.check((select refunded_amount from public.bookings where id = b.id) = 240,
    'the booking records how much was refunded');
  select count(*) into v_count from public.get_busy_slots('hut-1', d, d) s where s.start_time = '12:00';
  perform pg_temp.check(v_count = 0, 'a cancelled booking frees its time');
  perform pg_temp.check_fails(format('select public.cancel_booking(%L)', b.id),
    'invalid_state', 'a cancelled booking cannot be cancelled again');

  -- Table deposits: full refund 24 hours or more before, none after.
  perform pg_temp.act_as_owner();
  update public.bookings set status = 'confirmed', amount_paid = 100, hold_expires_at = null,
    starts_at = now() + interval '2 days', ends_at = now() + interval '2 days 3 hours' where id = b2.id;
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_cancellation_quote(b2.id) ->> 'refundAmount')::numeric = 100,
    'a table cancelled 24 hours or more before gets the whole deposit back');
  perform pg_temp.act_as_owner();
  update public.bookings set starts_at = now() + interval '12 hours', ends_at = now() + interval '15 hours' where id = b2.id;
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_cancellation_quote(b2.id) ->> 'refundAmount')::numeric = 0,
    'a table cancelled less than 24 hours before gets nothing back');

  -- ----------------------------------------------------------- date change
  perform pg_temp.act_as(v_ama);
  b := public.create_space_booking('birthday', 'hut-2', d + 10, '12:00', '15:00', 10);
  perform pg_temp.act_as_owner();
  update public.bookings set status = 'confirmed', amount_paid = b.amount_due, hold_expires_at = null where id = b.id;
  perform pg_temp.act_as(v_ama);
  b := public.change_space_date(b.id, d + 12, '16:00');
  perform pg_temp.check(b.starts_at = (d + 12) + time '16:00' and b.ends_at = (d + 12) + time '19:00'
      and b.date_change_used and b.previous_starts_at = (d + 10) + time '12:00',
    'a date change keeps the same length and remembers the old date');
  select count(*) into v_count from public.get_busy_slots('hut-2', d + 10, d + 10);
  perform pg_temp.check(v_count = 0, 'the old date is free again');
  perform pg_temp.check_fails(format('select public.change_space_date(%L, %L, ''12:00'')', b.id, d + 14),
    'invalid_state', 'only one date change is allowed');

  -- ------------------------------------------------------------- blocked times
  perform pg_temp.act_as_owner();
  insert into public.blocked_times (space_id, starts_at, ends_at, reason)
  values (null, (d + 20) + time '10:00', (d + 20) + time '23:00', 'Private event');
  perform pg_temp.act_as(v_kofi);
  perform pg_temp.check_fails(
    format('select public.create_space_booking(''birthday'', ''hut-4'', %L, ''12:00'', ''15:00'', 10)', d + 20),
    'slot_unavailable', 'a time the admin blocked cannot be booked');
  perform pg_temp.check((select count(*) from public.get_busy_slots('hut-2', d + 20, d + 20)) = 1,
    'blocked times show as busy');

  -- ----------------------------------------------------------------- payments
  -- The mock provider approves 3 seconds after a payment starts, so each check
  -- moves the payment's start back instead of waiting.
  perform pg_temp.act_as(v_ama);
  b := public.create_space_booking('birthday', 'hut-3', d + 30, '12:00', '15:00', 20, null, 'basic');
  p := public.start_payment(b.id, 'space_booking', '+233241234567', 'mtn');
  perform pg_temp.check(p.status = 'pending' and p.amount = b.amount_due and p.description = 'Hut 3 booking',
    'a payment starts pending, for the amount the server worked out');
  perform pg_temp.check((public.get_payment(p.id)).status = 'pending',
    'a payment is not approved straight away');
  perform pg_temp.act_as(v_kofi);
  perform pg_temp.check_fails(format('select public.get_payment(%L)', p.id), 'not_found',
    'customers cannot see each other''s payments');
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''space_booking'', ''+233241234567'', ''mtn'')', b.id),
    'not_found', 'customers cannot pay for each other''s bookings');
  perform pg_temp.act_as(null);
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''space_booking'', ''+233241234567'', ''mtn'')', b.id),
    '42501', 'visitors cannot start payments');
  perform pg_temp.act_as_owner();
  update public.payments set created_at = now() - interval '1 minute' where id = p.id;
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_payment(p.id)).status = 'success', 'the mock approves an ordinary number');
  select * into b from public.bookings where id = b.id;
  perform pg_temp.check(b.status = 'confirmed' and b.amount_paid = b.amount_due and b.payment_id = p.id
      and b.hold_expires_at is null,
    'a successful payment confirms the booking on the server');
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''space_booking'', ''+233241234567'', ''mtn'')', b.id),
    'invalid_state', 'a confirmed booking cannot be paid again');
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''table_deposit'', ''+233241234567'', ''mtn'')', b.id),
    'invalid_payment', 'the purpose must match the booking');

  -- A declined payment leaves the booking waiting; a pending one stays pending.
  b := public.create_space_booking('birthday', 'hut-3', d + 31, '12:00', '15:00', 20);
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''space_booking'', ''0241234567'', ''mtn'')', b.id),
    'invalid_phone', 'the mobile money number must be in +233 form');
  p := public.start_payment(b.id, 'space_booking', '+233249999999', 'mtn');
  v_payment := (public.start_payment(b.id, 'space_booking', '+233248888888', 'telecel')).id;
  perform pg_temp.act_as_owner();
  update public.payments set created_at = now() - interval '1 minute' where id in (p.id, v_payment);
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check((public.get_payment(p.id)).status = 'failed', 'a number ending 9999 is declined');
  perform pg_temp.check((public.get_payment(v_payment)).status = 'pending', 'a number ending 8888 stays pending');
  perform pg_temp.check((select status from public.bookings where id = b.id) = 'pending_payment',
    'a declined payment does not confirm the booking');

  -- The time is taken while the payment is pending: the money goes back.
  b := public.create_space_booking('birthday', 'hut-4', d + 32, '12:00', '15:00', 20);
  p := public.start_payment(b.id, 'space_booking', '+233241234567', 'mtn');
  perform public.release_hold(b.id);
  perform pg_temp.act_as(v_kofi);
  b2 := public.create_space_booking('birthday', 'hut-4', d + 32, '13:00', '16:00', 20);
  perform pg_temp.act_as_owner();
  update public.payments set created_at = now() - interval '1 minute' where id = p.id;
  perform private.settle_pending_payments();
  select * into b from public.bookings where id = b.id;
  perform pg_temp.check(b.status = 'cancelled' and b.refunded_amount = p.amount,
    'a payment for a time that was taken meanwhile does not confirm it');
  perform pg_temp.check(exists (
      select 1 from public.payments
      where refund_of = p.id and type = 'refund' and amount = p.amount and phone = p.phone),
    'and the whole payment is refunded to the number that paid');
  perform pg_temp.act_as(v_ama);
  perform pg_temp.check_fails(format('select public.restart_hold(%L)', b.id), 'invalid_state',
    'a refunded booking cannot be held again');

  -- Released before paying, then paid while the time is still free: it comes back.
  b := public.create_space_booking('meeting', 'hut-1', d + 33, '12:00', '14:00', 10);
  p := public.start_payment(b.id, 'space_booking', '+233241234567', 'mtn');
  perform public.release_hold(b.id);
  perform pg_temp.act_as_owner();
  update public.payments set created_at = now() - interval '1 minute' where id = p.id;
  perform pg_temp.act_as(v_ama);
  perform public.get_payment(p.id);
  perform pg_temp.check((select status from public.bookings where id = b.id) = 'confirmed',
    'a payment for a released hold whose time is still free confirms it');

  -- Table deposit, then the catering balance on an event booking.
  b := public.create_table_reservation(d + 33, '19:00', 4);
  p := public.start_payment(b.id, 'table_deposit', '+233241234567', 'airteltigo');
  perform pg_temp.check(p.amount = 50 and p.description = 'Table reservation deposit',
    'a table deposit is paid through the same function');
  b := public.create_space_booking('wedding', 'whole-venue', d + 34, '12:00', '18:00', 150,
    null, null, 'Buffet for 150 guests');
  perform pg_temp.check_fails(
    format('select public.start_payment(%L, ''catering_balance'', ''+233241234567'', ''mtn'')', b.id),
    'invalid_state', 'catering cannot be paid before it is quoted');
  perform pg_temp.act_as_owner();
  update public.bookings set status = 'confirmed', amount_paid = amount_due, hold_expires_at = null where id = b.id;
  update public.catering_requests set status = 'quoted', quote_amount = 6500, quoted_at = now() where booking_id = b.id;
  perform pg_temp.act_as(v_ama);
  p := public.start_payment(b.id, 'catering_balance', '+233241234567', 'mtn');
  perform pg_temp.check(p.amount = 6500, 'the catering balance is the quoted amount');
  perform pg_temp.act_as_owner();
  update public.payments set created_at = now() - interval '1 minute' where id = p.id;
  perform pg_temp.act_as(v_ama);
  perform public.get_payment(p.id);
  perform pg_temp.check((select status = 'paid' and payment_id = p.id from public.catering_requests where booking_id = b.id),
    'a successful catering payment marks the quote paid');
  perform pg_temp.check((select status from public.bookings where id = b.id) = 'confirmed',
    'paying catering does not change the booking itself');

  perform pg_temp.act_as_owner();
  raise exception 'JOTEKU TESTS PASSED (% checks)', current_setting('joteku.checks');
end;
$$;
