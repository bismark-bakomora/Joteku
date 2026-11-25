-- Jobs the database runs on its own (pg_cron).

create extension if not exists pg_cron with schema pg_catalog;

-- Unpaid holds end after 10 minutes, freeing the slot for others.
select cron.schedule(
  'release-expired-holds',
  '* * * * *',
  $$select private.expire_holds()$$
);

-- Confirmed bookings whose time has passed show as Completed.
select cron.schedule(
  'complete-finished-bookings',
  '*/5 * * * *',
  $$select private.complete_finished_bookings()$$
);
