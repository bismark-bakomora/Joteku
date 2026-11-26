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
8. **admin**: what the admin web page can read and change, the admin functions, and the menu photo bucket (see below).
9. **merge_read_policies**: joins each customer read policy with its admin one, so Postgres checks one policy per row.

### How double booking is prevented

Every hut a booking (or admin block) takes up is stored as a "claim" with its time range. The whole venue claims all four huts. The database refuses two claims on the same hut whose times overlap (a Postgres exclusion constraint), so two customers can never hold the same slot, even if they press Pay at the same instant.

### Access

- Visitors (not signed in) can read the catalog and see busy times.
- Signed-in customers can also read their own bookings, payments and profile, change their name and email, and mark notifications as read.
- The admin (see below) can read everything and edit the catalog and settings.
- Nobody writes bookings or payments directly. The functions above do it, after checking who is calling.

## Payments

The app calls `start_payment` and then `get_payment` every few seconds while the customer approves on their phone. The amount and description always come from the booking, never from the app.

Until a real mobile money aggregator is connected, a mock provider in the database decides the outcome from the paying number:

- ends in **9999**: declined
- ends in **8888**: stays pending
- anything else: approved 3 seconds after it started

A successful payment confirms its booking on the server (`private.apply_successful_payment`), the way a provider's callback will, so the booking confirms even if the customer closes the app; the `settle-mock-payments` job checks pending payments every minute for that case. If the time was taken while the payment was pending, the whole payment is refunded to the number that paid. When the real provider is connected, its callback takes over from `private.mock_payment_outcome` and the job.

## Admin

One admin uses the admin web page. They sign in with email and password, and their account carries `"role": "admin"` in its app metadata. Only the server can set app metadata, so a customer can never make themselves the admin. The database rules check that claim, so the admin page needs only the publishable key and the admin's own session, never the secret key.

What the admin can do:

- **Read** every booking, pre-order, catering request, payment, refund, customer and blocked time, and the hidden parts of the catalog. The dashboard, calendar and transaction report are built from these.
- **Edit directly**: settings (hours, hold length, deposit and refund numbers), refund tiers, spaces (prices, minimum hours, descriptions, hiding), decoration packages and menu categories and items (add, edit, hide). Nothing in the catalog is deleted, because old bookings point at it; hide it instead. Which huts a space takes cannot change.
- **Menu photos**: upload to the public `menu-photos` bucket (JPEG, PNG or WebP, up to 5 MB) and store the file's path in `menu_items.photo_path`.
- **Admin functions**, for anything with a rule:
  - `admin_block_time(space, date, start, end, reason)` blocks a space, or the whole venue when the space is null. End `24:00` means midnight. It is refused (`slot_unavailable`) if a booking, held payment or other block is already there.
  - `admin_unblock_time(id)` removes a block.
  - `admin_quote_catering(booking, amount)` sends or corrects a catering quote on a confirmed booking. The customer pays it with Pay Balance. A paid quote cannot change.
  - `admin_cancel_booking(booking)` cancels on Joteku's behalf: everything paid, including catering, is refunded in full to the numbers that paid. A payment that lands after this is refunded too, never applied.

Anyone else who calls an admin function gets `not_allowed`.

### Making the admin

1. In the Supabase dashboard, open Authentication, then Users, then Add user, then Create new user. Enter the admin's email and a password of at least 12 characters, and tick Auto Confirm User.
2. Give that account the admin role (replace the email):

   ```bash
   npx supabase db query --remote "update auth.users set raw_app_meta_data = raw_app_meta_data || '{\"role\": \"admin\"}' where email = 'admin@example.com'"
   ```

3. If the admin was already signed in, they sign out and in again, because the role is read from the sign-in token.

To remove the admin, delete the user in the dashboard. Their current sign-in token keeps working until it expires (an hour by default).

Email sign-up is still switched on, because Supabase's sign-up switch also covers phone numbers. Someone who signs up by email gets an account with no profile and no admin role, so the rules let them read only the public catalog, like a visitor.

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

`db advisors` warns that the booking functions run with their owner's rights and can be called by signed-in users (and `get_busy_slots` by visitors). That is intended: it is how the app changes bookings without being able to write the tables itself. Each function checks the caller first, and the tests prove customers cannot touch each other's bookings. The admin functions get the same warning; each refuses anyone without the admin role, and the tests check that. `rls_auto_enable` is Supabase's own event trigger, which turns on row level security for new tables; an event trigger function cannot be called through the API.

`auth_leaked_password_protection` asks to check passwords against known leaks. Only the admin has a password. Supabase offers this check on paid plans only; turn it on when the project moves to one.
