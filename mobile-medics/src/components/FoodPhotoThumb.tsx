import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Foto de una comida en MA. Bucket privado `food-photos`: signed URL de vida
// corta pedida con la sesión del profesional (la RLS de Storage solo la da
// para pacientes vinculados). Pulsar la miniatura la abre a pantalla completa.

const TTL_S = 10 * 60;
const cache = new Map<string, { url: string; expires: number }>();

async function signedUrl(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now() + 30_000) return hit.url;
  const { data, error } = await supabase.storage.from('food-photos').createSignedUrl(path, TTL_S);
  if (error || !data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, expires: Date.now() + TTL_S * 1000 });
  return data.signedUrl;
}

export default function FoodPhotoThumb({ path, size = 48 }: { path: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    signedUrl(path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);

  if (!url) return <View style={[styles.placeholder, { width: size, height: size }]}><Text style={styles.placeholderText}>…</Text></View>;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="imagebutton" accessibilityLabel="Ver foto de la comida">
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="cover" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Cerrar foto">
          <Image source={{ uri: url }} style={styles.full} resizeMode="contain" />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: { borderRadius: 8, backgroundColor: '#EEF2EE', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#95A0A5', fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  full: { width: '100%', height: '80%' },
});
