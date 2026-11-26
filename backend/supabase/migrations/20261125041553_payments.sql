-- Mobile money payments.
--
-- The app starts a payment and then checks on it. Until a real mobile money
-- aggregator is connected, a mock provider here decides the outcome from the
-- paying number, so every payment screen can be tested:
--   ends in 9999 -> fails, ends in 8888 -> stays pending,
--   any other number -> approved 3 seconds after it was started.
-- A successful payment confirms its booking on the server, the way a provider's
-- callback will, so a booking confirms even if the customer closes the app.
-- When the real provider is connected, its callback decides the outcome instead,
-- and mock_payment_outcome and the settle-mock-payments job are removed.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.mock_payment_outcome(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_phone like '%9999' then 'failed'
    when p_phone like '%8888' then 'pending'
    else 'success'
  end;
$$;

-- Applies a successful payment: confirms the booking, or marks its catering
-- quote paid. If that is no longer possible (the time was taken while the
-- payment was pending, or it was already paid), the whole payment goes back to
-- the number that paid.
create function private.apply_successful_payment(p_payment public.payments)
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

-- Asks the (mock) provider whether a pending payment has finished, and applies it.
create function private.settle_payment(p_payment_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_outcome text;
begin
  select * into v_payment from public.payments
  where id = p_payment_id and type = 'payment'
  for update;
  if not found or v_payment.status <> 'pending' or v_payment.created_at > now() - interval '3 seconds' then
    return;
  end if;
  v_outcome := private.mock_payment_outcome(v_payment.phone);
  if v_outcome = 'pending' then
    return;
  end if;
  update public.payments
  set status = v_outcome, completed_at = now()
  where id = v_payment.id
  returning * into v_payment;
  if v_outcome = 'success' then
    perform private.apply_successful_payment(v_payment);
  end if;
end;
$$;

-- Settles every pending payment, for customers who closed the app while paying.
create function private.settle_pending_payments()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.payments
    where type = 'payment' and status = 'pending' and created_at <= now() - interval '3 seconds'
  loop
    perform private.settle_payment(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function
  private.mock_payment_outcome(text),
  private.apply_successful_payment(public.payments),
  private.settle_payment(uuid),
  private.settle_pending_payments()
from public, anon, authenticated;

select cron.schedule('settle-mock-payments', '* * * * *', 'select private.settle_pending_payments()');

-- ---------------------------------------------------------------------------
-- Public functions (the app calls these)
-- ---------------------------------------------------------------------------

-- Starts a mobile money payment for one of the caller's bookings. The amount
-- and description come from the booking, never from the app.
-- p_purpose: 'space_booking' or 'table_deposit' (matching the booking), or
-- 'catering_balance' to pay a catering quote.
create function public.start_payment(
  p_booking_id uuid,
  p_purpose text,
  p_phone text,
  p_network text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.own_booking(p_booking_id, true);
  v_amount numeric;
  v_description text;
  v_payment public.payments;
begin
  if p_phone is null or p_phone !~ '^\+233[0-9]{9}$' then
    perform private.app_error('invalid_phone', 'Enter a valid mobile money number.');
  end if;
  if p_network is null or p_network not in ('mtn', 'telecel', 'airteltigo') then
    perform private.app_error('invalid_payment', 'Choose your mobile money network.');
  end if;

  if p_purpose = 'catering_balance' then
    select c.quote_amount into v_amount
    from public.catering_requests c
    where c.booking_id = v_booking.id and c.status = 'quoted';
    if v_booking.status <> 'confirmed' or v_amount is null then
      perform private.app_error('invalid_state',
        'There is no catering quote waiting to be paid on this booking.');
    end if;
    v_description := 'Catering balance';
  elsif p_purpose = (case v_booking.kind when 'space' then 'space_booking' else 'table_deposit' end) then
    if v_booking.status <> 'pending_payment' or v_booking.hold_expires_at <= now() then
      perform private.app_error('invalid_state',
        'Your time is no longer held. Please try again.');
    end if;
    v_amount := v_booking.amount_due;
    if v_booking.kind = 'space' then
      select s.name || ' booking' into v_description from public.spaces s where s.id = v_booking.space_id;
    else
      v_description := 'Table reservation deposit';
    end if;
  else
    perform private.app_error('invalid_payment', 'This payment does not match the booking.');
  end if;

  insert into public.payments (
    booking_id, customer_id, type, purpose, amount, phone, network, description
  ) values (
    v_booking.id, v_booking.customer_id, 'payment', p_purpose, v_amount, p_phone, p_network, v_description
  )
  returning * into v_payment;
  return v_payment;
end;
$$;

-- One of the caller's payments, after checking with the provider whether it
-- has finished. The app polls this while the customer approves on their phone.
create function public.get_payment(p_payment_id uuid)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := private.require_customer();
  v_payment public.payments;
begin
  if exists (
    select 1 from public.payments
    where id = p_payment_id and customer_id = v_customer.id and status = 'pending'
  ) then
    perform private.settle_payment(p_payment_id);
  end if;
  select * into v_payment from public.payments
  where id = p_payment_id and customer_id = v_customer.id;
  if not found then
    perform private.app_error('not_found', 'We could not find that payment.');
  end if;
  return v_payment;
end;
$$;

revoke execute on function
  public.start_payment(uuid, text, text, text),
  public.get_payment(uuid)
from public, anon, authenticated;

grant execute on function
  public.start_payment(uuid, text, text, text),
  public.get_payment(uuid)
to authenticated;
