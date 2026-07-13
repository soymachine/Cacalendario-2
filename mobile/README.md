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

## Flujo de pruebas por fases (sin riesgo para producción)

Contexto de riesgo: la app apunta a la **base de datos de producción** (misma URL y
anon key que la web), pero con RLS cada cuenta solo puede leer/escribir sus propias
filas. Probando con una **cuenta de prueba nueva** no se pueden tocar datos de otros
usuarios; al terminar, "Eliminar mi cuenta" borra todo rastro. La web desplegada no se
ve afectada en ninguna fase: `mobile/` no participa en el build de Astro, y las Edge
Functions modificadas no cambian en producción hasta que se ejecute
`supabase functions deploy`.

### Fase 1 — Expo Go en tu móvil (riesgo cero, sin tocar nada)

```bash
cd mobile
npm install
npx expo start        # escanea el QR con Expo Go (iOS/Android)
```

1. Crea una **cuenta de prueba nueva** con email + contraseña.
2. Prueba el flujo completo: registrar deposición y micción, calendario, detalle de
   día, editar, borrar, cuenta, feedback, exportar.
3. **Prueba de sincronización cruzada**: entra en `fluxia-health.com/user` con la misma
   cuenta y comprueba que los registros del móvil aparecen en la web (y al revés).
4. Si tienes un médico de prueba en `/medics`, vincula la cuenta para validar la config
   del doctor (campos ocultos, imagen del centro, modo de tipo de registro).

Limitaciones de Expo Go: las **push remotas no funcionan** (desde SDK 53 requieren
development build) y el **login de Google no completa el deep link** (Expo Go usa su
propio scheme). Todo lo demás funciona.

### Fase 2 — Development build (Google OAuth + push)

1. **Supabase → Authentication → URL Configuration**: añadir `fluxia://auth-callback`
   a *Redirect URLs*. Es aditivo — no altera el login de la web.
2. Build de desarrollo (empieza por Android, no requiere cuenta de pago de Apple):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure   # crea el projectId y eas.json
   eas build --profile development --platform android
   ```
   Para push en Android, sube credenciales FCM con `eas credentials`
   (en iOS, EAS gestiona el certificado APNs).
3. **Desplegar las Edge Functions con red de seguridad** (son retrocompatibles: la rama
   Expo solo se activa con suscripciones `{ type: 'expo' }`, el camino Web Push queda
   intacto). Orden recomendado:
   ```bash
   supabase functions deploy send-push
   ```
   a. Regresión: envía un push desde `/medics` a un paciente **web** suscrito → debe
      seguir llegando.
   b. Prueba móvil: activa notificaciones en la app con la cuenta de prueba y envíale
      un push desde `/medics`.
   c. Solo entonces:
      ```bash
      supabase functions deploy check-inactive-patients
      ```
   **Rollback** si algo falla:
   ```bash
   git checkout main -- supabase/functions/send-push
   supabase functions deploy send-push
   ```
4. Ojo: activar push en el móvil **reemplaza la suscripción web de esa misma cuenta**
   (hay una fila por usuario en `push_subscriptions`) — otra razón para usar una cuenta
   de prueba y no la tuya personal.

### Fase 3 — Distribución interna

- **Android**: Google Play Console → *Internal testing* (subir el `.aab` de
  `eas build --platform android`).
- **iOS**: TestFlight interno (requiere Apple Developer Program, 99 $/año).
- Invita a 2-3 personas de confianza antes de abrir a usuarios reales.
- **Iconos/splash** antes de subir a las stores: `assets/icon.png` y
  `assets/splash-icon.png` reutilizan el icono 512px de la PWA; reemplazar por arte
  de 1024×1024.

### Fase 4 — Producción

- Play Console: promocionar el track interno a producción.
- App Store: enviar a revisión desde TestFlight.
- La web sigue intacta durante todo el proceso; ambas conviven sobre el mismo backend.

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
