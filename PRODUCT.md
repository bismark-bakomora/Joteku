# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Two apps on one hosted Supabase backend (`backend/`):

- `frontend/`: the customer app, Expo (React Native) for Android and iOS. Its design language is custom, the same on both systems, not native per OS.
- `admin/`: the admin web page, Next.js, in its own folder. Hosting is not decided yet; it must run locally now and deploy later to Vercel or any Node host without changes.

## Users

- **Customers** (customer app): event hosts (weddings, receptions, birthdays), meeting organisers (clubs, associations), and diners and drinkers who reserve tables and pre-order. Many are not used to apps.
- **The admin** (admin web page): one person at Joteku who runs bookings and the menu. Basic comfort with software, so the admin page needs big text, plain words and few choices per screen, like the customer app. Uses it on a laptop and on a phone about equally, often while working at the venue.

## Product Purpose

Joteku is an event centre, bar and restaurant at Teshie 1st Junction, Teshie-Nungua Road, Accra, Ghana, with over 40 years of history. Open 10am to 11pm every day. The product lets the public see the menu and venue, book a space (four huts or the whole venue), reserve a table with an optional pre-order, pay by mobile money, and keep a record of every payment. The admin page lets Joteku see what is booked today and ahead, block times, quote custom catering, manage the menu and prices, and track payments and refunds.

Success: customers book and pay without calling; the admin can answer "what is happening today and this week, and has it been paid?" in seconds, from any device.

## Positioning

A single, local venue's own booking system, not a marketplace: real huts with fixed capacities, Ghanaian food and drink, mobile money only (MTN, Telecel, AirtelTigo), and booking rules (full payment upfront, a 10-minute hold, tiered refunds) enforced by the database so double booking cannot happen.

## Operating Context

- Spaces: Hut 1 and Hut 2 (20 guests), Hut 3 and Hut 4 (40), Whole venue (over 150; it takes all four huts).
- Booking statuses: Pending Payment, Confirmed, Cancelled, Completed. Table deposits are 50% of the pre-order or GHS 50; the balance is paid at the venue.
- Custom catering is requested with a booking; the admin sends a quote, the customer pays it in the app with Pay Balance.
- Cancellation refunds: 80% at 14+ days, 50% at 7 to 13 days, none under 7 days (one date change allowed). If Joteku cancels, everything is refunded in full. Refunds go to the paying number within 5 working days.
- Prices, refund tiers, hold length and opening hours are admin settings in the database; the apps never hard-code them.
- Venue time is UTC (Accra has no daylight saving). Money is Ghana cedis, shown as GH₵ or GHS.
- Payments run through a mock provider until a real mobile money aggregator is connected; text messages are mocked.

## Capabilities and Constraints

- The admin signs in with email and password; their account carries `"role": "admin"` in app metadata, which the database checks. The admin page uses only the publishable key and the admin's session, never the secret key.
- Admin actions with rules go through database functions: `admin_block_time`, `admin_unblock_time`, `admin_quote_catering`, `admin_cancel_booking`. The catalog and settings are edited directly; items are hidden, never deleted.
- Menu photos go in the public `menu-photos` storage bucket.
- English only. No reviews, loyalty, promotions or social features.
- Undecided: the real payment provider, the real SMS provider, hosting for the admin page.

## Brand Commitments

- Name: Joteku. Text logo with a gold thatched-roof mark.
- Colours from the brief: main green (`#185232`), light brown secondary, cream or off-white background, one soft gold accent for key buttons.
- Warm, friendly, plain-spoken English. Greeting "Oobakɛ" (Ga for welcome) on the customer app.

## Evidence on Hand

- Real venue photos in `frontend/assets/` (huts and grounds). No food or drink photos yet; placeholders stand in.
- Real contact number 055 721 1216 (calls and WhatsApp). "Est. 1984" is a placeholder the owner will replace.
- No testimonials, press or sales figures exist; none may be invented.

## Product Principles

1. Few steps, big targets, plain words: every task should be obvious to someone not used to apps.
2. The server decides every price, deposit, refund and availability rule; screens only show them.
3. Money is always traceable: every payment and refund is visible with its booking and number.
4. Works on weak networks: show the last good data and clear loading, empty and error states everywhere.

## Accessibility & Inclusion

Large readable text and tap targets of at least 48px; simple layouts; English only. Users include older people and people with little app experience.
