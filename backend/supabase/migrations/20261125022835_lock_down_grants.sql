-- This project still gives anon and authenticated full rights on every new
-- table, function and sequence in public by default (Supabase's older "expose
-- new tables automatically" behaviour). Row level security already limits the
-- rows, but rights like TRUNCATE are not covered by it, so the app's roles get
-- exactly the rights listed in each migration and nothing more.

-- Future objects in public get no rights for the app's roles unless a
-- migration grants them.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Remove what the defaults gave the tables so far, then grant what is intended.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.settings,
  public.refund_tiers,
  public.spaces,
  public.space_units,
  public.decoration_packages,
  public.menu_categories,
  public.menu_items
to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (name, email) on public.profiles to authenticated;

grant select on
  public.bookings,
  public.booking_pre_order_lines,
  public.catering_requests,
  public.payments,
  public.notification_reads
to authenticated;
grant insert on public.notification_reads to authenticated;
