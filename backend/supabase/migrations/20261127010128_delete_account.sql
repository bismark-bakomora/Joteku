-- Customers can delete their account from Settings in the app (app stores
-- require this for any app that lets people make an account).
--
-- Deleting removes the sign-in, the profile (name, email, number) and the
-- notification read state. Bookings and payments are the venue's financial
-- records, so they stay, no longer linked to anyone: they keep only the phone
-- number they were made or paid with, which refunds already need.

alter table public.bookings alter column customer_id drop not null;
alter table public.bookings drop constraint bookings_customer_id_fkey;
alter table public.bookings add constraint bookings_customer_id_fkey
  foreign key (customer_id) references public.profiles (id) on delete set null;

alter table public.payments alter column customer_id drop not null;
alter table public.payments drop constraint payments_customer_id_fkey;
alter table public.payments add constraint payments_customer_id_fkey
  foreign key (customer_id) references public.profiles (id) on delete set null;

comment on column public.bookings.customer_id is 'Null once the customer has deleted their account.';
comment on column public.payments.customer_id is 'Null once the customer has deleted their account.';

-- Deletes the caller's account. Refused while they have a booking waiting for
-- payment or one still to come, so nobody loses track of an event they paid
-- for: they cancel it first, or wait until it has passed.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := private.require_customer();
begin
  perform private.expire_holds();

  if exists (
    select 1 from public.bookings
    where customer_id = v_customer.id
      and (status = 'pending_payment' or (status = 'confirmed' and ends_at > now()))
  ) then
    perform private.app_error('invalid_state',
      'You have a booking that is still to come. Cancel it first, or delete your account after the event.');
  end if;

  delete from auth.users where id = v_customer.id;
end;
$$;

comment on function public.delete_my_account() is
  'Deletes the signed-in customer''s account. Their past bookings and payments stay, unlinked.';

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
