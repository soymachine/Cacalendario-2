import { supabase } from './supabase';
import { type EntryTypeMode } from './preferences';

export interface DoctorConfig {
  hiddenFields: string[];
  centerImageUrl: string | null;
  entryTypeMode: EntryTypeMode;
}

/** Fetch the doctor config (hidden fields + center image) for the patient's linked doctor. */
export async function fetchDoctorConfig(userId: string): Promise<DoctorConfig> {
  try {
    const { data: link } = await supabase
      .from('patient_links')
      .select('center_id, hidden_fields, entry_type_mode')
      .eq('patient_id', userId)
      .eq('status', 'accepted')
      .limit(1)
      .single();

    if (!link?.center_id) return { hiddenFields: [], centerImageUrl: null, entryTypeMode: 'both' };

    const { data: center } = await supabase.from('centers').select('image_url').eq('id', link.center_id).single();

    return {
      hiddenFields: link?.hidden_fields || [],
      centerImageUrl: center?.image_url || null,
      entryTypeMode: (link?.entry_type_mode as EntryTypeMode) || 'both',
    };
  } catch {
    return { hiddenFields: [], centerImageUrl: null, entryTypeMode: 'both' };
  }
}
