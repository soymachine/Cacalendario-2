import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard, Platform, ScrollView, TextInput, View,
  type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps,
} from 'react-native';

// Espacio libre entre el campo enfocado y el borde superior del teclado.
const GAP = 24;

/**
 * ScrollView que mantiene visible el campo de texto enfocado cuando se abre
 * el teclado. Con edge-to-edge (obligatorio en Android desde la SDK 54) la
 * ventana ya no se redimensiona sola, y en iOS nunca lo hace: el teclado
 * tapaba las notas. Al abrirse añade al final un hueco del alto del teclado
 * (para poder hacer scroll hasta abajo) y desplaza lo justo para que el campo
 * quede encima. También reajusta mientras un campo multilínea crece.
 */
export default function KeyboardAwareScrollView({ children, onScroll, onContentSizeChange, ...props }: ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const reveal = useCallback(() => {
    const top = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (top == null || !input) return;
    input.measureInWindow((_x, y, _w, h) => {
      const overlap = y + h + GAP - top;
      if (overlap > 0) ref.current?.scrollTo({ y: offsetY.current + overlap, animated: true });
    });
  }, []);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      // Tras pintar el hueco, para que haya recorrido de scroll.
      setTimeout(reveal, ios ? 60 : 30);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, [reveal]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  const handleContentSizeChange = (w: number, h: number) => {
    if (keyboardTop.current != null) reveal();
    onContentSizeChange?.(w, h);
  };

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      scrollEventThrottle={16}
      {...props}
      onScroll={handleScroll}
      onContentSizeChange={handleContentSizeChange}
    >
      {children}
      {keyboardHeight > 0 && <View style={{ height: keyboardHeight }} />}
    </ScrollView>
  );
}
