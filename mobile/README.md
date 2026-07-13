# Fluxia — App móvil (iOS / Android)

Port nativo de la PWA de pacientes (`/user`) construido con **React Native + Expo (SDK 57)**.
Usa exactamente el mismo backend de Supabase que la web: mismas tablas, misma auth,
mismas Edge Functions. Un usuario puede alternar entre la web y la app móvil y ver
los mismos datos.

## Arquitectura

- `App.tsx` — mismo flujo que el `App.tsx` web: splash → login gate → 3 pestañas
  (Historial / Registro / Cuenta) + overlays (editar, detalle de día, congrats, auth, privacidad).
- `src/lib/` — lógica de negocio portada de `src/lib` de la web:
  - `localStore.ts` sustituye a `localStorage`: caché síncrona en memoria hidratada
    al arrancar desde AsyncStorage (misma API síncrona que usaba la web).
  - `events.ts` sustituye a los eventos `window` (`fluxia-updated`, `fluxia-prefs-changed`).
  - `supabase.ts` — mismo proyecto y `storageKey`, con sesión en AsyncStorage y flujo PKCE.
  - `storage.ts`, `sync.ts`, `stats.ts`, `dates.ts`, `bristol.ts`, `preferences.ts`,
    `palettes.ts`, `tiers.ts` — portados casi literalmente.
  - `push.ts` — sustituye Web Push por **expo-notifications**: guarda
    `{ type: 'expo', token }` en `push_subscriptions.subscription`.
  - `design.ts` — tokens del design system con valores hex resueltos
    (RN no tiene variables CSS).
- `src/components/` — las ~13 pantallas activas reescritas en componentes RN.
  Las pantallas huérfanas de la web (`ProfileScreen`, `SettingsScreen`, `StatsScreen`,
  `FeedbackScreen`, `ProfileButton`) no se portaron.

## Desarrollo

```bash
cd mobile
npm install
npx expo start        # escanea el QR con Expo Go (iOS/Android)
```

Notas sobre **Expo Go**:
- Todo funciona salvo las **notificaciones push remotas**, que desde SDK 53 requieren
  un development build (`npx expo run:android` / `run:ios` o EAS).
- El login con Google usa el scheme `fluxia://`; en Expo Go el deep link de retorno
  usa el scheme de Expo Go, así que pruébalo mejor en un development build.

## Builds para las stores (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure   # crea el projectId y eas.json
eas build --platform android
eas build --platform ios
```

## Configuración pendiente en servicios externos

1. **Supabase → Authentication → URL Configuration**: añadir
   `fluxia://auth-callback` a *Redirect URLs* (necesario para el login con Google
   desde la app).
2. **Push en Android**: subir credenciales FCM (`eas credentials`) — Expo las usa
   para entregar las notificaciones. En iOS, EAS gestiona el certificado APNs.
3. **Desplegar Edge Functions actualizadas** (ahora soportan tokens Expo además de
   Web Push):
   ```bash
   supabase functions deploy send-push
   supabase functions deploy check-inactive-patients
   ```
4. **Iconos/splash**: `assets/icon.png` y `assets/splash-icon.png` usan el icono
   512px de la PWA; reemplazar por arte de 1024×1024 antes de publicar.

## Decisiones y pendientes

- **Recuperación de contraseña**: el email de recuperación redirige a la web
  (`fluxia-health.com`), donde ya existe el flujo de reset. Se puede migrar a deep
  link nativo más adelante.
- **Sentry**: la web usa `@sentry/react`; en la app hay un ErrorBoundary propio.
  Añadir `@sentry/react-native` cuando se quiera monitorización en producción.
- **Tipografía**: la web usa Lexend (Google Fonts); la app usa la fuente del sistema.
  Se puede añadir con `expo-font` + `@expo-google-fonts/lexend`.
- **Exportar datos**: en vez de descargar un archivo (web), la app comparte el JSON
  con la hoja nativa de compartir (`expo-sharing`).

## Verificación realizada

- `npx tsc --noEmit` sin errores.
- `npx expo export` (bundle de Metro) correcto para iOS y Android.
- No se ha ejecutado en simulador/dispositivo desde este entorno: probar el flujo
  completo (login → registrar → calendario → push) en Expo Go / dev build.
