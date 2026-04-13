import { supabase } from './supabase';
import { type EntryTypeMode } from './preferences';

export interface MedicsTheme {
  primary: string;
  dark: string;
  navActive: string;
  textMuted: string;
  border: string;
  menuLabel: string;
  logoutColor: string;
  versionColor: string;
}

export const PALETTES: { id: string; name: string; swatch: string; theme: MedicsTheme }[] = [
  { id: 'terracotta', name: 'Terracota', swatch: '#dd8273', theme: { primary: '#dd8273', dark: '#1a0e0e', navActive: '#3d1e1a', textMuted: '#9a7a76', border: '#2d1a18', menuLabel: '#5c3e3a', logoutColor: '#7a5a56', versionColor: '#3d2a28' } },
  { id: 'ocean', name: 'Océano', swatch: '#4a9eca', theme: { primary: '#4a9eca', dark: '#0a1928', navActive: '#143a5e', textMuted: '#5a8aaa', border: '#1a3558', menuLabel: '#3a6888', logoutColor: '#4a7890', versionColor: '#2a4a68' } },
  { id: 'forest', name: 'Bosque', swatch: '#5aaa72', theme: { primary: '#5aaa72', dark: '#0e1a10', navActive: '#1a3a20', textMuted: '#6a9a78', border: '#1a3420', menuLabel: '#3a6848', logoutColor: '#4a7858', versionColor: '#2a4838' } },
  { id: 'plum', name: 'Ciruela', swatch: '#9b6db5', theme: { primary: '#9b6db5', dark: '#1a0e28', navActive: '#3a1e58', textMuted: '#8a6a9a', border: '#2d1a48', menuLabel: '#5c3e78', logoutColor: '#7a5a88', versionColor: '#3d2a58' } },
  { id: 'midnight', name: 'Medianoche', swatch: '#7a8fd8', theme: { primary: '#7a8fd8', dark: '#0e0e1a', navActive: '#1a1a3d', textMuted: '#7a7a96', border: '#1a1a30', menuLabel: '#4a4a68', logoutColor: '#5a5a78', versionColor: '#2a2a48' } },
  { id: 'sunset', name: 'Atardecer', swatch: '#e8a048', theme: { primary: '#e8a048', dark: '#1a0e00', navActive: '#3d2800', textMuted: '#9a7a50', border: '#2d1a00', menuLabel: '#5c4020', logoutColor: '#7a5a36', versionColor: '#3d2a10' } },
];

export function getPaletteTheme(paletteId: string): MedicsTheme {
  if (paletteId.startsWith('custom:')) {
    const parts = paletteId.split(':');
    const c1 = `#${parts[1] || 'dd8273'}`;
    const c2 = `#${parts[2] || 'a05060'}`;
    return { primary: c1, dark: c2, navActive: c2, textMuted: '#9a8880', border: '#2d1a1a', menuLabel: '#5c4040', logoutColor: '#7a6060', versionColor: '#3d2a2a' };
  }
  return (PALETTES.find(p => p.id === paletteId) || PALETTES[0]).theme;
}

export interface DoctorConfig {
  palette: string | null;
  hiddenFields: string[];
  centerImageUrl: string | null;
  entryTypeMode: EntryTypeMode;
}

/** Fetch the doctor config (palette + hidden fields + center image) for the patient's linked doctor. */
export async function fetchDoctorConfig(userId: string): Promise<DoctorConfig> {
  try {
    const { data: link } = await supabase
      .from('patient_links')
      .select('center_id, hidden_fields, entry_type_mode')
      .eq('patient_id', userId)
      .eq('status', 'accepted')
      .limit(1)
      .single();

    if (!link?.center_id) return { palette: null, hiddenFields: [], centerImageUrl: null, entryTypeMode: 'both' };

    const [{ data: doctor }, { data: center }] = await Promise.all([
      supabase.from('doctors').select('palette').eq('center_id', link.center_id).limit(1).single(),
      supabase.from('centers').select('image_url').eq('id', link.center_id).single(),
    ]);

    return {
      palette: doctor?.palette || null,
      hiddenFields: link?.hidden_fields || [],
      centerImageUrl: center?.image_url || null,
      entryTypeMode: (link?.entry_type_mode as EntryTypeMode) || 'both',
    };
  } catch {
    return { palette: null, hiddenFields: [], centerImageUrl: null, entryTypeMode: 'both' };
  }
}
