---
name: Joteku
description: The venue's own booking world, deep hut-green and cream with one gold action, shared by the customer app and the admin web page.
colors:
  green: "#185232"
  green-hover: "#1f6340"
  green-press: "#0f3d24"
  on-green: "#ffffff"
  on-green-muted: "#b9dcc4"
  rail-text: "#e1ede4"
  mint: "#b4f0c5"
  on-mint: "#165131"
  mint-soft: "#e1ede4"
  cream: "#fff8f3"
  surface: "#ffffff"
  surface-muted: "#faf2eb"
  surface-container: "#f4ede6"
  surface-high: "#eee7e0"
  border: "#e8e2d8"
  border-strong: "#cfc6ba"
  outline: "#717971"
  text: "#1e1b17"
  text-subtle: "#404942"
  text-muted: "#625f58"
  gold: "#cca730"
  gold-hover: "#d8b440"
  on-gold: "#3d2f00"
  gold-soft: "#ffe088"
  on-gold-soft: "#241a00"
  brown: "#805533"
  brown-tint: "#ffdcc5"
  on-brown-tint: "#653d1e"
  success: "#167d46"
  confirmed-bg: "#d7f0e1"
  confirmed-text: "#12613a"
  pending-bg: "#fff3d6"
  pending-text: "#735c00"
  cancelled-bg: "#ffdad6"
  error: "#ba1a1a"
  error-hover: "#9c1515"
  on-error: "#ffffff"
  error-text: "#8c1111"
  error-border: "#f2b8b2"
  placeholder: "#6f6a62"
  roof: "#cca730"
  roof-line: "#4f3d00"
  completed-bg: "#eee7e0"
typography:
  display:
    fontFamily: "Epilogue, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Epilogue, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  tap: "48px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-gold-hover:
    backgroundColor: "{colors.gold-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.brown}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.brown-tint}"
  button-quiet:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.green}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-high}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.error-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  list-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  pill-confirmed:
    backgroundColor: "{colors.confirmed-bg}"
    textColor: "{colors.confirmed-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  pill-pending:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending-text}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  pill-cancelled:
    backgroundColor: "{colors.cancelled-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  pill-completed:
    backgroundColor: "{colors.completed-bg}"
    textColor: "{colors.text-subtle}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  pill-gold:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.on-gold-soft}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  rail:
    backgroundColor: "{colors.green}"
    textColor: "{colors.rail-text}"
    width: "248px"
  rail-link-active:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.green}"
    rounded: "{rounded.md}"
    height: "52px"
  count-badge:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.full}"
  segment-selected:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    rounded: "{rounded.sm}"
    height: "48px"
  more-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "8px"
    width: "240px"
  more-link-active:
    backgroundColor: "{colors.mint-soft}"
    textColor: "{colors.green}"
    rounded: "{rounded.md}"
    height: "52px"
  hut-tile-lit:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    size: "22px"
  hut-tile-dark:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.text-muted}"
    size: "22px"
---

# Design System: Joteku

## Overview

**Creative North Star: "The Hut Ledger"**

Joteku is one venue with four thatched huts, run by people who know every booking by name. The system reads like the venue's own ledger kept on warm paper: a deep hut-green frame, a cream ground, white cards that carry the facts, and a single gold mark for the thing to do next. It is the customer app's world first (built in React Native from `frontend/theme/`), and the admin web page (`admin/`, CSS variables in `admin/app/globals.css`) inherits it unchanged in hue and role, adding a side rail, a list-and-detail workspace and the hut map.

Density is generous by design. Body text is 17px on the web, every control the admin taps is at least 48px tall, and each screen offers few choices in plain words, because the people using both apps include older customers and an admin with basic software comfort who works from a phone at the venue as often as from a laptop. Hierarchy comes from size, weight and the green/cream contrast, not from decoration. Numbers that matter (money, times, counts) are set in tabular figures.

The admin refuses the KPI-tile dashboard and modal-heavy CRUD tables: work happens in one list-and-detail pane, like an inbox. The customer app adds a dark palette (`darkColors` in `frontend/theme/colors.ts`: warm near-black surfaces, lifted greens, browns and gold); the admin is light only (`color-scheme: light`).

**Key Characteristics:**
- Deep green frame (rail, bottom bar, selected states) around a cream ground and white cards.
- Gold is the one action colour; brown is the reference and secondary-action colour.
- Epilogue for headings, Plus Jakarta Sans for everything else, tabular numerals for money and times.
- Soft, low, warm-tinted shadows; no borders on cards.
- The hut map: four tiny thatched-hut tiles lit green for the huts a booking takes.
- 48px tap targets and 17px body text as floors, not targets.

## Colors

A warm, earthy palette: one deep forest green, a creamy paper ground, gold as a scarce accent and a clay brown, with status tints drawn from the same family.

### Primary
- **Hut Green** (green): the brand. The admin rail and phone bottom bar, primary buttons, selected segments, the selected list row's 2px border, lit hut tiles, today's date, links such as the customer phone number, and the "Paid" total line. `theme-color` and the mobile app's `app.json` share it. Hover lifts to **Canopy Green** (green-hover); the whole-venue pick presses down to **Forest Floor** (green-press).
- **Mint** (mint, mint-soft): text selection, the empty-state icon disc, and the rail's light text tone.

### Secondary
- **Clay Brown** (brown): booking references (JTK-...) and outline buttons for secondary or destructive-by-policy actions such as "Cancel for Joteku". Its hover tint is **Peach Clay** (brown-tint).

### Tertiary
- **Thatch Gold** (gold): the one main action in a pane ("Update catering quote", "Send quote"), the rail's and calendar's count badges, the lit hut's roof, and the 3px focus ring.
- **Roof Gold** (roof) and **Roof Thatch** (roof-line): the roof mark's own tokens, the same values as gold and the mobile app's onGold, kept separate so the logo never shifts when an action colour is tuned. Text on it is **Dark Thatch** (on-gold). **Pale Gold** (gold-soft) backs informational pills such as "Quoted, not paid".

### Neutral
- **Cream Paper** (cream): the page ground, and the active rail tab (cream on green).
- **Card White** (surface): cards, list rows, inputs, calendar days.
- **Warm Parchment** (surface-muted): the list column behind the rows on wide screens.
- **Sand** (surface-container) and **Dune** (surface-high): segmented tracks, quiet buttons, unlit huts, skeletons, disabled buttons.
- **Linen Rule** (border) for hairline dividers inside cards; **Dry Reed** (border-strong) for input strokes and hover borders; **Stone** (outline) for input hover.
- **Ink** (text), **Moss Ink** (text-subtle) for labels and secondary lines, **Ash** (text-muted) for fact labels, phone numbers in rows and hints. **Faded Ash** (placeholder) for input placeholders only, dark enough to clear 4.5:1 on white and cream.

### Status
- Confirmed: green tint (confirmed-bg) with deep green text. Pending: pale yellow (pending-bg) with ochre text. Cancelled: rose (cancelled-bg) with error red. Completed and neutral: Dune with Moss Ink. The mobile app uses the same four backgrounds.
- Error family: **Error Red** (error) fills the danger button (white on-error text, darkening to error-hover); **Deep Error** (error-text) is the text of error notices on rose; **Rose Edge** (error-border) outlines the cancel confirm panel.

### Named Rules
**The One Gold Action Rule.** A pane carries at most one gold button, and it is the next thing the admin should do. Gold elsewhere is only for counts, the roof mark, the lit roof and focus. Everything else is green, quiet, brown outline or danger.

**The Brown Reference Rule.** Booking references and the secondary action beside the gold one are Clay Brown. Brown never fills a large surface.

**The Shared Palette Rule.** A colour change is made in both `admin/app/globals.css` and `frontend/theme/colors.ts` (light palette), so the two apps stay one world. Known deliberate differences: on-gold is darker on the web (#3d2f00 vs #4F3D00) and text-muted is darker on the web (#625f58 vs #6B6B63) for contrast at web sizes.

## Typography

**Display Font:** Epilogue 600/700 (with Segoe UI, sans-serif)
**Body Font:** Plus Jakarta Sans 400/600/700 (with Segoe UI, sans-serif)
**Greeting Font (customer app only):** Noto Sans 600/700, for the Ga greeting "Oobakɛ", whose letters the other two faces lack.

**Character:** Epilogue gives headings a sturdy, slightly geometric warmth; Plus Jakarta Sans keeps forms, facts and money friendly and very legible. Large sizes, plain weights, no italics.

### Hierarchy
- **Display** (Epilogue 600, 30px, 1.2, -0.01em): page titles ("Bookings") and the detail title ("Wedding · Whole Venue"). Balanced wrapping.
- **Headline** (Epilogue 600, 24px, 1.2): h2 section headings.
- **Title** (Plus Jakarta Sans 700, 20px): card titles ("Money", "Catering"), month name, empty-state titles. Card-level headings switch to the body face at bold, not Epilogue.
- **Body** (Plus Jakarta Sans 400, 17px, 1.5): all running text and inputs; fact values step up to 20px/600. Request text is capped at 65ch.
- **Body small** (15px): row dates, money row labels, secondary lines.
- **Label** (Plus Jakarta Sans 600, 15px): field labels, segment labels, fact labels.
- **Caption** (Plus Jakarta Sans 700, 13px): status pills, count badges, hints (hints at 400).

The mobile app uses the same roles at native sizes (display 28, headline 24, title 18, body 16, caption 13) in `frontend/theme/typography.ts`.

### Named Rules
**The Tabular Money Rule.** Every amount, time and count is set with tabular numerals (the `.num` class on the web), so columns of cedis and times line up.

**The 17 Floor Rule.** Body text on the admin web page is never smaller than 17px; 13px is reserved for pills, badges and hints.

## Layout

The admin is a three-column frame on wide screens: the green **rail** (248px, sticky, full height), the **list column** (420px, sticky, own scroll, Warm Parchment ground with a hairline right border), and the **detail pane** (fluid, 32px/40px padding, content capped at 820px). Below 1180px the list narrows to 360px and the detail padding drops to 24px.

At 900px and below the rail becomes a fixed **bottom bar** (green, five equal tabs: Bookings, Calendar, Catering, Menu, More; icon over a 14px label, 60px tall, safe-area aware; Payments, Prices & settings and Sign out move into the More panel) and the workspace shows one column at a time: the list, or the detail with a green "Back" control. Content gets bottom padding equal to the bar (68px plus safe area). The login page splits 5:7 into a green brand panel and a form column, collapsing to the form alone under 800px.

Spacing follows a 4px base (4, 8, 12, 16, 20, 24, 32, 40). Cards pad 24px; list rows pad 12px 16px with 8px between rows; facts sit in an auto-fill grid of 220px minimum columns with a 20px by 32px gap, two columns on phones. The mobile app uses the same base (4, 8, 16, 24, 32, 40) with a 16px screen gutter and a 640px content cap on tablets.

### Named Rules
**The Inbox Rule.** Admin work happens in a list on the left and a detail on the right; actions happen in the detail without leaving the page. No modal CRUD, no KPI tile grid.

**The 48 Rule.** Every interactive control is at least 48px tall (`--tap`). Segmented options, small buttons and the search field included. Rail and More links are 52px, bottom-bar tabs 60px, hut picks 64px.

## Elevation & Depth

Depth is soft and low: warm-tinted shadows (tinted with #24211D, never pure black) lift white cards off the cream ground, and borders are reserved for hairline dividers inside cards and for selection. Selection raises: the selected list row or calendar day gains a 2px green border and steps up to the raised shadow.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 2px 8px rgba(36, 33, 29, 0.06)`): cards, list rows, calendar days at rest.
- **Raised** (`box-shadow: 0 8px 24px rgba(36, 33, 29, 0.12)`): the selected row or day, and the phone More panel.
- **Bar** (`box-shadow: 0 -4px 16px rgba(36, 33, 29, 0.14)`): the phone bottom bar only. The mobile app's equivalent is its floating shadow (0 4px 16px, 0.18).
- **Focus glow** (`box-shadow: 0 0 0 3px rgba(24, 82, 50, 0.18)`): focused inputs, with a green border.

### Named Rules
**The Soft Ground Rule.** Shadows are diffuse and low-opacity. No hard offset shadows, no dark drop shadows, no glassmorphism.

## Shapes

Gently rounded throughout: 8px for segments and the focus ring, 12px for buttons, inputs, list rows and hut picks, 16px for cards and confirm panels, fully round for pills, badges and the date circle. The recurring silhouette is the thatched roof: a wide, slightly sagging triangle (the roof mark in gold with darker thatch strokes, drawn identically by `admin/components/RoofMark.tsx` and the customer app's `RoofMark`), reduced to a single roof shape on each hut tile.

## Components

### Buttons
Big, solid and plain-spoken, always with a visible word and an optional 16-20px line icon.
- **Shape:** gently rounded (12px), 48px tall, 0 20px padding, 700 weight at 17px, 1.5px border.
- **Primary (green):** Hut Green with white text; hover Canopy Green.
- **Gold:** the one main action (see The One Gold Action Rule); hover lightens to gold-hover.
- **Outline (brown):** transparent with a brown border and brown text; hover fills with Peach Clay.
- **Quiet:** Sand fill with green text; the default for minor actions (month arrows, unblock, remove).
- **Small:** 15px text and 16px side padding, still 48px tall.
- **Danger:** error red with white text, darkening on hover, used only inside the cancel confirmation panel.
- **States:** pressed buttons nudge down 1px; disabled buttons go Dune with Ash text; loading shows an 18px spinner in the text colour. Transitions are 160ms on the shared ease-out curve.

### Status Pills
- **Style:** fully rounded, 3px 10px, 13px bold, a 7px dot in the text colour, then the label.
- **Tones:** Confirmed, Pending, Cancelled, Completed, plus Gold for informational money states.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Card White on Cream Paper.
- **Shadow Strategy:** Card shadow at rest (see Elevation).
- **Border:** none; internal rows divide with 1px Linen Rule lines.
- **Internal Padding:** 24px. Card titles are 20px Plus Jakarta Sans bold with an optional icon.
- **Confirm panel:** the cancel confirmation opens in place as a rose (cancelled-bg) panel with a 1.5px Rose Edge border and a 16px radius, a heading, a plain explanation and its buttons; it replaces a modal.

### Inputs / Fields
- **Style:** Card White, 1.5px Dry Reed stroke, 12px radius, 48px tall, 17px text; a 600-weight 15px label above and a 13px Ash hint below. Prefixed fields (GH₵) indent the text to 64px. Caret and checkbox accents are green; checkboxes are 22px within a 48px row.
- **Focus:** border turns green with the 3px green focus glow. Elsewhere, keyboard focus is a 3px gold outline offset 2px.
- **Error:** border turns error red (`aria-invalid`).

### Navigation
- **Rail:** Hut Green, 24px 16px padding, the roof mark and "Joteku" wordmark at top, six links (22px line icons, 17px 600 labels, 52px tall, 12px radius). Hover fills Canopy Green; the current page is a cream tab with green text. Gold count badges sit at the right edge for today's bookings and waiting quotes. The account email and Sign out sit at the bottom above a faint divider.
- **Phone bottom bar:** five equal columns (Bookings, Calendar, Catering, Menu, More), icon above a 14px short label, the 13px gold count badge pinned top-right of the icon, the current page a cream tab. More is current when Payments or Settings is open.
- **More panel:** tapping More raises a white panel (16px radius, raised shadow, 240px minimum, 8px padding) just above the bar at its right edge, listing Payments, Prices & settings and Sign out as 52px rows with icons; hover is Sand, the current page Soft Mint with green text. It closes on navigation, Escape or a tap outside.
- **Segmented filters:** a Sand track with 4px padding; options are transparent 48px-tall 15px 600 labels; the chosen option is Hut Green with white text.

### Hut Map (signature)
Four small tiles in a row, one per hut (Hut 1 to 4), each a tiny roof over its number. Unlit huts are Dune with a Dry Reed roof; lit huts are Hut Green with a gold roof and white number. A booking lights the huts it takes; the whole venue lights all four; tables light none. Sizes: **small** (22px tiles, 6px radius) in list rows, **large** (48 by 44px, 10px radius) in the detail header, **mini** (8px squares, no roof or number) inside calendar days. As a control (**hut picker**, used in the block-time form) it becomes four 64px roof buttons plus a wider "Whole venue" button that presses to Forest Floor and lights every hut; under 520px the whole-venue button drops to its own full row. It always carries an accessible description ("Takes Hut 1 and Hut 3").

### Booking Detail
The title leads in Display ("Wedding · Whole Venue"), with the status pill and the brown 15px bold reference (normal tracking) on one line beneath it and the large hut map at the right. A header action row holds the gold catering-quote action and the brown outline "Cancel for Joteku". Below sit cards: facts (Date, Time, Guests, Paid, Customer with a green underlined phone link, Decoration, Booked), Money (hairline rows, the Paid line in green bold), Catering and Payments. The pane settles in over 240ms on the ease-out curve (opacity 0.4 to 1, rising 8px). With nothing selected, the pane shows the roof mark at 72px and 55% opacity above a short plain prompt.

### List Rows
White, 12px radius, card shadow, a transparent 2px border that shows Dry Reed on hover and Hut Green when selected (with the raised shadow). Top line: bold title ("Birthday · Hut 3") with the status pill at right; then the date and time in Moss Ink; then the phone number in Ash with the small hut map at right.

### States
Every data view has loading (shimmering Sand-to-Dune skeletons), empty (a 56px mint disc with a green line icon, a bold title and a 36ch explanation) and error (the same shape in rose and red, with a retry button). Notices are 12px-radius tinted bars (error, success, info) in 15px 600 text. Reduced motion turns all motion off.

## Do's and Don'ts

### Do:
- **Do** keep every tappable control at least 48px tall and body text at 17px on the web.
- **Do** use one gold button per pane for the next action, with brown outline beside it for the secondary one.
- **Do** set money, times and counts in tabular numerals and write cedis as GH₵.
- **Do** show which huts a booking or block takes with the hut map wherever a booking appears.
- **Do** take every colour, size, radius and shadow from the tokens (`admin/app/globals.css`, `frontend/theme/`), and change both apps together.
- **Do** confirm destructive actions in place with the rose confirm panel, explaining the refund in plain words.
- **Do** give every list and detail its loading, empty and error state.

### Don't:
- **Don't** build KPI tile dashboards or modal-heavy CRUD tables for the admin.
- **Don't** use gold for decoration, large fills, or more than one action per pane.
- **Don't** use hard offset shadows, pure-black shadows or borders around cards.
- **Don't** use uppercase tracked labels above headings or as section labels.
- **Don't** set body text below 17px on the web or controls below 48px.
- **Don't** hardcode a colour in a screen; add it to the tokens.
