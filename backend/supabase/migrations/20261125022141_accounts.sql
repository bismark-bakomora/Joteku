-- Accounts. Customers sign in with their phone number and a one-time code
-- (Supabase Auth). Each verified number gets one profile. Someone who has not
-- given a name is a guest; giving a name turns the same profile into an account,
-- so a guest's bookings stay with them.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Stored as +233XXXXXXXXX, the way the app stores numbers.
  phone text not null unique check (phone ~ '^\+233[0-9]{9}$'),
  name text check (char_length(btrim(name)) between 1 and 80),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_guest boolean generated always as (name is null) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per customer phone number. No name means a guest.';

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;
-- Customers may only change their name and email, never their number.
grant update (name, email) on public.profiles to authenticated;

create policy "Customers can read their own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Customers can update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Creates the profile when a phone sign-in creates the auth user. Users without
-- a phone (the admin signs in with email) get no customer profile.
create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone is not null and new.phone <> '' then
    insert into public.profiles (id, phone)
    values (new.id, '+' || ltrim(new.phone, '+'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function private.create_profile_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();
