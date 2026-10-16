// Enlaces a las tiendas de la app de pacientes (Fluxia, com.fluxiahealth.app).
// null = aún no publicada: las páginas muestran «Muy pronto» en su lugar.
//  · App Store: https://apps.apple.com/app/id<Apple ID de App Store Connect>
//  · Google Play: https://play.google.com/store/apps/details?id=com.fluxiahealth.app
export const APP_STORE_URL: string | null = null;
export const PLAY_STORE_URL: string | null = null;

/** Esquema propio de la app (app.json → expo.scheme): abre la app si está instalada. */
export const APP_SCHEME_URL = 'fluxia://';
