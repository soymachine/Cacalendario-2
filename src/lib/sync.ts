import { supabase } from './supabase';
import type { PoopEntry } from './storage';

/**
 * Sync layer: merges localStorage entries with Supabase.
 * - On login: push local entries to cloud, pull cloud entries to local
 * - On save: save to both localStorage and Supabase (if logged in)
 * - Without login: everything works with localStorage only
 */

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  // 1. Get local entries
  const localRaw = localStorage.getItem('cacalendario_entries');
  const localEntries: PoopEntry[] = localRaw ? JSON.parse(localRaw) : [];

  // 2. Get cloud entries
  const { data: cloudRows } = await supabase
    .from('entries')
    .select('date, time, notes, timestamp')
    .eq('user_id', userId);

  const cloudEntries: PoopEntry[] = (cloudRows || []).map((r) => ({
    date: r.date,
    time: r.time,
    notes: r.notes || '',
    timestamp: Number(r.timestamp),
  }));

  // 3. Merge: for each date, keep the one with the latest timestamp
  const merged = new Map<string, PoopEntry>();

  for (const entry of cloudEntries) {
    merged.set(entry.date, entry);
  }

  // Local entries override cloud if they have a newer timestamp for the same date
  for (const entry of localEntries) {
    const existing = merged.get(entry.date);
    if (!existing || entry.timestamp >= existing.timestamp) {
      merged.set(entry.date, entry);
    }
  }

  const allEntries = Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);

  // 4. Save merged result to localStorage
  localStorage.setItem('cacalendario_entries', JSON.stringify(allEntries));

  // 5. Upsert all merged entries to Supabase
  const upsertData = allEntries.map((e) => ({
    user_id: userId,
    date: e.date,
    time: e.time,
    notes: e.notes,
    timestamp: e.timestamp,
  }));

  if (upsertData.length > 0) {
    await supabase
      .from('entries')
      .upsert(upsertData, { onConflict: 'user_id,date' });
  }

  return allEntries;
}

export async function saveEntryToCloud(userId: string, entry: PoopEntry): Promise<void> {
  await supabase.from('entries').upsert(
    {
      user_id: userId,
      date: entry.date,
      time: entry.time,
      notes: entry.notes,
      timestamp: entry.timestamp,
    },
    { onConflict: 'user_id,date' }
  );
}

export async function deleteEntryFromCloud(userId: string, date: string): Promise<void> {
  await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);
}
