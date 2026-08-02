// Portado de src/components/MedicsPanel.tsx (handleSaveConfig, handleImageUpload,
// saveGlobalTags, deleteGlobalTag) — mantener sincronizado a mano.
// La paleta/tema visual por médico y la auto-extracción de color del logo desde
// la web NO se portan (ver plan de la app nativa): esta app usa el tema fijo de Fluxia.
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { DoctorInfo } from './doctor';
import type { PatientLink } from './patients';

export interface ConfigSaveInput {
  name: string;
  centerName: string;
  semaforoGreen: number;
  semaforoRed: number;
}

export async function saveDoctorConfig(doctor: DoctorInfo, input: ConfigSaveInput): Promise<{ error: string | null }> {
  const name = input.name.trim() || doctor.name;
  const centerName = input.centerName.trim() || doctor.center_name;
  const [{ error: doctorErr }, { error: centerErr }] = await Promise.all([
    supabase.from('doctors').update({ name, semaforo_green: input.semaforoGreen, semaforo_red: input.semaforoRed }).eq('id', doctor.id),
    supabase.from('centers').update({ name: centerName }).eq('id', doctor.center_id),
  ]);
  if (doctorErr) return { error: doctorErr.message };
  if (centerErr) return { error: centerErr.message };
  return { error: null };
}

export async function saveGlobalTags(doctorId: string, newTags: string[]): Promise<{ error: string | null }> {
  const { error } = await supabase.from('doctors').update({ global_tags: newTags }).eq('id', doctorId);
  return { error: error?.message ?? null };
}

/** Deletes a global tag: updates the doctor's catalog and cascades removal from every patient that had it. */
export async function deleteGlobalTag(
  doctorId: string,
  tag: string,
  currentGlobalTags: string[],
  patients: PatientLink[],
): Promise<{ error: string | null }> {
  const newGlobal = currentGlobalTags.filter((t) => t !== tag);
  const affected = patients.filter((p) => (p.tags || []).includes(tag));
  try {
    await Promise.all([
      supabase.from('doctors').update({ global_tags: newGlobal }).eq('id', doctorId),
      ...affected.map((p) =>
        supabase.from('patient_links').update({ tags: (p.tags || []).filter((t) => t !== tag) }).eq('id', p.id),
      ),
    ]);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar la etiqueta' };
  }
}

/** Opens the native image picker and uploads the chosen image as the center logo. */
export async function pickAndUploadCenterLogo(doctor: DoctorInfo): Promise<{ url: string | null; error: string | null }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { url: null, error: 'Necesitas dar permiso para acceder a tus fotos.' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return { url: null, error: null };

  const asset = result.assets[0];
  if (!asset.base64) return { url: null, error: 'No se pudo leer la imagen.' };
  if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
    return { url: null, error: 'La imagen supera los 2 MB. Elige una más pequeña.' };
  }

  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const contentType = asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const path = `${doctor.center_id}/logo.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('center-images')
    .upload(path, decode(asset.base64), { upsert: true, contentType });
  if (uploadErr) return { url: null, error: uploadErr.message };

  const { data: { publicUrl } } = supabase.storage.from('center-images').getPublicUrl(path);
  const versionedUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase.from('centers').update({ image_url: versionedUrl }).eq('id', doctor.center_id);
  if (dbErr) return { url: null, error: dbErr.message };

  return { url: versionedUrl, error: null };
}
