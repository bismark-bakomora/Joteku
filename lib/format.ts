export function formatGhs(amount: number): string {
  const [whole, fraction] = amount.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === '00' ? `GH₵ ${grouped}` : `GH₵ ${grouped}.${fraction}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Dates and times are venue time (UTC, see lib/dates.ts), so these read UTC fields
// and never depend on the phone's own time zone or language settings.
function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

export function monthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex];
}

export function formatDateLong(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${DAY_NAMES[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateShort(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${DAY_NAMES[date.getUTCDay()].slice(0, 3)} ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()].slice(0, 3)}`;
}

export function formatTime12(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime12(startTime)} – ${formatTime12(endTime)}`;
}

export function formatStamp(isoDate: string): string {
  const date = new Date(isoDate);
  const time = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${formatTime12(time)}`;
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatHours(hours: number): string {
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
