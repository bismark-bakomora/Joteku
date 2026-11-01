Build a cross-platform mobile app (Android and iOS) named Joteku, plus a separate admin web page.

ABOUT JOTEKU
Joteku is an event centre, drinking bar and restaurant in Ghana with over 40 years of history, located at Teshie 1st Junction on the Teshie-Nungua Road. People come to eat and drink with loved ones, and to book the venue for events (weddings, engagement receptions, birthdays, any reception) and meetings (clubs and associations). Opening hours are 10am to 11pm, and events can be booked every day.

GOAL
Make it easy for the public to see the menu and venue, book a space, pay by mobile money, pre-order food, reserve a table, and keep a record of all transactions. The app must be simple, with large buttons, few steps per task, minimal typing and English only.

USERS
1. Event hosts (weddings, receptions, birthdays)
2. Meeting organisers (clubs, associations)
3. Diners and drinkers (menu, table reservation, pre-order)
4. One admin user on the web page

VISUAL DESIGN
Main colour green, secondary colour light brown, cream or off-white background, one soft gold accent for key buttons. Use placeholder food, drink and venue photos and a text logo for now. Large readable text, clear icons, warm and friendly feel.

SPACES (bookable)
Hut 1: capacity 20. Hut 2: capacity 20. Hut 3: capacity 40. Hut 4: capacity 40. Whole venue: capacity over 150 (for weddings and large events). Huts 1 and 2 suit meetings.

ACCOUNTS
Users can sign up or log in with phone number and OTP (email optional), or continue as a guest using a phone number and OTP. Guests can find their bookings later using the same phone number. Menu browsing needs no account.

MOBILE SCREENS
1. Splash and welcome: log in, sign up, or continue as guest
2. Sign up and log in
3. Home: large buttons for Book a Space, Reserve a Table, Menu, My Bookings, Contact
4. About Joteku: 40-year story, facilities, photo gallery
5. Venue and spaces: list of the 4 huts and whole venue with photos, capacity and a Book this space button
6. How to book: short explanation of steps, payment and policy
7. Booking form: event type (wedding, engagement, birthday, other reception, meeting), space, date, start time, end time, guest count, notes
8. Availability calendar: taken dates and times greyed out, times limited to 10am to 11pm
9. Extras: choose a decoration package; text box to request custom catering
10. Booking summary and price estimate: updates live; accept cancellation policy; proceed to pay
11. Mobile money payment: enter number, choose network (MTN, Telecel, AirtelTigo), approve on phone prompt
12. Payment status: success, pending or failed, with retry
13. Confirmation and receipt: booking reference, download or share receipt, add to phone calendar
14. Food menu: categories, search, photos, prices, add to pre-order
15. Drinks menu: categories (beer, spirits, wine, soft drinks), search, photos, prices, add to pre-order
16. Cart and pre-order
17. Table reservation: date, time, number of people, optional pre-order, deposit payment
18. My bookings: upcoming and past bookings, reservations and orders; open details; cancel; status labels
19. Transaction history: all payments and refunds; filter by date or type; view and download receipts
20. Location and contact: map, call button, WhatsApp button
21. Notifications: booking updates and reminders
22. Profile and settings
23. Terms and policies: cancellation and payment terms

CORE JOURNEY (event or meeting booking)
Home, Book a Space, choose type, space, date, time and guests, availability check, optional decoration and catering request, price estimate and summary, accept policy, pay full amount by mobile money, automatic confirmation with reference number and receipt, visible in My Bookings.

TABLE RESERVATION JOURNEY
Reserve a Table, choose date, time and party size, optionally add menu items, pay deposit by mobile money, reservation confirmed after payment.

BUSINESS RULES
- Payments are by mobile money only, all networks. Use a mocked payment service for now, built behind a simple interface so a real aggregator can be connected later.
- Event and meeting bookings are paid in full upfront and are confirmed automatically after payment.
- The upfront payment covers venue hire and the decoration package. Custom catering is not in the estimate: the request is sent with the booking, the admin sends a quote, and the customer pays it in the app through a Pay Balance step.
- Table reservation deposit: 50 percent of the pre-order total, or GHS 50 if there is no pre-order. The balance is paid at the venue.
- A slot is held for 10 minutes once payment starts, and released if payment fails or times out. Prevent double booking.
- Booking status labels: Pending Payment, Confirmed, Cancelled, Completed.
- Send in-app notifications and SMS (mocked) for confirmation, receipts and reminders before the event date.

PLACEHOLDER PRICING (GHS, easy to change in admin settings)
Hut 1 or Hut 2: 150 per hour, minimum 2 hours. Hut 3 or Hut 4: 250 per hour, minimum 3 hours. Whole venue: 1,500 per hour, minimum 5 hours. Decoration Basic 1,000, Standard 2,500, Premium 5,000.

CANCELLATION AND REFUND POLICY (show on the summary screen and in Terms)
- 14 days or more before the event: 80 percent refund
- 7 to 13 days before: 50 percent refund
- Less than 7 days before: no refund, but one date change allowed subject to availability
- One free date change if requested at least 7 days before the event
- If Joteku cancels: full refund
- Table reservations and pre-orders: full deposit refund if cancelled at least 24 hours before the reservation time
- Refunds go to the same mobile money number within 5 working days

ADMIN WEB PAGE (separate, one admin user, no mobile screens)
Login; dashboard with today and upcoming bookings, reservations and pre-orders; bookings list and calendar with the ability to block dates or times; custom catering requests with quote sending and payment tracking; table reservations and pre-orders; menu management (add, edit, hide items, prices, photos); price and deposit settings; payments, refunds and a downloadable transaction report.

DATA TO SEED
Create realistic sample data: about 8 food items and 8 drinks across categories with placeholder prices, the 5 bookable spaces, the decoration packages, and a few sample bookings so the calendar and history screens are populated.

NON-GOALS FOR THIS VERSION
No reviews, loyalty points, promotions, other languages or social features.

QUALITY
Make the menu stay viewable once loaded so it works on weak networks. Show clear loading, empty and error states on every screen. Keep navigation simple with a bottom bar: Home, Menu, Bookings, Profile.