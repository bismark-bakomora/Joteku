-- The admin web page. One admin signs in with email and password; their
-- account carries "role": "admin" in app_metadata, which only the server (the
-- dashboard, or SQL as the owner) can set, so a customer can never grant it to
-- themselves. Rules below check that claim in the sign-in token, so the admin
-- page needs only the publishable key and the admin's session, never the
-- secret key.
--
-- The admin can read everything, change the catalog and settings directly
-- (row level security limits those writes to the admin), and use the admin_
-- functions for anything with a business rule: blocking times, catering
-- quotes and cancelling on Joteku's behalf.
--
-- The claim is read from the token, so a newly made admin must sign in again
-- before it takes effect.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

create function private.require_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not private.is_admin() then
    perform private.app_error('not_allowed', 'Only the Joteku admin can do this.');
  end if;
end;
$$;

revoke execute on function private.is_admin(), private.require_admin() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reading: the admin sees every booking, payment, customer and block, and the
-- hidden parts of the catalog. (Policies cannot call private functions as the
-- app's roles, so they read the claim directly.)
-- ---------------------------------------------------------------------------
grant select on public.blocked_times to authenticated;

create policy "The admin can read every booking" on public.bookings
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read every pre-order" on public.booking_pre_order_lines
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read every catering request" on public.catering_requests
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read every payment and refund" on public.payments
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read every customer" on public.profiles
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read blocked times" on public.blocked_times
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read hidden spaces" on public.spaces
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read hidden decoration packages" on public.decoration_packages
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can read hidden menu items" on public.menu_items
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- Catalog and settings: the admin edits them directly. Nothing is deleted:
-- old bookings and pre-orders point at spaces, packages and menu items, so
-- the admin hides them instead (active / available). Which huts a space takes
-- is fixed, because double-booking protection depends on it.
-- ---------------------------------------------------------------------------
grant update (opens_at, closes_at, hold_minutes, table_deposit_rate, table_deposit_flat,
  table_full_refund_hours, table_visit_minutes, last_table_before_close_minutes,
  free_date_change_days, refund_working_days)
  on public.settings to authenticated;
grant insert, update, delete on public.refund_tiers to authenticated;
grant update (name, description, capacity_label, max_guests, suitable_for_meetings,
  hourly_rate, min_hours, sort_order, active)
  on public.spaces to authenticated;
grant insert, update on public.decoration_packages to authenticated;
grant insert, update on public.menu_categories to authenticated;
grant insert, update on public.menu_items to authenticated;

create policy "The admin can change the settings" on public.settings
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can add refund tiers" on public.refund_tiers
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can change refund tiers" on public.refund_tiers
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can remove refund tiers" on public.refund_tiers
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can change spaces" on public.spaces
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can add decoration packages" on public.decoration_packages
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can change decoration packages" on public.decoration_packages
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can add menu categories" on public.menu_categories
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can change menu categories" on public.menu_categories
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "The admin can add menu items" on public.menu_items
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can change menu items" on public.menu_items
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Every price and policy change is stamped, so the app's cached copy and the
-- admin page can tell when settings last changed.
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Menu photos: a public bucket (the app shows them without signing in) that
-- only the admin can upload to. menu_items.photo_path holds the file's path.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Uploading over an existing photo (upsert) needs select, insert and update.
create policy "The admin can see menu photo files" on storage.objects
  for select to authenticated
  using (bucket_id = 'menu-photos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can upload menu photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-photos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can replace menu photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-photos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'menu-photos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "The admin can delete menu photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-photos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- A payment that lands after Joteku cancelled the booking is refunded, not
-- applied. (A hold the customer released or let run out still comes back if
-- its time is free, as before.) Otherwise unchanged from the payments
-- migration.
-- ---------------------------------------------------------------------------
create or replace function private.apply_successful_payment(p_payment public.payments)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_payment.booking_id for update;

  begin
    if p_payment.purpose = 'catering_balance' then
      if v_booking.status <> 'confirmed' then
        perform private.app_error('invalid_state', 'This booking is no longer confirmed.');
      end if;
      update public.catering_requests
      set status = 'paid', payment_id = p_payment.id, paid_at = now()
      where booking_id = v_booking.id and status = 'quoted' and quote_amount = p_payment.amount;
      if not found then
        perform private.app_error('invalid_payment', 'The amount paid does not match the catering quote.');
      end if;
      return;
    end if;

    if v_booking.payment_id = p_payment.id then
      return;
    end if;
    if v_booking.cancelled_by = 'joteku' then
      perform private.app_error('invalid_state', 'Joteku cancelled this booking.');
    end if;
    if v_booking.status in ('confirmed', 'completed')
      or v_booking.amount_paid > 0
      or v_booking.refunded_amount > 0 then
      perform private.app_error('invalid_state', 'This booking is already paid.');
    end if;
    if p_payment.amount <> v_booking.amount_due then
      perform private.app_error('invalid_payment', 'The amount paid does not match this booking.');
    end if;
    -- A hold that was released or ran out comes back if its time is still free;
    -- otherwise the claim refuses it (exclusion_violation).
    update public.bookings
    set status = 'confirmed',
        amount_paid = p_payment.amount,
        payment_id = p_payment.id,
        hold_expires_at = null,
        cancelled_at = null,
        cancelled_by = null
    where id = v_booking.id;
  exception
    when exclusion_violation or raise_exception then
      perform private.record_refund(v_booking, p_payment.id, p_payment.amount,
        case
          when p_payment.purpose = 'catering_balance'
            then 'Refund for ' || v_booking.reference || ': the catering quote could not be paid'
          when v_booking.cancelled_by = 'joteku'
            then 'Refund for ' || v_booking.reference || ': Joteku cancelled this booking'
          else 'Refund for ' || v_booking.reference || ': the time was no longer available'
        end);
      if p_payment.purpose <> 'catering_balance' then
        update public.bookings
        set refunded_amount = refunded_amount + p_payment.amount
        where id = v_booking.id;
      end if;
  end;
end;
$$;

revoke execute on function private.apply_successful_payment(public.payments) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin functions. Each checks the caller is the admin first.
-- ---------------------------------------------------------------------------

-- Blocks a space (or, with no space, the whole venue) from p_start_time on
-- p_date to p_end_time ('24:00' for midnight). Fails with slot_unavailable if
-- a booking, a held payment or another block already takes part of it: cancel
-- or move those first.
create function public.admin_block_time(
  p_space_id text,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_reason text default null
)
returns public.blocked_times
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_block public.blocked_times;
  v_starts timestamptz;
  v_ends timestamptz;
begin
  perform private.require_admin();
  if p_space_id is not null and not exists (select 1 from public.spaces where id = p_space_id) then
    perform private.app_error('not_found', 'We could not find that space.');
  end if;
  v_starts := private.venue_time(p_date, p_start_time);
  v_ends := private.venue_time(p_date, p_end_time);
  if v_ends <= v_starts then
    perform private.app_error('invalid_booking', 'The end time must be after the start time.');
  end if;
  if char_length(coalesce(p_reason, '')) > 200 then
    perform private.app_error('invalid_booking', 'Keep the reason under 200 characters.');
  end if;

  perform private.expire_holds();
  begin
    insert into public.blocked_times (space_id, starts_at, ends_at, reason)
    values (p_space_id, v_starts, v_ends, nullif(btrim(p_reason), ''))
    returning * into v_block;
  exception when exclusion_violation then
    perform private.app_error('slot_unavailable',
      'Part of this time is already booked or blocked. Cancel or move that first.');
  end;
  return v_block;
end;
$$;

create function public.admin_unblock_time(p_block_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  delete from public.blocked_times where id = p_block_id;
  if not found then
    perform private.app_error('not_found', 'We could not find that blocked time.');
  end if;
end;
$$;

-- Sends (or corrects) the catering quote for a confirmed event booking. The
-- customer then pays it in the app with Pay Balance. A paid quote is final.
create function public.admin_quote_catering(p_booking_id uuid, p_amount numeric)
returns public.catering_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_request public.catering_requests;
begin
  perform private.require_admin();
  select * into v_booking from public.bookings where id = p_booking_id for update;
  select * into v_request from public.catering_requests where booking_id = p_booking_id for update;
  if v_booking.id is null or v_request.booking_id is null then
    perform private.app_error('not_found', 'This booking has no catering request.');
  end if;
  if v_booking.status <> 'confirmed' then
    perform private.app_error('invalid_state', 'Only confirmed bookings can get a catering quote.');
  end if;
  if v_request.status = 'paid' then
    perform private.app_error('invalid_state', 'This catering quote is already paid.');
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 or p_amount <> round(p_amount, 2) then
    perform private.app_error('invalid_booking', 'Enter the quote in cedis, like 6500 or 6500.50.');
  end if;

  update public.catering_requests
  set status = 'quoted', quote_amount = p_amount, quoted_at = now()
  where booking_id = p_booking_id
  returning * into v_request;
  return v_request;
end;
$$;

-- Joteku cancels a booking or reservation: everything paid comes back in full
-- (booking and catering), to the numbers that paid, and the time is freed.
create function public.admin_cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_refund record;
  v_catering_payment uuid;
begin
  perform private.require_admin();
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    perform private.app_error('not_found', 'We could not find that booking.');
  end if;
  if v_booking.status not in ('pending_payment', 'confirmed') then
    perform private.app_error('invalid_state', 'This booking cannot be cancelled.');
  end if;
  select * into v_refund from private.refund_amounts(v_booking, 'joteku');

  perform private.record_refund(v_booking, v_booking.payment_id, v_refund.venue,
    'Refund for ' || v_booking.reference || ': cancelled by Joteku');
  select c.payment_id into v_catering_payment
  from public.catering_requests c where c.booking_id = v_booking.id;
  perform private.record_refund(v_booking, v_catering_payment, v_refund.catering,
    'Catering refund for ' || v_booking.reference || ': cancelled by Joteku');

  update public.bookings
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = 'joteku',
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

revoke execute on function
  public.admin_block_time(text, date, time, time, text),
  public.admin_unblock_time(bigint),
  public.admin_quote_catering(uuid, numeric),
  public.admin_cancel_booking(uuid)
from public, anon;
grant execute on function
  public.admin_block_time(text, date, time, time, text),
  public.admin_unblock_time(bigint),
  public.admin_quote_catering(uuid, numeric),
  public.admin_cancel_booking(uuid)
to authenticated;
