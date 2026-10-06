import { supabase } from './supabase';
import { linkFoodConfig } from './food';
import { type EntryTypeMode } from './preferences';

export interface DoctorConfig {
  hiddenFields: string[];
  centerImageUrl: string | null;
  entryTypeMode: EntryTypeMode;
  /** Pauta de comidas del vínculo ya resuelta (linkFoodConfig); null sin profesional. */
  foodConfig: unknown;
}

const DEFAULT_CONFIG: DoctorConfig = { hiddenFields: [], centerImageUrl: null, entryTypeMode: 'both', foodConfig: null };

/** Fetch the doctor config (hidden fields, center image, entry types, food protocol) for the patient's linked doctor. */
export async function fetchDoctorConfig(userId: string): Promise<DoctorConfig> {
  try {
    const query = (columns: string) => supabase
      .from('patient_links')
      .select(columns)
      .eq('patient_id', userId)
      .eq('status', 'accepted')
      .limit(1)
      .single();

    let res = await query('center_id, hidden_fields, entry_type_mode, food_config');
    // Sin la migración de comidas aún aplicada: la pauta de siempre, sin comidas.
    const hasFoodColumn = !(res.error && res.error.code !== 'PGRST116');
    if (!hasFoodColumn) res = await query('center_id, hidden_fields, entry_type_mode');
    const link = res.data as { center_id?: string | null; hidden_fields?: string[] | null; entry_type_mode?: string | null; food_config?: unknown } | null;
    if (!link) return DEFAULT_CONFIG;

    const base: DoctorConfig = {
      hiddenFields: link.hidden_fields || [],
      centerImageUrl: null,
      entryTypeMode: (link.entry_type_mode as EntryTypeMode) || 'both',
      // Sin pauta guardada, las comidas vienen activadas por defecto
      foodConfig: hasFoodColumn ? linkFoodConfig(link.food_config) : null,
    };
    if (!link.center_id) return base;

    const { data: center } = await supabase.from('centers').select('image_url').eq('id', link.center_id).single();
    return { ...base, centerImageUrl: center?.image_url || null };
  } catch {
    return DEFAULT_CONFIG;
  }
}
