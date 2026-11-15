export type MonthRef = {
  year: number;
  month: number;
};

export function monthOf(dateKey: string): MonthRef {
  const [year, month] = dateKey.split('-').map(Number);
  return { year, month: month - 1 };
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const index = ref.year * 12 + ref.month + delta;
  return { year: Math.floor(index / 12), month: index % 12 };
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function dateKeyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function monthRange(ref: MonthRef): { first: string; last: string } {
  const days = new Date(Date.UTC(ref.year, ref.month + 1, 0)).getUTCDate();
  return { first: dateKeyOf(ref.year, ref.month, 1), last: dateKeyOf(ref.year, ref.month, days) };
}

// Weeks of a month for a Monday-first calendar grid. Blank cells are null.
export function monthWeeks(ref: MonthRef): (string | null)[][] {
  const days = new Date(Date.UTC(ref.year, ref.month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(ref.year, ref.month, 1)).getUTCDay();
  const leadingBlanks = (firstWeekday + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(dateKeyOf(ref.year, ref.month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}
