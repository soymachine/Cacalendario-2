# Fluxia — 5 proyectos, códigos de contexto

Este repo contiene 5 proyectos distintos. Cuando el usuario escriba uno de
estos códigos (p.ej. "cambia a MA" o simplemente "MA: ..."), interpreta que
se refiere a ese proyecto y trabaja ahí, sin pedir confirmación.

| Código | Proyecto | Ruta / entrada principal |
|---|---|---|
| **PW** | Paciente — Web | `src/components/App.tsx` (Astro, ruta `/user`) |
| **MW** | Médicos — Web | `src/components/MedicsPanel.tsx` (Astro, ruta `/medics`) |
| **PA** | Paciente — App | `mobile/` (Expo, TestFlight, bundle `com.fluxiahealth.app` o similar) |
| **MA** | Médicos — App | `mobile-medics/` ("Fluxia Pro", Expo, bundle `com.fluxiahealth.medics`) |
| **LP** | Marketing — Landing Page | `src/pages/index.astro` (Astro, ruta `/`, `fluxia-health.com`) |

Patrón de nombres: primera letra = rol (**P**aciente / **M**édicos),
segunda letra = plataforma (**W**eb / **A**pp). **LP** es la excepción: no
tiene un rol único (ver más abajo), así que usa el código suelto de
"Landing Page".

### LP — Marketing / Landing Page

- **Qué es**: la web pública de `fluxia-health.com`, un one-pager de
  marketing (no una app funcional). Todo el contenido vive en un único
  archivo, `src/pages/index.astro` — hero, cómo funciona, ventajas,
  seguridad, especialidades, precios, FAQ, CTA final y footer.
- **Para quién**: no tiene un único rol de usuario. Sirve de **punto de
  entrada tanto para pacientes como para profesionales sanitarios** — el
  header enlaza directamente a **PW** (`/user`, botón "Paciente") y a
  **MW** (`/medics`, botón "Profesional"), cada uno abriéndose en pestaña
  nueva.
- **Para qué sirve**: es la pieza de **captación** del producto — atrae
  clientes nuevos (SEO, campañas, boca a boca), explica el producto de
  forma demostrativa (capturas reales de PW/MW, vídeo explicativo
  autoalojado en `public/video/`) y convierte visitas en altas via los
  CTAs "Empieza gratis" hacia `/medics` y `/user`. No contiene lógica de
  negocio propia ni persiste datos: es puramente presentacional/estática.
- **Relación con PW/MW**: reutiliza el mismo design system
  (`src/styles/fluxia-tokens.css`) y capturas/renders reales del producto
  (`public/imgs/`), pero su código (maquetación, componentes visuales) es
  independiente — no comparte `src/lib/*.ts` con el resto de proyectos.

## Relación entre proyectos

- **PW ↔ PA**: la web de paciente y `mobile/` comparten lógica de negocio
  portada a mano (`stats.ts`, `dates.ts`, `bristol.ts`, `tiers.ts`, etc. en
  `src/lib/` ↔ `mobile/src/lib/`).
- **MW ↔ MA**: la web de médicos y `mobile-medics/` comparten
  `semaforo.ts`, `tags.ts` y `entryFilters.ts` (`src/lib/` ↔
  `mobile-medics/src/lib/`).
- No hay monorepo/workspaces: todo el código compartido se sincroniza a
  mano. `src/lib/*.ts` es siempre la fuente canónica; si se corrige un bug
  ahí, replicarlo en la copia del proyecto app correspondiente (y viceversa
  si el bug se detecta primero en la app).
- Auth compartida: mismo proyecto Supabase (misma URL/anon key) en los 4
  proyectos, diferenciados por `user_metadata.is_doctor` + tabla `doctors`.

## Verificación por proyecto

- **PW / MW / LP** (web): `npx astro build` desde la raíz del repo.
- **PA / MA** (apps): `npx tsc --noEmit` y `npx expo export --platform ios`
  desde `mobile/` o `mobile-medics/` respectivamente.
