# Joteku

A mobile app (Android and iOS) for Joteku, an event centre, drinking bar and restaurant at Teshie 1st Junction on the Teshie-Nungua Road, Accra, Ghana. Joteku has served the community for over 40 years and is open daily from 10am to 11pm.

The app lets the public view the menu and venue, book a space for an event or meeting, reserve a table, pre-order food and drinks, pay by mobile money, and keep a record of their bookings and payments. It is designed to be simple: large buttons, few steps per task, minimal typing, English only.

The full scope, screens and business rules are in [PROJECT_BRIEF.md](PROJECT_BRIEF.md).

## Status

Early development. The project foundation is in place (navigation, theme, shared components) along with the Home screen. The Menu, Bookings, Profile, Book a Space and Reserve a Table screens are placeholders and will be built stage by stage.

## What the app will do

- **Book a space:** four huts (capacity 20, 20, 40 and 40) and the whole venue (150+ guests) for weddings, engagements, birthdays, receptions and meetings, with an availability calendar and a live price estimate.
- **Reserve a table:** choose a date, time and party size, optionally pre-order, and pay a deposit.
- **Menu:** browse food and drinks by category, search, and add items to a pre-order. The menu stays viewable once loaded so it works on weak networks.
- **Pay by mobile money:** MTN, Telecel and AirtelTigo, with payment status, receipts and transaction history.
- **My bookings:** upcoming and past bookings with status labels (Pending Payment, Confirmed, Cancelled, Completed), cancellation, and notifications.
- **Accounts:** phone number and OTP login, or continue as a guest. Menu browsing needs no account.

Payments are mocked for now, behind a simple interface so a real payment provider can be connected later.

## Tech stack

- [Expo](https://expo.dev) SDK 58 (managed workflow) and React Native
- TypeScript (strict mode)
- [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- Epilogue and Plus Jakarta Sans fonts

Planned for later: a Supabase backend and a separate Next.js admin web page.

## Getting started

You need [Node.js](https://nodejs.org) and the [Expo Go](https://expo.dev/go) app on your phone (or an Android emulator or iOS simulator).

```bash
npm install
npm start
```

Scan the QR code with Expo Go to open the app on your phone.

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Start and open on an Android device or emulator |
| `npm run ios` | Start and open on an iOS simulator (macOS only) |
| `npm run web` | Start and open in a browser |
| `npx tsc --noEmit` | Typecheck |
| `npx expo-doctor` | Check dependencies and config |
| `node scripts/generate-assets.mjs` | Regenerate the placeholder icon and splash images |

## Project structure

```
app/          Screens and navigation (Expo Router)
  (tabs)/     Bottom bar: Home, Menu, Bookings, Profile
components/   Small reusable UI components
theme/        Colours, fonts, spacing, radii and shadows (single source of truth)
data/         Mock data and sample content
types/        Shared TypeScript types
assets/       Placeholder icons and images
scripts/      Helper scripts
```

All colours, fonts and spacing live in `theme/`. Screens import from `@/theme` and never hardcode colours. The `@/` import alias points to the project root.

## Design

Main colour green, secondary light brown, cream background and a soft gold accent for key buttons, with large readable text and tap targets of at least 48px.
