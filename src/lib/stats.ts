import type { PoopEntry } from './storage';
import { getEntries } from './storage';

const DAYS_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const TIME_SLOTS = [
  { label: 'Mañana', emoji: '🌅', range: [6, 12] },
  { label: 'Tarde', emoji: '☀️', range: [12, 18] },
  { label: 'Noche', emoji: '🌙', range: [18, 24] },
  { label: 'Madrugada', emoji: '💤', range: [0, 6] },
];

export interface Stats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  weeklyData: { label: string; count: number }[];
  dayOfWeek: { day: string; count: number }[];
  timeOfDay: { label: string; emoji: string; count: number }[];
  currentStreak: number;
  bestStreak: number;
  avgPerWeek: number;
}

export function computeStats(): Stats {
  const entries = getEntries();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const lastMonthNum = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  // Total
  const total = entries.length;

  // This month vs last month
  const thisMonthCount = entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === thisYear && m === thisMonth;
  }).length;

  const lastMonthCount = entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === lastMonthYear && m === lastMonthNum;
  }).length;

  // Weekly data (last 8 weeks)
  const weeklyData = computeWeeklyData(entries, 8);

  // Day of week distribution
  const dayOfWeek = computeDayOfWeek(entries);

  // Time of day distribution
  const timeOfDay = computeTimeOfDay(entries);

  // Streaks (consecutive days with at least one entry)
  const { currentStreak, bestStreak } = computeStreaks(entries);

  // Average per week
  const avgPerWeek = computeAvgPerWeek(entries);

  return {
    total,
    thisMonth: thisMonthCount,
    lastMonth: lastMonthCount,
    weeklyData,
    dayOfWeek,
    timeOfDay,
    currentStreak,
    bestStreak,
    avgPerWeek,
  };
}

function computeWeeklyData(entries: PoopEntry[], weeks: number) {
  const now = new Date();
  const result: { label: string; count: number }[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const startStr = toKey(weekStart);
    const endStr = toKey(weekEnd);

    const count = entries.filter((e) => e.date >= startStr && e.date <= endStr).length;
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    result.push({ label, count });
  }

  return result;
}

function computeDayOfWeek(entries: PoopEntry[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

  entries.forEach((e) => {
    const [y, m, d] = e.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dow = date.getDay(); // 0=Sun
    const idx = dow === 0 ? 6 : dow - 1; // Convert to Mon=0
    counts[idx]++;
  });

  return DAYS_SHORT.map((day, i) => ({ day, count: counts[i] }));
}

function computeTimeOfDay(entries: PoopEntry[]) {
  const counts = [0, 0, 0, 0]; // Morning, Afternoon, Night, Dawn

  entries.forEach((e) => {
    const hour = parseInt(e.time.split(':')[0], 10);
    if (hour >= 6 && hour < 12) counts[0]++;
    else if (hour >= 12 && hour < 18) counts[1]++;
    else if (hour >= 18) counts[2]++;
    else counts[3]++;
  });

  return TIME_SLOTS.map((slot, i) => ({
    label: slot.label,
    emoji: slot.emoji,
    count: counts[i],
  }));
}

function computeStreaks(entries: PoopEntry[]) {
  if (entries.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const dateSet = new Set(entries.map((e) => e.date));
  const sortedDates = [...dateSet].sort();

  let bestStreak = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      bestStreak = Math.max(bestStreak, current);
    } else {
      current = 1;
    }
  }

  // Check if current streak is active (includes today or yesterday)
  const today = toKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toKey(yesterday);

  const lastDate = sortedDates[sortedDates.length - 1];
  const currentStreak = (lastDate === today || lastDate === yesterdayStr) ? current : 0;

  return { currentStreak, bestStreak };
}

function computeAvgPerWeek(entries: PoopEntry[]) {
  if (entries.length < 2) return entries.length;

  const first = new Date(entries[0].date + 'T00:00:00');
  const last = new Date(entries[entries.length - 1].date + 'T00:00:00');
  const weeks = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 7));

  return Math.round((entries.length / weeks) * 10) / 10;
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
