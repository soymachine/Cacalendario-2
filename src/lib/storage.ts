import { saveEntryToCloud, deleteEntryFromCloud } from './sync';
import { supabase } from './supabase';

export interface PoopEntry {
  id: string; // unique entry ID
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  timestamp: number; // full timestamp for sorting
  entry_type?: 'poop' | 'urine'; // default 'poop' if absent
  // ── Poop fields ──
  bristol?: number | null; // Bristol scale 1-7
  floats?: 'floats' | 'sinks' | 'both' | null; // float behaviour
  color?: string | null; // hex color
  quantity?: number | null; // 0-100
  duration?: 'short' | 'medium' | 'long' | null; // <3min, 3-5min, >5min
  symptoms?: string[]; // list of symptom keys
  // ── Urine fields ──
  urine_type?: 'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null;
  urine_quantity?: number | null; // 0-500 ml
  urine_color?: string | null; // hex color
  urine_characteristics?: string[]; // ['blood', 'aspect', 'odor', 'pain']
}

const STORAGE_KEY = 'cacalendario_entries';

// Generate a unique ID for entries
export function generateEntryId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Migrate old entries
function migrateEntries(entries: PoopEntry[]): PoopEntry[] {
  let migrated = false;
  const result = entries.map((e: any) => {
    let entry = { ...e };
    // Add missing id
    if (!entry.id) {
      migrated = true;
      entry.id = `${entry.timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    }
    // Migrate boolean floats → new string type
    if (entry.floats === true) { migrated = true; entry.floats = 'floats'; }
    if (entry.floats === false) { migrated = true; entry.floats = 'sinks'; }
    // Default entry_type
    if (!entry.entry_type) { entry.entry_type = 'poop'; }
    return entry as PoopEntry;
  });
  if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  return result;
}

// Helper to get current user ID (if logged in)
async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function getEntries(): PoopEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return migrateEntries(JSON.parse(raw));
}

export function getEntriesForMonth(year: number, month: number): PoopEntry[] {
  const entries = getEntries();
  return entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month;
  });
}

export function getEntriesForDate(date: string): PoopEntry[] {
  return getEntries().filter((e) => e.date === date);
}

export function getEntryById(id: string): PoopEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function saveEntry(entry: PoopEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
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

export function updateEntryDateTime(id: string, newDate: string, newTime: string): void {
  const entry = getEntryById(id);
  if (!entry) return;
  const [y, mo, d] = newDate.split('-').map(Number);
  const [h, m] = newTime.split(':').map(Number);
  saveEntry({ ...entry, date: newDate, time: newTime, timestamp: new Date(y, mo - 1, d, h, m).getTime() });
}

export function deleteEntry(id: string): void {
  const entry = getEntries().find((e) => e.id === id);
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

  // Also delete from cloud if user is logged in
  if (entry) {
    getCurrentUserId().then((userId) => {
      if (userId) {
        deleteEntryFromCloud(userId, entry.id);
      }
    });
  }
}

export function getLastEntry(): PoopEntry | undefined {
  const entries = getEntries();
  if (entries.length === 0) return undefined;
  return entries[entries.length - 1];
}

export function getDaysSinceLastEntry(): { days: number; hours: number; minutes: number; seconds: number; lastEntry: PoopEntry | undefined } {
  const last = getLastEntry();
  if (!last) return { days: 0, hours: 0, minutes: 0, seconds: 0, lastEntry: undefined };

  const lastDate = new Date(`${last.date}T${last.time}:00`);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, lastEntry: last };
}
