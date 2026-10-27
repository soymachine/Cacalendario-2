import { useMemo, useRef } from 'react';
import {
  Modal, View, Image, Pressable, Text, Animated, PanResponder, StyleSheet, useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon } from './icons';

// Visor de una foto a pantalla completa con zoom: pellizcar para ampliar,
// arrastrar para moverse por la foto ampliada y doble toque para alternar
// entre 1x y 2.5x. Solo usa PanResponder/Animated de React Native (sin
// módulos nativos), así funciona igual en iOS y Android.

interface PhotoViewerProps {
  uri: string;
  onClose: () => void;
  accessibilityLabel?: string;
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;

const distance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

export default function PhotoViewer({ uri, onClose, accessibilityLabel }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  // Estado del gesto (valores "confirmados" y de inicio de cada gesto)
  const g = useRef({ scale: 1, x: 0, y: 0, startScale: 1, startX: 0, startY: 0, startDist: 0, lastTap: 0, pinching: false }).current;

  const clampOffset = (s: number, x: number, y: number) => {
    const maxX = ((s - 1) * width) / 2;
    const maxY = ((s - 1) * height) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const animateTo = (s: number, x: number, y: number) => {
    g.scale = s; g.x = x; g.y = y;
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, friction: 7 }),
      Animated.spring(tx, { toValue: x, useNativeDriver: true, friction: 7 }),
      Animated.spring(ty, { toValue: y, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      g.startScale = g.scale; g.startX = g.x; g.startY = g.y;
      g.pinching = e.nativeEvent.touches.length === 2;
      if (g.pinching) g.startDist = distance(e);
    },
    onPanResponderMove: (e, gs) => {
      const touches = e.nativeEvent.touches.length;
      if (touches === 2) {
        if (!g.pinching) { g.pinching = true; g.startDist = distance(e); g.startScale = g.scale; g.startX = g.x; g.startY = g.y; }
        const s = Math.max(1, Math.min(MAX_SCALE, (g.startScale * distance(e)) / g.startDist));
        const { x, y } = clampOffset(s, g.startX, g.startY);
        g.scale = s; g.x = x; g.y = y;
        scale.setValue(s); tx.setValue(x); ty.setValue(y);
      } else if (touches === 1 && !g.pinching && g.scale > 1) {
        const { x, y } = clampOffset(g.scale, g.startX + gs.dx, g.startY + gs.dy);
        g.x = x; g.y = y;
        tx.setValue(x); ty.setValue(y);
      }
    },
    onPanResponderRelease: (_e, gs) => {
      const wasTap = !g.pinching && Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8;
      g.pinching = false;
      if (wasTap) {
        const now = Date.now();
        if (now - g.lastTap < DOUBLE_TAP_MS) {
          g.lastTap = 0;
          if (g.scale > 1) animateTo(1, 0, 0);
          else animateTo(DOUBLE_TAP_SCALE, 0, 0);
        } else {
          g.lastTap = now;
        }
        return;
      }
      if (g.scale < 1.05) animateTo(1, 0, 0);
    },
    onPanResponderTerminationRequest: () => false,
  }), [width, height]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
        <View style={styles.backdrop}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }, { translateY: ty }, { scale }] }]}
            {...responder.panHandlers}
          >
            <Image source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={accessibilityLabel} />
          </Animated.View>
          <SafeAreaView edges={['top', 'bottom']} style={styles.overlay} pointerEvents="box-none">
            <Pressable onPress={onClose} style={styles.close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar foto">
              <CloseIcon size={40} />
            </Pressable>
            <Text style={styles.hint} pointerEvents="none">Pellizca o toca dos veces para ampliar</Text>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between' },
  close: { alignSelf: 'flex-end', margin: 12 },
  hint: { alignSelf: 'center', marginBottom: 16, color: 'rgba(255,255,255,0.75)', fontSize: 13 },
});
