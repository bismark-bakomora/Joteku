-- Catalog: what Joteku offers and the rules it prices by. Everyone can read it,
-- including people who are not signed in, because browsing needs no account.
-- Only the admin changes it (through the service role, from the admin page).

create extension if not exists btree_gist with schema extensions;

-- Internal tables and helpers live here. This schema is not exposed through the
-- Data API, so nothing in it can be reached from the app directly.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settings: a single row. Venue time is Africa/Accra, which is UTC all year.
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  opens_at time not null,
  closes_at time not null,
  hold_minutes integer not null check (hold_minutes between 1 and 60),
  table_deposit_rate numeric(4, 3) not null check (table_deposit_rate > 0 and table_deposit_rate <= 1),
  table_deposit_flat numeric(10, 2) not null check (table_deposit_flat >= 0),
  table_full_refund_hours integer not null check (table_full_refund_hours >= 0),
  table_visit_minutes integer not null check (table_visit_minutes > 0),
  last_table_before_close_minutes integer not null check (last_table_before_close_minutes >= 0),
  free_date_change_days integer not null check (free_date_change_days >= 0),
  refund_working_days integer not null check (refund_working_days > 0),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

comment on table public.settings is 'One row of venue hours, hold length, deposit and refund settings.';

-- Event refunds by how many whole days before the event the booking is cancelled.
create table public.refund_tiers (
  min_days_before integer primary key check (min_days_before >= 0),
  refund_rate numeric(4, 3) not null check (refund_rate between 0 and 1)
);

-- ---------------------------------------------------------------------------
-- Spaces. A space takes up one or more huts ("units"): each hut takes itself,
-- and the whole venue takes all four. Two bookings clash when they share a unit.
-- ---------------------------------------------------------------------------
create table public.spaces (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category text not null check (category in ('small', 'medium', 'whole')),
  name text not null,
  description text not null,
  capacity_label text not null,
  max_guests integer check (max_guests > 0),
  suitable_for_meetings boolean not null default false,
  hourly_rate numeric(10, 2) not null check (hourly_rate > 0),
  min_hours integer not null check (min_hours > 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.space_units (
  space_id text not null references public.spaces (id) on delete cascade,
  unit text not null check (unit ~ '^[a-z0-9-]+$'),
  primary key (space_id, unit)
);

create table public.decoration_packages (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
create table public.menu_categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  kind text not null check (kind in ('food', 'drink')),
  sort_order integer not null default 0
);

create table public.menu_items (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category_id text not null references public.menu_categories (id),
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price > 0),
  tag text,
  popular boolean not null default false,
  -- The admin hides an item by making it unavailable; the app never shows it.
  available boolean not null default true,
  photo_path text,
  sort_order integer not null default 0
);

create index menu_items_category_id_idx on public.menu_items (category_id);

-- ---------------------------------------------------------------------------
-- Access: read-only for everyone, rows the app should not show are filtered out.
-- ---------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.refund_tiers enable row level security;
alter table public.spaces enable row level security;
alter table public.space_units enable row level security;
alter table public.decoration_packages enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

grant select on
  public.settings,
  public.refund_tiers,
  public.spaces,
  public.space_units,
  public.decoration_packages,
  public.menu_categories,
  public.menu_items
to anon, authenticated;

create policy "Anyone can read the settings" on public.settings
  for select to anon, authenticated using (true);

create policy "Anyone can read the refund tiers" on public.refund_tiers
  for select to anon, authenticated using (true);

create policy "Anyone can read active spaces" on public.spaces
  for select to anon, authenticated using (active);

create policy "Anyone can read which huts a space takes" on public.space_units
  for select to anon, authenticated using (true);

create policy "Anyone can read active decoration packages" on public.decoration_packages
  for select to anon, authenticated using (active);

create policy "Anyone can read the menu categories" on public.menu_categories
  for select to anon, authenticated using (true);

create policy "Anyone can read available menu items" on public.menu_items
  for select to anon, authenticated using (available);

-- ---------------------------------------------------------------------------
-- Starting data, generated from the app's data/ files (prices are placeholders
-- from the brief that the admin can change).
-- ---------------------------------------------------------------------------

insert into public.settings (opens_at, closes_at, hold_minutes, table_deposit_rate, table_deposit_flat, table_full_refund_hours, table_visit_minutes, last_table_before_close_minutes, free_date_change_days, refund_working_days) values
  ('10:00', '23:00', 10, 0.5, 50, 24, 180, 60, 7, 5);

insert into public.refund_tiers (min_days_before, refund_rate) values
  (14, 0.8),
  (7, 0.5),
  (0, 0);

insert into public.spaces (id, category, name, description, capacity_label, max_guests, suitable_for_meetings, hourly_rate, min_hours, sort_order) values
  ('hut-1', 'small', 'Hut 1', 'A private hut for meetings, club gatherings and small celebrations.', 'Up to 20 guests', 20, true, 150, 2, 1),
  ('hut-2', 'small', 'Hut 2', 'A private hut that suits meetings, family lunches and birthdays.', 'Up to 20 guests', 20, true, 150, 2, 2),
  ('hut-3', 'medium', 'Hut 3', 'A spacious hut for birthdays, anniversaries and reunions.', 'Up to 40 guests', 40, false, 250, 3, 3),
  ('hut-4', 'medium', 'Hut 4', 'A spacious hut with room for a bigger group of family and friends.', 'Up to 40 guests', 40, false, 250, 3, 4),
  ('whole-venue', 'whole', 'Whole Venue', 'The whole venue for weddings, engagement receptions and large events.', '150+ guests', null, false, 1500, 5, 5);

insert into public.space_units (space_id, unit) values
  ('hut-1', 'hut-1'),
  ('hut-2', 'hut-2'),
  ('hut-3', 'hut-3'),
  ('hut-4', 'hut-4'),
  ('whole-venue', 'hut-1'),
  ('whole-venue', 'hut-2'),
  ('whole-venue', 'hut-3'),
  ('whole-venue', 'hut-4');

insert into public.decoration_packages (id, name, description, price, sort_order) values
  ('basic', 'Basic', 'Simple table settings and entrance decor.', 1000, 1),
  ('standard', 'Standard', 'Themed table settings, stage backdrop and lighting.', 2500, 2),
  ('premium', 'Premium', 'Full themed decor with stage, floral pieces and ambient lighting.', 5000, 3);

insert into public.menu_categories (id, name, kind, sort_order) values
  ('rice-dishes', 'Rice Dishes', 'food', 1),
  ('local-dishes', 'Local Dishes', 'food', 2),
  ('grills', 'Grills', 'food', 3),
  ('beer', 'Beer', 'drink', 4),
  ('spirits', 'Spirits', 'drink', 5),
  ('wine', 'Wine', 'drink', 6),
  ('soft-drinks', 'Soft Drinks', 'drink', 7);

insert into public.menu_items (id, category_id, name, description, price, tag, popular, available, sort_order) values
  ('jollof-grilled-tilapia', 'rice-dishes', 'Jollof & Grilled Tilapia', 'Smoky party jollof with spiced grilled fresh tilapia and shito', 75, 'Freshly Prepared', true, true, 1),
  ('fried-rice-chicken', 'rice-dishes', 'Fried Rice & Chicken', 'Vegetable fried rice with crispy fried chicken and pepper sauce', 70, null, false, true, 2),
  ('banku-fried-fish', 'local-dishes', 'Banku & Fried Fish', 'Hot soft banku, crispy fried fish and Ga hot pepper', 65, 'Teshie Favourite', true, true, 3),
  ('goat-light-soup-fufu', 'local-dishes', 'Goat Light Soup & Fufu', 'Smooth pounded fufu in a rich, spiced goat meat light soup', 80, 'Chef Special', true, true, 4),
  ('kenkey-fried-fish', 'local-dishes', 'Kenkey & Fried Fish', 'Ga kenkey with fried fish, shito and fresh pepper', 55, null, false, true, 5),
  ('red-red-plantain', 'local-dishes', 'Red Red & Fried Plantain', 'Beans stew cooked in palm oil with sweet fried plantain', 45, null, false, true, 6),
  ('grilled-chicken-chips', 'grills', 'Grilled Chicken & Chips', 'Spiced grilled chicken quarter with chips and kachumbari', 70, null, false, true, 7),
  ('chichinga-skewers', 'grills', 'Chichinga Skewers', 'Spicy grilled beef skewers with onions and pepper', 35, null, false, true, 8),
  ('club-beer-large', 'beer', 'Club Beer (Large 625ml)', 'Crisp, chilled lager straight from the bar cooler', 25, 'Ice Cold', true, true, 9),
  ('star-beer-large', 'beer', 'Star Beer (Large 625ml)', 'Light, refreshing lager served ice cold', 25, null, false, true, 10),
  ('alomo-bitters-tot', 'spirits', 'Alomo Bitters (Tot)', 'Ghanaian herbal bitters, served by the tot', 10, null, false, true, 11),
  ('johnnie-walker-red-tot', 'spirits', 'Johnnie Walker Red (Tot)', 'Blended Scotch whisky, served by the tot', 25, null, false, true, 12),
  ('red-wine-glass', 'wine', 'Red Wine (Glass)', 'Smooth, medium-bodied red wine by the glass', 35, null, false, true, 13),
  ('chilled-sobolo', 'soft-drinks', 'Chilled Sobolo', 'Homemade hibiscus drink with ginger and cloves', 15, null, false, true, 14),
  ('bottled-water', 'soft-drinks', 'Bottled Water', 'Chilled bottled water, 750ml', 5, null, false, true, 15),
  ('soft-drink-bottle', 'soft-drinks', 'Soft Drink (Bottle)', 'Coke, Fanta or Sprite, served cold', 8, null, false, true, 16);
