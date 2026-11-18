const RECURRING_OCCURRENCE_LIMIT = 60;

export function buildOccurrenceSlug(baseSlug: string, startsAt: Date): string {
  const year = startsAt.getUTCFullYear();
  const month = String(startsAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(startsAt.getUTCDate()).padStart(2, '0');
  const hour = String(startsAt.getUTCHours()).padStart(2, '0');
  const minute = String(startsAt.getUTCMinutes()).padStart(2, '0');
  return `${baseSlug}-${year}${month}${day}${hour}${minute}`;
}

export function buildRecurringStarts(startsAt: Date, repeat: string): Date[] {
  if (repeat === 'none') return [startsAt];

  const occurrences: Date[] = [];
  let cursor = new Date(startsAt);
  while (occurrences.length < RECURRING_OCCURRENCE_LIMIT) {
    occurrences.push(new Date(cursor));
    switch (repeat) {
      case 'daily':
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        break;
      case 'weekly':
        cursor.setUTCDate(cursor.getUTCDate() + 7);
        break;
      case 'monthly':
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        break;
      case 'weekdays':
        do cursor.setUTCDate(cursor.getUTCDate() + 1);
        while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
        break;
      default:
        return occurrences;
    }
  }
  return occurrences;
}
