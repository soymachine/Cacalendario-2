# Fluxia — 4 proyectos, códigos de contexto

Este repo contiene 4 proyectos distintos. Cuando el usuario escriba uno de
estos códigos (p.ej. "cambia a MA" o simplemente "MA: ..."), interpreta que
se refiere a ese proyecto y trabaja ahí, sin pedir confirmación.

| Código | Proyecto | Ruta / entrada principal |
|---|---|---|
| **PW** | Paciente — Web | `src/components/App.tsx` (Astro, ruta `/user`) |
| **MW** | Médicos — Web | `src/components/MedicsPanel.tsx` (Astro, ruta `/medics`) |
| **PA** | Paciente — App | `mobile/` (Expo, TestFlight, bundle `com.fluxiahealth.app` o similar) |
| **MA** | Médicos — App | `mobile-medics/` ("Fluxia Pro", Expo, bundle `com.fluxiahealth.medics`) |

Patrón de nombres: primera letra = rol (**P**aciente / **M**édicos),
segunda letra = plataforma (**W**eb / **A**pp).

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

- **PW / MW** (web): `npx astro build` desde la raíz del repo.
- **PA / MA** (apps): `npx tsc --noEmit` y `npx expo export --platform ios`
  desde `mobile/` o `mobile-medics/` respectivamente.
