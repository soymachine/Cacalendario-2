# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Ficheros portados de src/lib/ (web)

`src/lib/semaforo.ts`, `src/lib/tags.ts`, `src/lib/entryFilters.ts` y
`src/lib/plan.ts` son la
fuente canónica compartida con la web `/medics` (`src/components/MedicsPanel.tsx`)
y con la app de pacientes (`mobile/`). Las copias en `src/lib/` de este proyecto
son puertos manuales — si arreglas un bug o cambias el comportamiento, hazlo
primero en la web y replica el cambio aquí a mano. No hay tooling que lo
sincronice automáticamente.

# iPad

`ios.supportsTablet` está activo y no se usa `requireFullScreen`, así que en
iPad la app gira a horizontal y admite Split View / Slide Over (Expo declara
las cuatro orientaciones en `UISupportedInterfaceOrientations~ipad`; App Store
lo exige para la multitarea). En iPhone sigue siendo solo vertical. Reglas:

- Los umbrales de ancho viven en `useLayout()` (`src/lib/layout.ts`), que usa
  `useWindowDimensions`; nunca `Dimensions.get` a nivel de módulo: la ventana
  cambia de tamaño en caliente.
- Todo `<Modal>` lleva `supportedOrientations={MODAL_ORIENTATIONS}`; sin ello
  React Native lo limita a vertical y en un iPad en horizontal giraría la pantalla.
- Pacientes en iPad horizontal: lista y ficha a la vez (`DoctorApp`); la ficha
  pasa a dos columnas cuando hay sitio (`PatientDetailScreen`).
