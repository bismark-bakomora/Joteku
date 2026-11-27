---
version: 1
slug: "admin"
primary_target: "admin"
related_targets: []
---

# Admin web page

Scope: `admin/`, the whole Next.js admin app. Visitor mode: Operate.

Audience and job: the one Joteku admin, basic comfort with software, on a laptop and a phone about equally, often at the venue. Answers "what is happening today and ahead, and is it paid?", sends catering quotes, blocks times, cancels for Joteku, edits the menu, prices and settings, and checks payments and refunds. Proof is the live data; nothing is invented.

Constraints: big text (17px body), 48px targets, plain words, few choices per screen; every screen has loading, empty and error states; the database decides every rule.

## Direction contract

THESIS: one list-and-detail workspace, like an inbox: pick a booking, item or day on the left, act on it on the right. It refuses the KPI-tile dashboard and modal-heavy CRUD tables.

OWN-WORLD: the customer app's world: deep green #185232 side rail with cream active tab, cream #FFF8F3 ground, white cards with soft offset shadows, gold #CCA730 only for the main action, brown #805533 for references and secondary actions. Epilogue headings, Plus Jakarta Sans for everything else, tabular numerals for money and times.

STORY: the admin sees today's bookings first, opens one, understands who, where, when and what was paid in one card, and does the next action (quote, cancel, block) without leaving the page.

FIRST VIEWPORT: green rail (logo, six sections with gold counts) left; list column (title, When and Kind filters, search, booking rows with status pills and the hut map) centre; detail pane (reference, title, facts grid, money, catering, payments, actions) right. Phone: rail becomes a bottom bar, list and detail become two screens.

FORM: list-and-detail, position 7 of 7 on my list, dealt lead. seed:9589f9055bc3021d. Signature move: the hut map, four small thatched-hut tiles (Hut 1 to 4) lit green for the huts a booking or block takes; the whole venue lights all four. It appears in rows, the detail pane, the calendar and the block-time form, where tapping the tiles chooses the space.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
