import { supabase } from './supabase';
import type { PoopEntry } from './storage';

/**
 * Sync layer: cloud is the source of truth when logged in.
 * - On login: clear localStorage and replace with cloud data
 * - On save: save to both localStorage and Supabase (if logged in)
 * - Without login: everything works with localStorage only
 */

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  // 1. Get cloud entries
  const { data: cloudRows, error } = await supabase
    .from('entries')
    .select('entry_id, date, time, notes, timestamp, bristol, floats, color, quantity, duration, symptoms')
    .eq('user_id', userId);

  if (error) {
    console.error('[sync] Error fetching cloud entries:', error.message);
    // Return whatever is in localStorage unchanged
    const local = JSON.parse(localStorage.getItem('cacalendario_entries') || '[]');
    return local;
  }

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

  const cloudIds = new Set(cloudEntries.map(e => e.id));

  // 2. Keep any local entries not yet in the cloud (failed to sync)
  const localEntries: PoopEntry[] = JSON.parse(localStorage.getItem('cacalendario_entries') || '[]');
  const localOnly = localEntries.filter(e => e.id && !cloudIds.has(e.id));

  // Upload local-only entries to cloud so they're not lost
  for (const entry of localOnly) {
    saveEntryToCloud(userId, entry).catch(e => console.error('[sync] Failed to upload local entry:', e));
  }

  // 3. Merge: cloud is authoritative for shared entries, local-only entries are appended
  const merged = [...cloudEntries, ...localOnly];
  merged.sort((a, b) => a.timestamp - b.timestamp);

  localStorage.setItem('cacalendario_entries', JSON.stringify(merged));
  return merged;
}

export async function saveEntryToCloud(userId: string, entry: PoopEntry): Promise<void> {
  const { error } = await supabase.from('entries').upsert(
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
  if (error) console.error('[sync] saveEntryToCloud error:', error.message);
}

export async function deleteEntryFromCloud(userId: string, entryId: string): Promise<void> {
  await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .eq('entry_id', entryId);
}
