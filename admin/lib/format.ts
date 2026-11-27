// Venue time is UTC (Accra has no daylight saving), so every date and time is
// shown in UTC, whatever the computer's own time zone is.
const TZ = 'UTC';

const money = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function cedis(amount: number | string | null | undefined): string {
  return `GH₵ ${money.format(Number(amount ?? 0))}`;
}

// Postgres can send "2026-12-05 12:00:00+00" with microseconds; normalise first.
export function toDate(stamp: string): Date {
  return new Date(stamp.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1').replace(/([+-]\d{2})$/, '$1:00'));
}

export function dayLabel(stamp: string): string {
  return toDate(stamp).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
}

export function longDay(stamp: string): string {
  return toDate(stamp).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

export function time(stamp: string): string {
  const d = toDate(stamp);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// An end time at midnight reads as 24:00, as in the customer app.
export function endTime(stamp: string): string {
  const value = time(stamp);
  return value === '00:00' ? '24:00' : value;
}

export function timeRange(start: string, end: string): string {
  return `${time(start)} to ${endTime(end)}`;
}

export function dateTime(stamp: string): string {
  return `${dayLabel(stamp)}, ${time(stamp)}`;
}

// 'YYYY-MM-DD' for a venue date.
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDay(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDay(d);
}

export function longDayIso(iso: string): string {
  return longDay(`${iso}T00:00:00Z`);
}

// '+233241234567' becomes '024 123 4567'.
export function phoneLocal(phone: string): string {
  const digits = phone.replace(/^\+233/, '0');
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : phone;
}

export function percent(rate: number): string {
  return `${Math.round(Number(rate) * 100)}%`;
}

export const EVENT_TYPES: Record<string, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  birthday: 'Birthday',
  other_reception: 'Reception',
  meeting: 'Meeting',
};

export const NETWORKS: Record<string, string> = {
  mtn: 'MTN MoMo',
  telecel: 'Telecel Cash',
  airteltigo: 'AT Money',
};

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const PURPOSES: Record<string, string> = {
  space_booking: 'Space booking',
  table_deposit: 'Table deposit',
  catering_balance: 'Catering',
};
