import { supabase } from './supabase';
import type { PoopEntry } from './storage';

/**
 * Sync layer: cloud is the source of truth when logged in.
 * - On login: clear localStorage and replace with cloud data
 * - On save: save to both localStorage and Supabase (if logged in)
 * - Without login: everything works with localStorage only
 */

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  // 1. Get cloud entries (source of truth)
  const { data: cloudRows } = await supabase
    .from('entries')
    .select('entry_id, date, time, notes, timestamp, bristol, floats, color, quantity, duration, symptoms')
    .eq('user_id', userId);

  const cloudEntries: PoopEntry[] = (cloudRows || []).map((r) => ({
    id: r.entry_id || `${r.timestamp}_cloud`,
    date: r.date,
    time: r.time,
    notes: r.notes || '',
    timestamp: Number(r.timestamp),
    bristol: r.bristol ?? null,
    floats: r.floats ?? null,
    color: r.color ?? null,
    quantity: r.quantity ?? null,
    duration: r.duration ?? null,
    symptoms: r.symptoms ?? [],
  }));

  cloudEntries.sort((a, b) => a.timestamp - b.timestamp);

  // 2. Replace localStorage with cloud data
  localStorage.setItem('cacalendario_entries', JSON.stringify(cloudEntries));

  return cloudEntries;
}

export async function saveEntryToCloud(userId: string, entry: PoopEntry): Promise<void> {
  await supabase.from('entries').upsert(
    {
      user_id: userId,
      entry_id: entry.id,
      date: entry.date,
      time: entry.time,
      notes: entry.notes,
      timestamp: entry.timestamp,
      bristol: entry.bristol ?? null,
      floats: entry.floats ?? null,
      color: entry.color ?? null,
      quantity: entry.quantity ?? null,
      duration: entry.duration ?? null,
      symptoms: entry.symptoms ?? [],
    },
    { onConflict: 'user_id,entry_id' }
  );
}

export async function deleteEntryFromCloud(userId: string, entryId: string): Promise<void> {
  await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .eq('entry_id', entryId);
}
