import { supabase } from './supabase';
import { type EntryTypeMode } from './preferences';

export interface MedicsTheme {
  primary: string;
  secondary: string; // distinct second color for patient app (not black)
  dark: string;
  navActive: string;
  textMuted: string;
  border: string;
  menuLabel: string;
  logoutColor: string;
  versionColor: string;
}

/**
 * Tema corporativo de Fluxia (azules de src/styles/fluxia-tokens.css). Es el
 * que usa siempre MW: el selector de paletas está deshabilitado y la antigua
 * paleta por defecto («Terracota», de cuando la app era Cacalendario) ya no se aplica.
 */
export const FLUXIA_THEME: MedicsTheme = {
  primary: '#3C7DB8',     // --fx-blue-500
  secondary: '#2A547D',   // --fx-blue-700
  dark: '#274867',        // --fx-blue-800
  navActive: '#316499',   // --fx-blue-600
  textMuted: '#6E8496',
  border: '#DAE8F5',      // --fx-blue-100
  menuLabel: '#2A547D',
  logoutColor: '#586269', // --fx-ink-600
  versionColor: '#90B7DD', // --fx-blue-300
};

export const PALETTES: { id: string; name: string; swatch: string; theme: MedicsTheme }[] = [
  { id: 'fluxia', name: 'Fluxia', swatch: '#3C7DB8', theme: FLUXIA_THEME },
  { id: 'ocean', name: 'Océano', swatch: '#4a9eca', theme: { primary: '#4a9eca', secondary: '#1e5a8a', dark: '#0a1928', navActive: '#143a5e', textMuted: '#5a8aaa', border: '#1a3558', menuLabel: '#3a6888', logoutColor: '#4a7890', versionColor: '#2a4a68' } },
  { id: 'forest', name: 'Bosque', swatch: '#5aaa72', theme: { primary: '#5aaa72', secondary: '#2a7248', dark: '#0e1a10', navActive: '#1a3a20', textMuted: '#6a9a78', border: '#1a3420', menuLabel: '#3a6848', logoutColor: '#4a7858', versionColor: '#2a4838' } },
  { id: 'plum', name: 'Ciruela', swatch: '#9b6db5', theme: { primary: '#9b6db5', secondary: '#6a3a8a', dark: '#1a0e28', navActive: '#3a1e58', textMuted: '#8a6a9a', border: '#2d1a48', menuLabel: '#5c3e78', logoutColor: '#7a5a88', versionColor: '#3d2a58' } },
  { id: 'midnight', name: 'Medianoche', swatch: '#7a8fd8', theme: { primary: '#7a8fd8', secondary: '#3a50a0', dark: '#0e0e1a', navActive: '#1a1a3d', textMuted: '#7a7a96', border: '#1a1a30', menuLabel: '#4a4a68', logoutColor: '#5a5a78', versionColor: '#2a2a48' } },
];

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
