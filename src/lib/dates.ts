const DAYS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTHS_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];
const MONTHS_ES_LOWER = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function getMonthName(month: number): string {
  return MONTHS_ES[month];
}

export function getDayName(date: Date): string {
  return DAYS_ES[date.getDay()];
}

export function formatDateLong(date: Date): string {
  const day = getDayName(date);
  return `${day}, ${date.getDate()} de ${MONTHS_ES_LOWER[date.getMonth()]}`;
}

export function formatDateForDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${getDayName(date)}, ${d} de ${MONTHS_ES_LOWER[m - 1]}`;
}

export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert: Sunday=0 -> 6, Monday=1 -> 0, etc.
  return day === 0 ? 6 : day - 1;
}

export function formatSinceDate(dateStr: string, time: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `Desde el ${d} de ${MONTHS_ES_LOWER[m - 1]} ${y} a las ${time}`;
}
