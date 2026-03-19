import { supabase } from './supabase';
import type { PoopEntry } from './storage';

/**
 * Sync layer: merges localStorage entries with Supabase.
 * - On login: push local entries to cloud, pull cloud entries to local
 * - On save: save to both localStorage and Supabase (if logged in)
 * - Without login: everything works with localStorage only
 * - Supports multiple entries per day via unique entry IDs
 */

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  // 1. Get local entries
  const localRaw = localStorage.getItem('cacalendario_entries');
  const localEntries: PoopEntry[] = localRaw ? JSON.parse(localRaw) : [];

  // 2. Get cloud entries
  const { data: cloudRows } = await supabase
    .from('entries')
    .select('entry_id, date, time, notes, timestamp, bristol, floats')
    .eq('user_id', userId);

  const cloudEntries: PoopEntry[] = (cloudRows || []).map((r) => ({
    id: r.entry_id || `${r.timestamp}_cloud`,
    date: r.date,
    time: r.time,
    notes: r.notes || '',
    timestamp: Number(r.timestamp),
    bristol: r.bristol ?? null,
    floats: r.floats ?? null,
  }));

  // 3. Merge: cloud takes precedence over local
  //    Deduplicate by ID AND by date+time (same event can have different IDs
  //    if migrated independently on different devices)
  const merged = new Map<string, PoopEntry>();
  const seenDateTimes = new Set<string>();

  // Cloud entries first (they take precedence)
  for (const entry of cloudEntries) {
    merged.set(entry.id, entry);
    seenDateTimes.add(`${entry.date}_${entry.time}`);
  }

  // Only add local entries that don't already exist in cloud
  for (const entry of localEntries) {
    if (!entry.id) {
      entry.id = `${entry.timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    }
    const dateTimeKey = `${entry.date}_${entry.time}`;
    // Skip if cloud already has an entry with the same ID or same date+time
    if (!merged.has(entry.id) && !seenDateTimes.has(dateTimeKey)) {
      merged.set(entry.id, entry);
      seenDateTimes.add(dateTimeKey);
    }
  }

  const allEntries = Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);

  // 4. Save merged result to localStorage
  localStorage.setItem('cacalendario_entries', JSON.stringify(allEntries));

  // 5. Upsert all merged entries to Supabase
  const upsertData = allEntries.map((e) => ({
    user_id: userId,
    entry_id: e.id,
    date: e.date,
    time: e.time,
    notes: e.notes,
    timestamp: e.timestamp,
    bristol: e.bristol ?? null,
    floats: e.floats ?? null,
  }));

  if (upsertData.length > 0) {
    await supabase
      .from('entries')
      .upsert(upsertData, { onConflict: 'user_id,entry_id' });
  }

  return allEntries;
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
