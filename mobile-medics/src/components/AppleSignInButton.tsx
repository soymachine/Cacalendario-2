import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

// Botón oficial "Continuar con Apple" (solo iOS). App Store, norma 4.8: si la
// app ofrece entrar con Google, tiene que ofrecer también Iniciar sesión con
// Apple. El botón nativo cumple las guías de diseño de Apple.
export default function AppleSignInButton({ onPress }: { onPress: () => void }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, []);
  if (!available) return null;
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={24}
      style={styles.button}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  button: { width: '100%', height: 48, marginBottom: 10 },
});
