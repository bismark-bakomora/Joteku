// Joteku is in Accra, which is on GMT all year with no daylight saving, so venue
// time is UTC. Dates are 'YYYY-MM-DD' and times are 'HH:mm' in venue time, which
// keeps availability and refund rules the same on every phone.

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Postgres sends times with microseconds ('2026-11-25T12:00:34.633976+00:00').
// Browsers read that, but Hermes, the JavaScript engine on the phone, does not,
// so database times are cut to milliseconds before anything parses them. The
// result is a plain UTC ISO string ('2026-11-25T12:00:34.633Z').
export function fromDatabaseStamp(stamp: string): string {
  const trimmed = stamp
    .replace(' ', 'T')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})$/, '$1:00');
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not read the time ${stamp} from the database.`);
  }
  return date.toISOString();
}

export function toDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const minutes = timeToMinutes(time);
  return new Date(Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60));
}
