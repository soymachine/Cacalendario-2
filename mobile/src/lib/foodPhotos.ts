import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { supabase } from './supabase';
import { foodPhotoPath } from './food';

// Fotos de comidas (PA). Son datos de salud:
//   · se reescalan y se recodifican en el dispositivo → se descartan los
//     metadatos EXIF (ubicación GPS incluida) antes de salir del teléfono;
//   · se suben al bucket PRIVADO `food-photos`, en la carpeta del paciente
//     (<user_id>/<entry_id>.jpg, ver foodPhotoPath y la RLS de Storage);
//   · solo se muestran con signed URLs de vida corta, nunca URLs públicas.
// El registro se guarda al instante con la copia local; la subida va en
// segundo plano y se reintenta en el siguiente inicio si no había conexión.

const BUCKET = 'food-photos';
const MAX_WIDTH = 1280;
const SIGNED_URL_TTL_S = 60 * 60;

export type PhotoSource = 'camera' | 'library';

export type PickPhotoResult =
  | { status: 'ok'; uri: string }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'error' };

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'food-photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Abre la cámara o la galería y devuelve una copia local ya reducida y sin EXIF. */
export async function pickFoodPhoto(source: PhotoSource): Promise<PickPhotoResult> {
  try {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return { status: 'cancelled' };

    const asset = result.assets[0];
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (asset.width > MAX_WIDTH) ctx.resize({ width: MAX_WIDTH });
    const image = await ctx.renderAsync();
    const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

    // Copia persistente (la caché del sistema puede vaciarse antes de subirla).
    const dest = new File(photosDir(), `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`);
    new File(saved.uri).copySync(dest);
    return { status: 'ok', uri: dest.uri };
  } catch (err) {
    console.error('[foodPhotos] pick error:', err instanceof Error ? err.message : String(err));
    return { status: 'error' };
  }
}

/** Borra una copia local (ignora si ya no existe). */
export function deleteLocalPhoto(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch { /* nada que limpiar */ }
}

async function currentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** Sube la foto local de un registro. Devuelve la ruta en el bucket o null si falla. */
export async function uploadFoodPhoto(entryId: string, localUri: string): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  try {
    const path = foodPhotoPath(userId, entryId);
    const bytes = await new File(localUri).arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) {
      console.error('[foodPhotos] upload error:', error.message);
      return null;
    }
    signedUrlCache.delete(path);
    return path;
  } catch (err) {
    console.error('[foodPhotos] upload exception:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function deleteRemoteFoodPhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  signedUrlCache.delete(path);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error('[foodPhotos] delete error:', error.message);
}

const signedUrlCache = new Map<string, { url: string; expires: number }>();

/** URL firmada y temporal para ver una foto subida (null si no hay acceso o conexión). */
export async function getFoodPhotoUrl(path: string): Promise<string | null> {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_S);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(path, { url: data.signedUrl, expires: Date.now() + SIGNED_URL_TTL_S * 1000 });
  return data.signedUrl;
}

export function hasLocalPhoto(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try { return new File(uri).exists; } catch { return false; }
}
