// Rows the admin page reads. Column names follow the database (see backend/).

export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
export type CateringStatus = 'requested' | 'quoted' | 'paid';

export type CateringRequest = {
  booking_id: string;
  details: string;
  status: CateringStatus;
  quote_amount: number | null;
  quoted_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type PreOrderLine = {
  item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
};

export type Booking = {
  id: string;
  reference: string;
  kind: 'space' | 'table';
  status: BookingStatus;
  phone: string;
  created_at: string;
  hold_expires_at: string | null;
  starts_at: string;
  ends_at: string;
  amount_due: number;
  amount_paid: number;
  refunded_amount: number;
  cancelled_at: string | null;
  cancelled_by: 'customer' | 'joteku' | 'hold_expired' | null;
  event_type: string | null;
  space_id: string | null;
  guest_count: number | null;
  notes: string | null;
  decoration_id: string | null;
  venue_hire_amount: number | null;
  decoration_amount: number | null;
  date_change_used: boolean;
  previous_starts_at: string | null;
  party_size: number | null;
  pre_order_total: number | null;
  balance_at_venue: number | null;
  customer: { name: string | null; email: string | null } | null;
  catering: CateringRequest | null;
  lines: PreOrderLine[];
};

export const BOOKING_SELECT = `
  id, reference, kind, status, phone, created_at, hold_expires_at, starts_at, ends_at,
  amount_due, amount_paid, refunded_amount, cancelled_at, cancelled_by,
  event_type, space_id, guest_count, notes, decoration_id, venue_hire_amount, decoration_amount,
  date_change_used, previous_starts_at, party_size, pre_order_total, balance_at_venue,
  customer:profiles(name, email),
  catering:catering_requests(booking_id, details, status, quote_amount, quoted_at, paid_at, created_at),
  lines:booking_pre_order_lines(item_id, name, unit_price, quantity)
`;

export type Payment = {
  id: string;
  booking_id: string;
  type: 'payment' | 'refund';
  purpose: 'space_booking' | 'table_deposit' | 'catering_balance';
  status: 'pending' | 'success' | 'failed';
  amount: number;
  phone: string;
  network: 'mtn' | 'telecel' | 'airteltigo';
  description: string;
  refund_of: string | null;
  created_at: string;
  completed_at: string | null;
  booking: { reference: string } | null;
};

export const PAYMENT_SELECT = `
  id, booking_id, type, purpose, status, amount, phone, network, description, refund_of,
  created_at, completed_at, booking:bookings!payments_booking_id_fkey(reference)
`;

export type Space = {
  id: string;
  category: 'small' | 'medium' | 'whole';
  name: string;
  description: string;
  capacity_label: string;
  max_guests: number | null;
  suitable_for_meetings: boolean;
  hourly_rate: number;
  min_hours: number;
  sort_order: number;
  active: boolean;
  units: { unit: string }[];
};

export const SPACE_SELECT = `
  id, category, name, description, capacity_label, max_guests, suitable_for_meetings,
  hourly_rate, min_hours, sort_order, active, units:space_units(unit)
`;

export type Decoration = {
  id: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
  active: boolean;
};

export const DECORATION_SELECT = 'id, name, description, price, sort_order, active';

export type MenuCategory = { id: string; name: string; kind: 'food' | 'drink'; sort_order: number };

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  tag: string | null;
  popular: boolean;
  available: boolean;
  photo_path: string | null;
  sort_order: number;
};

export type BlockedTime = {
  id: number;
  space_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type Settings = {
  opens_at: string;
  closes_at: string;
  hold_minutes: number;
  table_deposit_rate: number;
  table_deposit_flat: number;
  table_full_refund_hours: number;
  table_visit_minutes: number;
  last_table_before_close_minutes: number;
  free_date_change_days: number;
  refund_working_days: number;
  updated_at: string;
};

export type RefundTier = { min_days_before: number; refund_rate: number };
