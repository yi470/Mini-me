/**
 * Date utilities for the editorial calendar and journal entries
 */

export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatEditorialDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseIsoDate(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatShortMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseIsoDate(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export interface CalendarDay {
  date: Date;
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface WeekDay {
  date: Date;
  iso: string;
  dayNumber: number;
  dayName: string;
  dayShort: string;
  monthShort: string;
  isToday: boolean;
}

/**
 * Returns a 35 or 42 grid of days for the monthly view
 * Week starts on Monday for natural visual rhythm
 */
export function getMonthCalendarGrid(year: number, month: number, referenceDate: Date = new Date()): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();

  // Day of week for 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
  // Transform to Monday=0, Tuesday=1, ..., Sunday=6
  const rawDay = firstDayOfMonth.getDay();
  const startDayOffset = (rawDay + 6) % 7;

  const todayIso = formatDateToIso(referenceDate);

  const grid: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    const iso = formatDateToIso(d);
    grid.push({
      date: d,
      iso,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: iso === todayIso,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const iso = formatDateToIso(d);
    grid.push({
      date: d,
      iso,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: iso === todayIso,
    });
  }

  // Next month padding to fill a complete 35 or 42 grid
  const totalSlots = grid.length > 35 ? 42 : 35;
  const remaining = totalSlots - grid.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const iso = formatDateToIso(d);
    grid.push({
      date: d,
      iso,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: iso === todayIso,
    });
  }

  return grid;
}

/**
 * Returns the 7 days of the week containing referenceDate (Monday through Sunday)
 */
export function getWeekDays(referenceDate: Date, todayIso: string): WeekDay[] {
  const rawDay = referenceDate.getDay();
  // 0 is Sun, 1 is Mon ... 6 is Sat. Monday offset is 1 - rawDay (if Sun, -6)
  const diffToMonday = rawDay === 0 ? -6 : 1 - rawDay;
  
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + diffToMonday);

  const days: WeekDay[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = formatDateToIso(d);
    days.push({
      date: d,
      iso,
      dayNumber: d.getDate(),
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      monthShort: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
      isToday: iso === todayIso,
    });
  }

  return days;
}

/**
 * Formats a weekly range, e.g. "Nov 9 – 15, 2026" or "Nov 30 – Dec 6, 2026"
 */
export function formatWeekRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = start.getMonth() === end.getMonth();

  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start);
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end);

  if (sameYear && sameMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  } else if (sameYear) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  } else {
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
}
