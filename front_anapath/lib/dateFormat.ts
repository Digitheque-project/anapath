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

/** Temps écoulé depuis une date, en français (ex: "à l'instant", "il y a 5 min", "il y a 2 j"). */
export function formatRelativeTime(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  return `il y a ${diffJ} j`;
}
