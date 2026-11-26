# Joteku backend

The database and server rules for the Joteku app, on [Supabase](https://supabase.com) (Postgres).

## What is here

| Path | What it holds |
|---|---|
| `supabase/migrations/` | The database, built step by step. Applied in order by `db push`. |
| `supabase/config.jsonc` | Supabase project settings (used for local development). |
| `tests/booking_rules.sql` | Checks of the booking, payment, refund and access rules. |
| `scripts/sample_data.sql` | Sample bookings for the test numbers (development only). |

### The migrations

1. **catalog**: spaces, which huts each space takes, decoration packages, menu, price settings and refund tiers, with the starting data. Anyone can read them.
2. **accounts**: one profile per phone number, made when the number is first verified. No name means a guest.
3. **bookings**: event bookings and table reservations, pre-order lines, catering requests, payments and refunds, admin-blocked times, and which notifications were read.
4. **booking_functions**: the only way bookings change (create, hold, release, cancel with refund, change date, busy times). Prices, deposits and refunds are worked out here, never taken from the app.
5. **scheduled_jobs**: every minute, unpaid holds older than 10 minutes are released; every 5 minutes, finished bookings are marked completed.
6. **lock_down_grants**: the app's roles get only the rights each migration grants.
7. **payments**: starting a mobile money payment and checking on it, through a mock provider for now (see below).

### How double booking is prevented

Every hut a booking (or admin block) takes up is stored as a "claim" with its time range. The whole venue claims all four huts. The database refuses two claims on the same hut whose times overlap (a Postgres exclusion constraint), so two customers can never hold the same slot, even if they press Pay at the same instant.

### Access

- Visitors (not signed in) can read the catalog and see busy times.
- Signed-in customers can also read their own bookings, payments and profile, change their name and email, and mark notifications as read.
- Nobody writes bookings or payments directly. The functions above do it, after checking who is calling.

## Payments

The app calls `start_payment` and then `get_payment` every few seconds while the customer approves on their phone. The amount and description always come from the booking, never from the app.

Until a real mobile money aggregator is connected, a mock provider in the database decides the outcome from the paying number:

- ends in **9999**: declined
- ends in **8888**: stays pending
- anything else: approved 3 seconds after it started

A successful payment confirms its booking on the server (`private.apply_successful_payment`), the way a provider's callback will, so the booking confirms even if the customer closes the app; the `settle-mock-payments` job checks pending payments every minute for that case. If the time was taken while the payment was pending, the whole payment is refunded to the number that paid. When the real provider is connected, its callback takes over from `private.mock_payment_outcome` and the job.

## Sign-in

Customers sign in with their phone number and a one-time code (Supabase Auth). Phone sign-in is on, with placeholder Twilio details because Supabase needs a provider configured even for test numbers. No real text message is sent yet (the brief asks for SMS to be mocked); a Ghanaian SMS provider will be connected later.

For development, test numbers **020 000 0001 to 020 000 0005** take the code **123456**. Other numbers cannot get a code until the real provider is connected. Remove the `test_otp` list before configuring the live project.

Auth settings are in `supabase/config.jsonc`. It was pulled from the hosted project, so pushing it changes only what you edited. Always check first:

```bash
SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=placeholder npx supabase config diff
SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=placeholder npx supabase config push
```

## Setup

Needs Node.js 20 or later. The Supabase CLI is installed in this folder, pinned.

```bash
cd backend
npm install
npx supabase login                     # opens the browser
npx supabase link --project-ref <ref>  # asks for the database password
```

Keys and passwords never go into git. `.env` files are ignored.

## Everyday commands

```bash
npx supabase migration new <name>      # start a new migration file
npx supabase db push --remote --dry-run   # see what would be applied
npx supabase db push --remote          # apply new migrations to the linked project
npx supabase db advisors --remote      # Supabase's security and performance checks
npm test                               # run the rule checks (development project only)
npm run sample-data                    # replace the sample bookings for the test numbers
```

`npm run sample-data` gives test number 020 000 0001 a booking history (including a catering quote to pay with Pay Balance) and 020 000 0005 a birthday in Hut 3, dated from today. Both numbers must have signed in once in the app first. Running it again replaces only those sample bookings. Never run it on the live project.

`npm test` runs every check inside one transaction and rolls it back, so it leaves no test data. It prints `JOTEKU TESTS PASSED (n checks)` or the first check that failed.

## Known advisor warnings

`db advisors` warns that the booking functions run with their owner's rights and can be called by signed-in users (and `get_busy_slots` by visitors). That is intended: it is how the app changes bookings without being able to write the tables itself. Each function checks the caller first, and the tests prove customers cannot touch each other's bookings. `rls_auto_enable` is Supabase's own event trigger, which turns on row level security for new tables.
