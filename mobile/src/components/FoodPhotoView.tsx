import { useEffect, useState } from 'react';
import { Image, View, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import { getFoodPhotoUrl, hasLocalPhoto } from '../lib/foodPhotos';
import { D } from '../lib/design';
import { FoodSwitchIcon } from './icons';

interface FoodPhotoViewProps {
  localUri?: string | null;
  path?: string | null;
  style: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

/**
 * Foto de una comida: la copia local si existe; si no, una signed URL
 * temporal del bucket privado. Sin foto (o sin conexión) muestra el icono.
 */
export default function FoodPhotoView({ localUri, path, style, accessibilityLabel }: FoodPhotoViewProps) {
  const [uri, setUri] = useState<string | null>(hasLocalPhoto(localUri) ? localUri! : null);

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
  return <Image source={{ uri }} style={style} resizeMode="cover" accessibilityLabel={accessibilityLabel} />;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.chip,
  },
});
