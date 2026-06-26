const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = { hour12: false };
const DATE_OPTS: Intl.DateTimeFormatOptions = { hour12: false };

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR', DATE_TIME_OPTS);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', DATE_OPTS);
}

export function formatDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour12: false,
  });
}
