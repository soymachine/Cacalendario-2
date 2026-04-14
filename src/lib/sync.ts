import { supabase } from './supabase';
import type { PoopEntry } from './storage';

/**
 * Sync layer: cloud is the source of truth when logged in.
 * - On login: clear localStorage and replace with cloud data
 * - On save: save to both localStorage and Supabase (if logged in)
 * - Without login: everything works with localStorage only
 */

const SYNC_PAGE_SIZE = 500;

const ENTRY_COLUMNS = 'entry_id, date, time, notes, timestamp, bristol, floats, color, quantity, duration, symptoms, entry_type, urine_type, urine_quantity, urine_color, urine_characteristics';

function rowToEntry(r: Record<string, unknown>): PoopEntry {
  return {
    id: (r.entry_id as string) || `${r.timestamp}_cloud`,
    date: r.date as string,
    time: r.time as string,
    notes: (r.notes as string) || '',
    timestamp: Number(r.timestamp),
    entry_type: (r.entry_type as PoopEntry['entry_type']) ?? 'poop',
    bristol: (r.bristol as number) ?? null,
    floats: (r.floats as PoopEntry['floats']) ?? null,
    color: (r.color as string) ?? null,
    quantity: (r.quantity as number) ?? null,
    duration: (r.duration as PoopEntry['duration']) ?? null,
    symptoms: (r.symptoms as string[]) ?? [],
    urine_type: (r.urine_type as PoopEntry['urine_type']) ?? null,
    urine_quantity: (r.urine_quantity as number) ?? null,
    urine_color: (r.urine_color as string) ?? null,
    urine_characteristics: (r.urine_characteristics as string[]) ?? [],
  };
}

async function fetchAllCloudEntries(userId: string): Promise<{ entries: PoopEntry[]; error: string | null }> {
  const entries: PoopEntry[] = [];
  let page = 0;

  while (true) {
    const from = page * SYNC_PAGE_SIZE;
    const to = from + SYNC_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('entries')
      .select(ENTRY_COLUMNS)
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .range(from, to);

    if (error) return { entries: [], error: error.message };

    const rows = data ?? [];
    for (const r of rows) entries.push(rowToEntry(r));

    // If we got fewer rows than the page size, we've reached the end
    if (rows.length < SYNC_PAGE_SIZE) break;
    page++;
  }

  return { entries, error: null };
}

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  // 1. Get all cloud entries (paginated)
  const { entries: cloudEntries, error } = await fetchAllCloudEntries(userId);

  if (error) {
    console.error('[sync] Error fetching cloud entries:', error);
    const local = JSON.parse(localStorage.getItem('cacalendario_entries') || '[]');
    return local;
  }

  const cloudIds = new Set(cloudEntries.map(e => e.id));

  // 2. Keep any local entries not yet in the cloud (failed to sync)
  const localEntries: PoopEntry[] = JSON.parse(localStorage.getItem('cacalendario_entries') || '[]');
  const localOnly = localEntries.filter(e => e.id && !cloudIds.has(e.id));

  // Upload local-only entries to cloud so they're not lost
  for (const entry of localOnly) {
    saveEntryToCloud(userId, entry).catch(e => console.error('[sync] Failed to upload local entry:', e));
  }

  // 3. Merge: cloud is authoritative, local-only entries are appended
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
      entry_type: entry.entry_type ?? 'poop',
      bristol: entry.bristol ?? null,
      floats: entry.floats ?? null,
      color: entry.color ?? null,
      quantity: entry.quantity ?? null,
      duration: entry.duration ?? null,
      symptoms: entry.symptoms ?? [],
      urine_type: entry.urine_type ?? null,
      urine_quantity: entry.urine_quantity ?? null,
      urine_color: entry.urine_color ?? null,
      urine_characteristics: entry.urine_characteristics ?? [],
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
