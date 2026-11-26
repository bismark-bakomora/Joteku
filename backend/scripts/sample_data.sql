-- Sample bookings for testing the app on the development project. Never run it
-- on the live project.
--
-- Gives test number 020 000 0001 a history to look at: a wedding with a
-- catering quote to pay, a meeting this week, a table with a pre-order, a
-- cancelled and refunded engagement, and two past visits. Test number
-- 020 000 0005 gets a birthday in Hut 3, so that time shows as busy to others.
-- Dates are relative to today. Running it again replaces these bookings (found
-- by their references) and leaves every other booking alone.
--
-- Both numbers must have signed in once in the app first, so they have profiles.
-- Run with `npm run sample-data`.

do $$
declare
  v_customer public.profiles;
  v_other public.profiles;
  v_refs constant text[] := array[
    'JTK-W3D5N8', 'JTK-M7K2P4', 'JTK-B9R6T2', 'JTK-E4X8Q6', 'JTK-C5L3V9', 'JTK-T2H7J5', 'JTK-T8F4G3'
  ];
  v_ids uuid[];
  s record;
  v_booking public.bookings;
  v_payment uuid;
  v_hours integer;
  v_hire numeric;
  v_decor numeric;
  v_total numeric;
  v_deposit numeric;
  v_booked timestamptz;
begin
  select * into v_customer from public.profiles where phone = '+233200000001';
  select * into v_other from public.profiles where phone = '+233200000005';
  if v_customer.id is null or v_other.id is null then
    raise exception 'Sign in once in the app with 020 000 0001 and 020 000 0005 first.';
  end if;

  -- Remove the previous run's sample bookings.
  select array_agg(id) into v_ids from public.bookings where reference = any (v_refs);
  if v_ids is not null then
    delete from public.notification_reads n
    where exists (select 1 from unnest(v_ids) i where n.notification_id like i::text || ':%');
    delete from public.catering_requests where booking_id = any (v_ids);
    update public.bookings set payment_id = null where id = any (v_ids);
    delete from public.payments where booking_id = any (v_ids) and type = 'refund';
    delete from public.payments where booking_id = any (v_ids);
    delete from public.bookings where id = any (v_ids);
  end if;

  -- Event bookings, priced the way the server prices them.
  for s in
    select * from (values
      ('JTK-W3D5N8', v_customer, 'wedding',    'whole-venue', 21, time '12:00', time '18:00', 150, 'premium',  'confirmed', 12, 'mtn',        null::integer),
      ('JTK-M7K2P4', v_customer, 'meeting',    'hut-1',        3, time '15:00', time '17:00',  18, null,       'confirmed',  5, 'telecel',    null),
      ('JTK-B9R6T2', v_other,    'birthday',   'hut-3',       10, time '14:00', time '19:00',  35, 'standard', 'confirmed',  3, 'airteltigo', null),
      ('JTK-E4X8Q6', v_customer, 'engagement', 'hut-4',       16, time '13:00', time '18:00',  40, 'basic',    'cancelled',  9, 'mtn',        1),
      ('JTK-C5L3V9', v_customer, 'meeting',    'hut-2',      -20, time '14:00', time '16:00',  15, null,       'completed', 30, 'mtn',        null)
    ) as t(reference, who, event_type, space_id, day_offset, start_time, end_time, guests, decoration_id, status, booked_days_ago, network, cancelled_days_ago)
  loop
    select greatest(sp.min_hours, ceil(extract(epoch from s.end_time - s.start_time) / 3600)::integer), sp.hourly_rate
    into v_hours, v_hire
    from public.spaces sp where sp.id = s.space_id;
    v_hire := v_hire * v_hours;
    v_decor := coalesce((select price from public.decoration_packages where id = s.decoration_id), 0);
    v_total := v_hire + v_decor;
    v_booked := private.venue_time(current_date - s.booked_days_ago, '10:00');

    insert into public.bookings (
      reference, kind, customer_id, phone, status, created_at, starts_at, ends_at,
      amount_due, amount_paid, refunded_amount, cancelled_at, cancelled_by,
      event_type, space_id, guest_count, decoration_id, venue_hire_amount, decoration_amount
    ) values (
      s.reference, 'space', (s.who).id, (s.who).phone, s.status, v_booked,
      private.venue_time(current_date + s.day_offset, s.start_time),
      private.venue_time(current_date + s.day_offset, s.end_time),
      v_total, v_total,
      case when s.status = 'cancelled' then round(v_total * 0.8, 2) else 0 end,
      case when s.status = 'cancelled' then private.venue_time(current_date - s.cancelled_days_ago, '12:00') end,
      case when s.status = 'cancelled' then 'customer' end,
      s.event_type, s.space_id, s.guests, s.decoration_id, v_hire, v_decor
    )
    returning * into v_booking;

    insert into public.payments (
      booking_id, customer_id, type, purpose, status, amount, phone, network, description, created_at, completed_at
    )
    select v_booking.id, v_booking.customer_id, 'payment', 'space_booking', 'success', v_total, v_booking.phone,
      s.network, sp.name || ' booking', v_booked, v_booked
    from public.spaces sp where sp.id = s.space_id
    returning id into v_payment;
    update public.bookings set payment_id = v_payment where id = v_booking.id;

    if s.status = 'cancelled' then
      insert into public.payments (
        booking_id, customer_id, type, purpose, status, amount, phone, network, description,
        refund_of, created_at, completed_at
      ) values (
        v_booking.id, v_booking.customer_id, 'refund', 'space_booking', 'success', v_booking.refunded_amount,
        v_booking.phone, s.network, 'Refund for ' || s.reference, v_payment,
        v_booking.cancelled_at, v_booking.cancelled_at
      );
    end if;

    if s.reference = 'JTK-W3D5N8' then
      insert into public.catering_requests (booking_id, details, status, quote_amount, quoted_at)
      values (v_booking.id,
        'Buffet for 150 guests: jollof, banku with tilapia, grilled chicken and drinks service.',
        'quoted', 6500, private.venue_time(current_date - 2, '11:00'));
    end if;
  end loop;

  -- Table reservations, with the deposit the server works out.
  for s in
    select * from (values
      ('JTK-T2H7J5',   2, time '19:00', 4, 'confirmed', 1,  '[{"itemId": "banku-fried-fish", "quantity": 2}, {"itemId": "club-beer-large", "quantity": 2}]'::jsonb),
      ('JTK-T8F4G3', -12, time '13:00', 2, 'completed', 14, '[]'::jsonb)
    ) as t(reference, day_offset, at_time, party, status, booked_days_ago, items)
  loop
    select coalesce(sum(m.price * (line ->> 'quantity')::integer), 0) into v_total
    from jsonb_array_elements(s.items) line
    join public.menu_items m on m.id = line ->> 'itemId';
    select case when v_total <= 0 then st.table_deposit_flat else round(v_total * st.table_deposit_rate, 2) end
    into v_deposit
    from public.settings st;
    v_booked := private.venue_time(current_date - s.booked_days_ago, '09:00');

    insert into public.bookings (
      reference, kind, customer_id, phone, status, created_at, starts_at, ends_at,
      amount_due, amount_paid, party_size, pre_order_total, balance_at_venue
    ) values (
      s.reference, 'table', v_customer.id, v_customer.phone, s.status, v_booked,
      private.venue_time(current_date + s.day_offset, s.at_time),
      private.venue_time(current_date + s.day_offset, s.at_time) + interval '3 hours',
      v_deposit, v_deposit, s.party, v_total, greatest(v_total - v_deposit, 0)
    )
    returning * into v_booking;

    insert into public.booking_pre_order_lines (booking_id, item_id, name, unit_price, quantity)
    select v_booking.id, m.id, m.name, m.price, (line ->> 'quantity')::integer
    from jsonb_array_elements(s.items) line
    join public.menu_items m on m.id = line ->> 'itemId';

    insert into public.payments (
      booking_id, customer_id, type, purpose, status, amount, phone, network, description, created_at, completed_at
    ) values (
      v_booking.id, v_customer.id, 'payment', 'table_deposit', 'success', v_deposit, v_customer.phone,
      'mtn', 'Table reservation deposit', v_booked, v_booked
    )
    returning id into v_payment;
    update public.bookings set payment_id = v_payment where id = v_booking.id;
  end loop;

  raise notice 'Sample bookings ready for 020 000 0001 (and one for 020 000 0005).';
end;
$$;
