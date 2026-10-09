import Constants from 'expo-constants';

// Versión visible en Cuenta: la de app.json (expo.version), la misma que
// muestran App Store y Google Play. Hasta el lanzamiento: 0.90.x.
export const APP_VERSION = `v${Constants.expoConfig?.version ?? '0.90.0'}`;
