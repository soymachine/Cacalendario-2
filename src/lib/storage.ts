import { saveEntryToCloud } from './sync';
import { supabase } from './supabase';

export interface PoopEntry {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  timestamp: number; // full timestamp for sorting
}

const STORAGE_KEY = 'cacalendario_entries';

// Helper to get current user ID (if logged in)
async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function getEntries(): PoopEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getEntriesForMonth(year: number, month: number): PoopEntry[] {
  const entries = getEntries();
  return entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month;
  });
}

export function getEntryForDate(date: string): PoopEntry | undefined {
  return getEntries().find((e) => e.date === date);
}

export function saveEntry(entry: PoopEntry): void {
  // Always save to localStorage
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => a.timestamp - b.timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

  // Also save to cloud if user is logged in (fire and forget)
  getCurrentUserId().then((userId) => {
    if (userId) {
      saveEntryToCloud(userId, entry);
    }
  });
}

export function getLastEntry(): PoopEntry | undefined {
  const entries = getEntries();
  if (entries.length === 0) return undefined;
  return entries[entries.length - 1];
}

export function getDaysSinceLastEntry(): { days: number; hours: number; lastEntry: PoopEntry | undefined } {
  const last = getLastEntry();
  if (!last) return { days: 0, hours: 0, lastEntry: undefined };

  const lastDate = new Date(`${last.date}T${last.time}:00`);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { days, hours, lastEntry: last };
}
