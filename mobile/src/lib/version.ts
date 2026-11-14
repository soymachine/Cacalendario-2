import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Versión visible en Cuenta, la misma que muestran App Store y Google Play.
// iOS y Android llevan numeración propia (expo.ios.version /
// expo.android.version en app.json) y se sube la última cifra en cada cambio
// que llegue a esa plataforma: 0.90.1, 0.90.2…
const cfg = Constants.expoConfig;
const platformVersion = Platform.OS === 'android' ? cfg?.android?.version : cfg?.ios?.version;
export const APP_VERSION = `v${platformVersion ?? cfg?.version ?? '0.90.0'}`;
