import { supabase } from './supabase';
import { localStore } from './localStore';
import type { PoopEntry } from './storage';

/**
 * Sync layer: cloud is the source of truth when logged in.
 * - On login: incrementally pull what changed since the last sync; fall
 *   back to a full resync if there's no recent cursor (first login, or the
 *   cursor is stale) so anything the incremental path can't see — e.g. an
 *   entry deleted on another device — still self-corrects periodically.
 * - On save: save to both local storage and Supabase (if logged in)
 * - Without login: everything works with local storage only
 */

const SYNC_PAGE_SIZE = 500;
const ENTRIES_KEY = 'cacalendario_entries';
const LAST_SYNCED_KEY = 'cacalendario_last_synced_at';
// Beyond this, trust in the incremental cursor is spent and we redownload
// everything instead — the periodic safety net described above.
const RECONCILE_AFTER_MS = 24 * 60 * 60 * 1000;

const ENTRY_COLUMNS = 'entry_id, date, time, notes, timestamp, bristol, floats, color, quantity, duration, feces_texture, symptoms, entry_type, urine_type, urine_quantity, urine_color, urine_characteristics, urine_urgency, during_sleep';
const ENTRY_COLUMNS_WITH_CURSOR = 'entry_id, date, time, notes, timestamp, bristol, floats, color, quantity, duration, feces_texture, symptoms, entry_type, urine_type, urine_quantity, urine_color, urine_characteristics, urine_urgency, during_sleep, updated_at';

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
    feces_texture: (r.feces_texture as PoopEntry['feces_texture']) ?? null,
    symptoms: (r.symptoms as string[]) ?? [],
    urine_type: (r.urine_type as PoopEntry['urine_type']) ?? null,
    urine_quantity: (r.urine_quantity as number) ?? null,
    urine_color: (r.urine_color as string) ?? null,
    urine_characteristics: (r.urine_characteristics as string[]) ?? [],
    urine_urgency: (r.urine_urgency as number) ?? null,
    during_sleep: (r.during_sleep as boolean) ?? null,
  };
}

function getLocalEntries(): PoopEntry[] {
  return JSON.parse(localStore.getItem(ENTRIES_KEY) || '[]');
}

function getLastSyncedAt(): string | null {
  return localStore.getItem(LAST_SYNCED_KEY);
}

function setLastSyncedAt(iso: string | null): void {
  if (iso) localStore.setItem(LAST_SYNCED_KEY, iso);
}

/**
 * Full resync (existing behaviour): pages through every cloud entry for the
 * user. Also opportunistically reads `updated_at` to seed the incremental
 * cursor — but if that column doesn't exist yet (migration
 * supabase/migrations/20260804_entries_updated_at.sql not applied), retries
 * without it rather than breaking sync entirely. In that case no cursor is
 * set, so future syncs simply keep doing a full resync, matching today's
 * behaviour.
 */
async function fetchAllCloudEntries(userId: string): Promise<{ entries: PoopEntry[]; maxUpdatedAt: string | null; error: string | null }> {
  const entries: PoopEntry[] = [];
  let maxUpdatedAt: string | null = null;
  let withCursor = true;
  let page = 0;

  while (true) {
    const from = page * SYNC_PAGE_SIZE;
    const to = from + SYNC_PAGE_SIZE - 1;

    let data: Record<string, unknown>[] | null = null;
    let error: { message: string } | null = null;

    if (withCursor) {
      const res = await supabase
        .from('entries')
        .select(ENTRY_COLUMNS_WITH_CURSOR)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .range(from, to);
      data = res.data as Record<string, unknown>[] | null;
      error = res.error;
    } else {
      const res = await supabase
        .from('entries')
        .select(ENTRY_COLUMNS)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .range(from, to);
      data = res.data as Record<string, unknown>[] | null;
      error = res.error;
    }

    if (error && withCursor && page === 0) {
      // Column not there yet — fall back for the whole fetch, no cursor.
      withCursor = false;
      const res = await supabase
        .from('entries')
        .select(ENTRY_COLUMNS)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .range(from, to);
      data = res.data as Record<string, unknown>[] | null;
      error = res.error;
    }

    if (error) return { entries: [], maxUpdatedAt: null, error: error.message };

    const rows = data ?? [];
    for (const r of rows) {
      entries.push(rowToEntry(r));
      const u = withCursor ? (r as Record<string, unknown>).updated_at as string | undefined : undefined;
      if (u && (!maxUpdatedAt || u > maxUpdatedAt)) maxUpdatedAt = u;
    }

    if (rows.length < SYNC_PAGE_SIZE) break;
    page++;
  }

  return { entries, maxUpdatedAt: withCursor ? maxUpdatedAt : null, error: null };
}

/** Only entries changed since `since` — the common case on session restore. */
async function fetchChangedCloudEntries(userId: string, since: string): Promise<{ entries: PoopEntry[]; maxUpdatedAt: string | null; error: string | null }> {
  const entries: PoopEntry[] = [];
  let maxUpdatedAt: string | null = since;
  let page = 0;

  while (true) {
    const from = page * SYNC_PAGE_SIZE;
    const to = from + SYNC_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('entries')
      .select(ENTRY_COLUMNS_WITH_CURSOR)
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .range(from, to);

    if (error) return { entries: [], maxUpdatedAt: null, error: error.message };

    const rows = data ?? [];
    for (const r of rows) {
      entries.push(rowToEntry(r));
      const u = (r as Record<string, unknown>).updated_at as string | undefined;
      if (u && u > (maxUpdatedAt ?? '')) maxUpdatedAt = u;
    }

    if (rows.length < SYNC_PAGE_SIZE) break;
    page++;
  }

  return { entries, maxUpdatedAt, error: null };
}

export async function syncOnLogin(userId: string): Promise<PoopEntry[]> {
  const lastSyncedAt = getLastSyncedAt();
  const cursorIsFresh = !!lastSyncedAt && Date.now() - new Date(lastSyncedAt).getTime() < RECONCILE_AFTER_MS;

  if (cursorIsFresh) {
    const { entries: changed, maxUpdatedAt, error } = await fetchChangedCloudEntries(userId, lastSyncedAt!);

    if (error) {
      console.error('[sync] Error fetching changed entries:', error);
      return getLocalEntries();
    }

    const changedIds = new Set(changed.map((e) => e.id));
    const merged = [...getLocalEntries().filter((e) => !changedIds.has(e.id)), ...changed];
    merged.sort((a, b) => a.timestamp - b.timestamp);

    localStore.setItem(ENTRIES_KEY, JSON.stringify(merged));
    setLastSyncedAt(maxUpdatedAt);
    return merged;
  }

  // No cursor, or it's stale: full reconciliation. Also what recovers from
  // anything the incremental path can't see (e.g. a delete from another
  // device) since it always reflects the cloud's exact current state.
  const { entries: cloudEntries, maxUpdatedAt, error } = await fetchAllCloudEntries(userId);

  if (error) {
    console.error('[sync] Error fetching cloud entries:', error);
    return getLocalEntries();
  }

  const cloudIds = new Set(cloudEntries.map((e) => e.id));

  const localEntries = getLocalEntries();
  const localOnly = localEntries.filter((e) => e.id && !cloudIds.has(e.id));

  for (const entry of localOnly) {
    saveEntryToCloud(userId, entry).catch((e) => console.error('[sync] Failed to upload local entry:', e));
  }

  const merged = [...cloudEntries, ...localOnly];
  merged.sort((a, b) => a.timestamp - b.timestamp);

  localStore.setItem(ENTRIES_KEY, JSON.stringify(merged));
  setLastSyncedAt(maxUpdatedAt);
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
      feces_texture: entry.feces_texture ?? null,
      symptoms: entry.symptoms ?? [],
      urine_type: entry.urine_type ?? null,
      urine_quantity: entry.urine_quantity ?? null,
      urine_color: entry.urine_color ?? null,
      urine_characteristics: entry.urine_characteristics ?? [],
      urine_urgency: entry.urine_urgency ?? null,
      during_sleep: entry.during_sleep ?? null,
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
