import { useEffect, useState } from 'react';
import { Image, View, Pressable, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import { getFoodPhotoUrl, hasLocalPhoto } from '../lib/foodPhotos';
import { D } from '../lib/design';
import { FoodSwitchIcon } from './icons';
import PhotoViewer from './PhotoViewer';

interface FoodPhotoViewProps {
  localUri?: string | null;
  path?: string | null;
  style: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Al tocarla se abre a pantalla completa con zoom (PhotoViewer). */
  zoomable?: boolean;
}

/**
 * Foto de una comida: la copia local si existe; si no, una signed URL
 * temporal del bucket privado. Sin foto (o sin conexión) muestra el icono.
 */
export default function FoodPhotoView({ localUri, path, style, accessibilityLabel, zoomable }: FoodPhotoViewProps) {
  const [uri, setUri] = useState<string | null>(hasLocalPhoto(localUri) ? localUri! : null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (hasLocalPhoto(localUri)) { setUri(localUri!); return; }
    setUri(null);
    if (path) getFoodPhotoUrl(path).then((u) => { if (!cancelled) setUri(u); });
    return () => { cancelled = true; };
  }, [localUri, path]);

  if (!uri) {
    return (
      <View style={[style as object, styles.placeholder]} accessibilityLabel={accessibilityLabel}>
        <FoodSwitchIcon color={D.textMuted} size={28} />
      </View>
    );
  }
  const image = <Image source={{ uri }} style={style} resizeMode="cover" accessibilityLabel={accessibilityLabel} />;
  if (!zoomable) return image;
  return (
    <>
      <Pressable onPress={() => setViewerOpen(true)} accessibilityRole="imagebutton" accessibilityHint="Abre la foto a pantalla completa">
        {image}
      </Pressable>
      {viewerOpen && <PhotoViewer uri={uri} onClose={() => setViewerOpen(false)} accessibilityLabel={accessibilityLabel} />}
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.chip,
  },
});
