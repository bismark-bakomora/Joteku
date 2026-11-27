# Joteku Admin

The admin web page for Joteku: bookings, the calendar and blocked times, catering quotes, the menu, payments and refunds, and prices and settings. It is for one admin and works on a laptop or a phone.

It is a Next.js 16 app (App Router, TypeScript, CSS Modules) on the same Supabase project as the customer app.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # http://localhost:3000
```

`.env.local` needs only the project URL and the **publishable** key, the same pair as the customer app. Never put the secret key here. The admin's rights come from their own sign-in.

Other commands:

```bash
npm run typecheck   # tsc
npm run lint        # eslint (next/core-web-vitals + typescript)
npm run build       # production build
npm start           # serve the production build
```

## Signing in

Sign in with the admin account's email and password. The account must have `"role": "admin"` in its app metadata; `backend/README.md` explains how to make one. Anyone else is signed out again with a message.

The session lives in cookies (`@supabase/ssr`):

- `proxy.ts` refreshes it on every request and sends anyone who is not the admin to `/login`.
- `app/(admin)/layout.tsx` checks it again on the server.
- The database checks the admin role on every query and function, so these two checks only make the pages behave; they are not the security.

## How it is built

- `app/(admin)/` holds the six sections. Each is a list on the left and the chosen item on the right (`components/Workspace.tsx`). On a phone they become two screens, and the side menu becomes a bottom bar (`components/Shell.tsx`). The chosen item and filters are kept in the address, so Back, refresh and shared links work.
- Everything with a rule goes through the database's admin functions: `admin_quote_catering`, `admin_cancel_booking`, `admin_block_time` and `admin_unblock_time`. Their error messages are shown as they come (`lib/errors.ts`). The catalog and settings are edited directly; items are hidden, never deleted.
- Menu photos upload to the public `menu-photos` bucket as `<item id>/<timestamp>.<ext>`, and the path is saved in `menu_items.photo_path`. The customer app does not show menu photos yet.
- Venue time is UTC, so `lib/format.ts` formats every date and time in UTC, whatever the computer's own time zone is.
- `components/HutMap.tsx` draws the venue's four huts, lit for the huts a booking or block takes. It is used in lists, booking details, the calendar and the block-time form.
- Colours, type and spacing are CSS variables in `app/globals.css`, matching the customer app's green, cream and gold.

## Hosting

Not decided yet. It runs on any Node host or on Vercel without changes; set the two environment variables there.
