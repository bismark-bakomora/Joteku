-- The admin migration added a second read policy beside each customer (or
-- public) one. Postgres runs every permissive policy for every row, so each
-- pair becomes one policy here. Who can read what does not change.

-- Customers read their own rows; the admin reads all of them.
drop policy "Customers can read their own bookings" on public.bookings;
drop policy "The admin can read every booking" on public.bookings;
create policy "Customers read their own bookings; the admin reads all" on public.bookings
  for select to authenticated
  using (
    (select auth.uid()) = customer_id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy "Customers can read the pre-orders of their own bookings" on public.booking_pre_order_lines;
drop policy "The admin can read every pre-order" on public.booking_pre_order_lines;
create policy "Customers read their own pre-orders; the admin reads all" on public.booking_pre_order_lines
  for select to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or booking_id in (select b.id from public.bookings b where b.customer_id = (select auth.uid()))
  );

drop policy "Customers can read the catering requests of their own bookings" on public.catering_requests;
drop policy "The admin can read every catering request" on public.catering_requests;
create policy "Customers read their own catering requests; the admin reads all" on public.catering_requests
  for select to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or booking_id in (select b.id from public.bookings b where b.customer_id = (select auth.uid()))
  );

drop policy "Customers can read their own payments and refunds" on public.payments;
drop policy "The admin can read every payment and refund" on public.payments;
create policy "Customers read their own payments; the admin reads all" on public.payments
  for select to authenticated
  using (
    (select auth.uid()) = customer_id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy "Customers can read their own profile" on public.profiles;
drop policy "The admin can read every customer" on public.profiles;
create policy "Customers read their own profile; the admin reads all" on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Everyone reads what is on offer; the admin also reads what is hidden.
drop policy "Anyone can read active spaces" on public.spaces;
drop policy "The admin can read hidden spaces" on public.spaces;
create policy "Anyone reads active spaces; the admin reads all" on public.spaces
  for select to anon, authenticated
  using (active or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy "Anyone can read active decoration packages" on public.decoration_packages;
drop policy "The admin can read hidden decoration packages" on public.decoration_packages;
create policy "Anyone reads active decoration packages; the admin reads all" on public.decoration_packages
  for select to anon, authenticated
  using (active or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy "Anyone can read available menu items" on public.menu_items;
drop policy "The admin can read hidden menu items" on public.menu_items;
create policy "Anyone reads available menu items; the admin reads all" on public.menu_items
  for select to anon, authenticated
  using (available or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
