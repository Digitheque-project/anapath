export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekRange(weekStartMonday: Date): { start: Date; end: Date } {
  const start = new Date(weekStartMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatWeekLabel(weekStartMonday: Date): string {
  const { end } = getWeekRange(weekStartMonday);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour12: false };
  return `${weekStartMonday.toLocaleDateString('fr-FR', opts)} — ${end.toLocaleDateString('fr-FR', opts)}`;
}

export function isDateInWeek(dateStr: string, weekStartMonday: Date): boolean {
  const date = new Date(dateStr);
  const { start, end } = getWeekRange(weekStartMonday);
  return date >= start && date <= end;
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export function getDailyVolumeForWeek<T extends { createdAt: string }>(
  items: T[],
  weekStartMonday: Date,
): { day: string; count: number }[] {
  return WEEKDAY_LABELS.map((day, index) => {
    const dayDate = new Date(weekStartMonday);
    dayDate.setDate(dayDate.getDate() + index);
    const count = items.filter((item) => {
      const created = new Date(item.createdAt);
      return (
        created.getFullYear() === dayDate.getFullYear() &&
        created.getMonth() === dayDate.getMonth() &&
        created.getDate() === dayDate.getDate()
      );
    }).length;
    return { day, count };
  });
}

export function toWeekInputValue(weekStartMonday: Date): string {
  const thursday = new Date(weekStartMonday);
  thursday.setDate(thursday.getDate() + 3);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function parseWeekInputValue(value: string): Date {
  const match = value.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return getMondayOfWeek(new Date());
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(year, 0, 4);
  const monday = getMondayOfWeek(jan4);
  monday.setDate(monday.getDate() + (week - 1) * 7);
  return getMondayOfWeek(monday);
}
