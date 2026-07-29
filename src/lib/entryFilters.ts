// Generic date-range filtering for patient entry lists.
// Shared between the web /medics dashboard and the native doctor app.

export function filterEntriesByDateRange<T extends { date: string }>(
  entries: T[],
  from: string,
  to: string,
): T[] {
  return entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });
}
