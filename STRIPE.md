# Integrar Stripe en Fluxia — guía paso a paso

Guía para poner en marcha los cobros del plan **Pro** de médicos (MW).
Está escrita asumiendo que **nunca has usado Stripe**: cada paso dice
exactamente dónde hacer clic y cómo comprobar que ha funcionado.

El código ya está escrito y commiteado. Lo que queda es **configuración**:
crear la cuenta, el producto y las claves, y desplegar. Calcula unas 2 horas
la primera vez, más los días que tarde Stripe en verificar tu cuenta.

---

## 0. Cómo encaja todo (léelo antes de tocar nada)

Fluxia es un sitio **estático** (Astro sin adaptador SSR): no hay servidor
propio donde esconder la clave secreta de Stripe. Por eso el backend de pagos
son **Supabase Edge Functions**, igual que `delete-user` o `send-push`.

El flujo completo, con un médico que quiere pasar a Pro:

```
[ MW · navegador ]                [ Edge Functions ]              [ Stripe ]
      │
      │ 1. clic "Activar plan Pro"
      ├──────────────────────────► stripe-checkout
      │                                 │ 2. crea/recupera el Customer
      │                                 ├─────────────────────────────► API
      │                                 │ 3. crea la Checkout Session
      │                                 ├─────────────────────────────► API
      │ 4. { url }                      │
      │◄────────────────────────────────┤
      │
      │ 5. redirección a la página de pago de Stripe
      ├────────────────────────────────────────────────────────────► Checkout
      │                                                                  │
      │ 7. vuelta a /medics?checkout=success                             │ 6. paga
      │◄─────────────────────────────────────────────────────────────────┤
      │                                                                  │
      │                            stripe-webhook ◄──────────────────────┤
      │                                 │  8. checkout.session.completed
      │                                 │  9. UPDATE doctors SET plan='pro'
      │ 10. refresco: ya eres Pro       ▼
      │◄──────────────────────────  [ Supabase DB ]
```

Tres ideas que conviene interiorizar desde el principio:

1. **La tarjeta nunca pasa por tu código.** El médico la introduce en un
   dominio de Stripe (Checkout). Tú solo rediriges. Esto te saca de casi todo
   el alcance de PCI-DSS y es la razón de usar Checkout en vez de formularios
   propios.
2. **El pago NO se confirma en la redirección de vuelta.** El usuario puede
   cerrar el navegador justo después de pagar y nunca volver a `/medics`. La
   fuente de verdad es el **webhook**, que Stripe entrega servidor a servidor
   con reintentos. La redirección solo sirve para enseñar un "¡gracias!".
3. **El plan solo lo escribe el webhook.** La base de datos ya lo fuerza: el
   trigger `guard_doctor_plan_change` rechaza cualquier cambio de `plan` que
   no venga de `service_role`. Un médico no puede hacerse Pro desde la consola
   del navegador ni tocando la petición.

### Qué hay ya en el repositorio

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20260810_stripe_billing.sql` | Columnas de estado, tabla de idempotencia y los RPC `billing_apply_subscription` / `billing_attach_customer` |
| `supabase/functions/_shared/stripe.ts` | Cliente de Stripe para Deno + verificación del JWT del médico |
| `supabase/functions/stripe-checkout/index.ts` | Crea la sesión de pago |
| `supabase/functions/stripe-portal/index.ts` | Abre el portal de cliente (facturas, cambiar tarjeta, cancelar) |
| `supabase/functions/stripe-webhook/index.ts` | Recibe los eventos y escribe el plan |
| `src/lib/billing.ts` | Las tres funciones que llama el navegador |
| `supabase/migrations/20260810b_trial_on_signup.sql` | Los registros nuevos entran en el trial de 30 días (`test`), vía trigger |
| `src/components/MedicsPanel.tsx` | Botones cableados + aviso al volver de Stripe |

### El ciclo de vida de un médico

```
registro (sin tarjeta) ──► test · 30 días ──► caduca ──► modal de pago
                                                             │
                                                             ▼
                                                    Stripe Checkout ──► pro
```

Los médicos que ya estaban en `beta` conservan su acceso indefinido: la
migración solo cambia las altas nuevas.

---

## 1. Crear la cuenta de Stripe

1. Entra en <https://dashboard.stripe.com/register> y regístrate con el email
   de la empresa (no uno personal: la cuenta es difícil de migrar después).
2. Cuando pregunte el país elige **España**. **Esto no se puede cambiar
   nunca más** — determina la entidad legal, las divisas y los métodos de pago
   disponibles. Si vas a facturar desde una sociedad española, España.
3. Activa la **verificación en dos pasos**. Stripe la exige y es tu cuenta de
   dinero: usa una app de autenticación, no SMS.

En cuanto entras estás en **modo Test**. Arriba a la derecha hay un
interruptor **"Modo de prueba" / "Test mode"**. Todo el desarrollo se hace ahí:
mismas pantallas, mismos eventos, dinero de mentira. **No salgas de modo Test
hasta el paso 10.**

---

## 2. Activar la cuenta para cobros reales

Puedes hacerlo en paralelo mientras programas, porque tarda: Stripe pide
documentación y su revisión puede llevar de horas a varios días.

En **Dashboard → Configuración → Detalles de la empresa**, prepara:

- CIF/NIF y nombre fiscal exacto de la sociedad (o tu NIF si eres autónomo).
- Domicilio fiscal.
- IBAN de la cuenta donde quieres recibir los pagos.
- DNI/NIE de los administradores y de cualquier titular real con ≥25%.
- Descripción de la actividad y URL de la web (`https://fluxia-health.com`).

Configura también:

- **Descriptor de extracto**: lo que verá el médico en su banco. Pon `FLUXIA`
  o similar. Si pones algo irreconocible te comerás disputas por
  "no reconozco este cargo", que cuestan 15 € cada una.
- **Email de soporte** y teléfono: Stripe los muestra en el recibo.

> **Sobre el IVA — ya decidido: usamos Stripe Tax.** Fluxia vende a
> profesionales sanitarios, así que el SaaS lleva **21% de IVA** en España.
> Stripe Tax lo calcula y lo aplica solo, también si algún día vendes a otro
> país de la UE. Cuesta un 0,5% extra por transacción.
>
> Lo que ya está configurado en **modo test**:
>
> - `automatic_tax: { enabled: true }` en `stripe-checkout`.
> - Precio con `tax_behavior: exclusive` — 19,95 € **sin** IVA, como anuncia
>   la landing. Esto no se puede cambiar en un precio existente: para pasar a
>   precio con IVA incluido habría que crear un precio nuevo.
> - Código fiscal del producto `txcd_10103001` (SaaS · uso empresarial), y el
>   mismo como valor por defecto de la cuenta.
> - Registro fiscal de **ES** dado de alta en Stripe Tax. **Sin registro,
>   Stripe Tax calcula 0 €**: es el fallo silencioso más fácil de cometer.
> - `tax_id_collection` para que el profesional ponga su NIF en la factura.
>
> Al pasar a producción hay que **repetir el registro fiscal de ES en modo
> live**, con la fecha desde la que realmente estás dado de alta en Hacienda.
> Stripe solo lo anota: no te registra ante la AEAT. **Consulta con tu asesor
> fiscal antes de facturar de verdad**: esto es configuración, no
> asesoramiento fiscal.

---

## 3. Crear el producto y el precio

> **Ya hecho en modo test** (cuenta `acct_1TEDMRANIg6DlLEV`, *Fluxia Health*):
>
> | | |
> |---|---|
> | Producto | `prod_V3h0dwRIftEwpV` — Fluxia Pro |
> | Precio | `price_1U3ZcAANIg6DlLEVMuONWgUB` — 19,95 €/mes, IVA aparte |
> | `lookup_key` | `fluxia_pro_monthly` |
> | Registro fiscal | `taxreg_1U3ZhQANIg6DlLEVPMA3XQLn` (ES) |
>
> Queda pendiente repetirlo en **modo live**. Los pasos de abajo describen
> cómo se hizo, por si hay que rehacerlo o crear otro plan.

1. **Dashboard → Catálogo de productos → + Añadir producto** (asegúrate de
   estar en **modo Test**).
2. Rellena:
   - **Nombre**: `Fluxia Pro` — es lo que el médico verá en la pantalla de pago
     y en la factura.
   - **Descripción**: `Pacientes ilimitados, alertas avanzadas e informes PDF.`
3. En el bloque de precio:
   - **Modelo**: `Estándar` / recurrente.
   - **Importe**: `19,95` — **EUR**.
   - **Periodo de facturación**: `Mensual`.
   - **Incluye impuestos**: según lo que hayas decidido en el paso 2.
4. Guarda. Entra en el producto y copia el **ID del precio**: empieza por
   `price_…` (¡no el `prod_…`!). Lo necesitas en el paso 5.

> Cuando llegue el momento de producción tendrás que **repetir este paso en
> modo Live**, porque los productos de Test no existen en Live y el `price_…`
> será distinto. Es el error nº1 al lanzar.

---

## 4. Copiar las claves de API

**Dashboard → Desarrolladores → Claves de API** (en modo Test):

| Clave | Aspecto | Dónde va |
|---|---|---|
| Publicable | `pk_test_…` | No la necesitas: Checkout se abre por redirección |
| **Secreta** | `sk_test_…` | Solo en los secrets de Supabase |

⚠️ La clave secreta permite mover dinero de tu cuenta. **Nunca** en el
repositorio, ni en `src/`, ni en un `.env` commiteado, ni pegada en un chat.
Si alguna vez se filtra, revócala desde ese mismo panel con "Rotar".

---

## 5. Aplicar la migración y desplegar las funciones

Necesitas la CLI de Supabase (`brew install supabase/tap/supabase` o
`npm i -g supabase`), y estar logueado (`supabase login`).

```bash
# Enlaza el repo con tu proyecto (una sola vez)
supabase link --project-ref vchzhwvbvnwrrgfrxfor

# 1. Migración: columnas de facturación + RPC
supabase db push

# 2. Secrets (¡nunca al repo!)
supabase secrets set STRIPE_SECRET_KEY=sk_test_TU_CLAVE
supabase secrets set STRIPE_PRICE_PRO=price_TU_PRECIO
supabase secrets set SITE_URL=https://fluxia-health.com

# 3. Funciones. El webhook va SIN verificación de JWT:
#    quien la llama es Stripe, no un usuario logueado.
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta
Supabase sola: no hay que declararlas.

> Si prefieres no instalar la CLI, puedes pegar el contenido de cada
> `index.ts` en **Dashboard de Supabase → Edge Functions → Deploy a new
> function**, y el SQL en **SQL Editor**. Ojo: en `stripe-webhook` hay que
> desmarcar "Verify JWT" en los ajustes de la función, y los imports de
> `../_shared/` habría que pegarlos inline.

**Comprobación:** en el dashboard de Supabase, `Edge Functions`, deben
aparecer las tres en verde. En `Database → Tables` debe existir
`stripe_events`, y `doctors` debe tener las columnas `stripe_status`,
`stripe_current_period_end` y `stripe_cancel_at_period_end`.

---

## 6. Conectar el webhook

Ahora le dices a Stripe dónde avisar cuando alguien pague.

1. **Dashboard de Stripe → Desarrolladores → Webhooks → + Añadir endpoint**.
2. **URL del endpoint**:
   ```
   https://vchzhwvbvnwrrgfrxfor.supabase.co/functions/v1/stripe-webhook
   ```
3. **Eventos a escuchar** — selecciona exactamente estos cuatro:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

   No selecciones "todos los eventos": recibirías cientos de mensajes al día
   que la función descarta, y te complica leer los logs.
4. Guarda, entra en el endpoint recién creado y copia el **Signing secret**
   (`whsec_…`). Ese secreto es lo que permite a la función distinguir un
   evento real de Stripe de alguien haciendo POST a tu URL:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_TU_SECRETO
supabase functions deploy stripe-webhook --no-verify-jwt   # recarga el secret
```

---

## 7. La primera prueba de punta a punta

Con la web desplegada (o `npm run dev` apuntando al Supabase real):

1. Entra en `/medics` con una cuenta de médico de prueba.
2. Ponte en un plan que muestre el botón: desde `/admin` puedes forzar `free`
   con `admin_set_doctor_plan`, o esperar a que caduque un plan `test`.
3. Pulsa **"Activar plan Pro"**. Debes aterrizar en la página de pago de
   Stripe, en español, con `Fluxia Pro · 19,95 € al mes`.
4. Paga con la **tarjeta de prueba**:

   | Campo | Valor |
   |---|---|
   | Número | `4242 4242 4242 4242` |
   | Caducidad | cualquier fecha futura, p.ej. `12/34` |
   | CVC | `123` |
   | Código postal | `08001` |

5. Deberías volver a `/medics?checkout=success`, ver el aviso verde y, en
   pocos segundos, la insignia **PRO** junto a tu avatar.

**Si el aviso dice "Estamos confirmando el pago" y nunca cambia**, el webhook
no ha llegado o ha fallado. Diagnóstico, en este orden:

- **Stripe → Webhooks → tu endpoint → pestaña de intentos.** Verás cada
  entrega con su código de respuesta. `200` = procesada. `400` = firma
  inválida (el `whsec_` no coincide: repite el paso 6). `401` = desplegaste
  sin `--no-verify-jwt`. `500` = error dentro de la función.
- **Supabase → Edge Functions → stripe-webhook → Logs.** Ahí sale el
  `console.error` con el motivo real.
- **Tabla `stripe_events`**: si el evento está registrado, la función lo
  recibió. Si además `doctors.plan` sigue en `free`, el fallo está en el RPC.

Prueba también estos casos, que son los que rompen en producción:

| Caso | Cómo probarlo | Qué debe pasar |
|---|---|---|
| Pago rechazado | Tarjeta `4000 0000 0000 0002` | Stripe muestra el error, no cambia el plan |
| Requiere 3D Secure | Tarjeta `4000 0025 0000 3155` | Aparece la pantalla del banco; al confirmar, pasa a Pro |
| Cancelar antes de pagar | Botón "atrás" en Checkout | Vuelve con `?checkout=cancel`, sigue en free |
| Cancelar la suscripción | Menú de cuenta → "Facturación y suscripción" → Cancelar | Sigue Pro hasta fin de periodo; al llegar la fecha, `deleted` lo baja a free |
| Evento duplicado | Botón "Reenviar" en el panel de webhooks | Segunda entrega responde `duplicate: true`, sin efectos |

Para simular el fin de una suscripción sin esperar un mes, usa los
**relojes de prueba** (Stripe → Clientes → Test clocks): crean un cliente cuyo
tiempo puedes adelantar semanas de golpe.

---

## 8. Qué ve el médico ya cobrando

- **Insignia PRO** junto al avatar.
- **Menú de cuenta → "Facturación y suscripción"**: abre el Customer Portal de
  Stripe, donde puede descargar facturas, cambiar de tarjeta y cancelar. No
  tienes que construir ni mantener ninguna de esas pantallas.

Para que el portal funcione hay que configurarlo una vez en
**Stripe → Configuración → Portal de clientes**: activa "Cancelar
suscripción", "Actualizar método de pago" e "Historial de facturas", y pega
las URLs de tus condiciones y privacidad (`https://fluxia-health.com/privacy`).

---

## 9. Facturas automáticas

En **Stripe → Configuración → Facturas**:

- Activa **"Enviar facturas por email a los clientes"**. Sin esto, el médico
  paga y no recibe nada: es la primera queja que te va a llegar.
- Sube el **logo** y pon el color de marca.
- Configura la **numeración de facturas** con una serie propia.

Si necesitas facturas con validez fiscal española (numeración correlativa
sin huecos, datos registrales completos), habla con tu asesor: puede que
necesites exportar a tu programa de facturación en vez de usar las de Stripe.

---

## 10. Pasar a producción

Cuando todo funcione en Test y Stripe haya aprobado tu cuenta:

1. Quita el modo Test en el Dashboard.
2. **Vuelve a crear el producto y el precio** en modo Live (paso 3). El ID
   será distinto.
3. Copia la **clave secreta Live** (`sk_live_…`) del paso 4.
4. **Crea otro endpoint de webhook** en modo Live (paso 6) — los endpoints de
   Test no se copian. Nuevo `whsec_…`.
5. Actualiza los secrets y redespliega:

   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_…
   supabase secrets set STRIPE_PRICE_PRO=price_… # el nuevo, de Live
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_… # el nuevo, de Live
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

6. **Haz un pago real con tu propia tarjeta** (19,95 € que puedes reembolsar
   desde el Dashboard). Es la única forma de verificar la cadena Live entera.
7. En **Stripe → Desarrolladores → Alertas de webhooks**, activa el aviso por
   email si un endpoint empieza a fallar. Un webhook caído significa médicos
   que pagan y no reciben su plan.

---

## Decisiones que quedan abiertas

Estas las tomé yo para poder dejarlo funcionando; cámbialas si no encajan:

1. **Un solo plan de pago.** La landing (`src/pages/index.astro`) anuncia
   tres — Inicio 0 €, Profesional 19,95 €, Equipo 49,95 € — pero la base de
   datos solo admite `free | beta | test | pro`, y **no existe soporte
   multi-usuario por centro**, que es justo lo que vende el plan Equipo. He
   implementado solo Pro. Antes de anunciar Equipo hay que: añadir `team` al
   CHECK de `doctors.plan`, crear un segundo Price, y construir el
   multi-usuario de verdad. Mientras tanto, yo marcaría Equipo como
   "Próximamente" en la landing.
2. **El precio del modal estaba mal.** `MedicsPanel` decía 49 €/mes y la
   landing 19,95 €. Lo he unificado a 19,95 € desde `PRO_PRICE_LABEL` en
   `src/lib/billing.ts`. Si el precio bueno era otro, cámbialo ahí **y** en
   el Price de Stripe.
3. **La prueba gratuita es vuestra, no de Stripe, y no pide tarjeta.** El
   plan `test` de 30 días se gestiona en la base de datos, y Checkout solo
   entra en escena cuando caduca o cuando el médico decide pagar antes. Si
   algún día prefieres el trial de Stripe (pedir tarjeta el día 1 y cobrar al
   31 — convierte mejor, pero rompe el "sin tarjeta de crédito" de la
   landing), es añadir `subscription_data: { trial_period_days: 30 }` en
   `stripe-checkout`.
4. **Impagos con margen.** `past_due` y `unpaid` mantienen el acceso Pro: si a
   un médico le caduca la tarjeta, Stripe reintenta durante días y no quiero
   cortarle el acceso a datos clínicos por eso. Solo cuando Stripe cancela
   definitivamente baja a `free`. Se ajusta en la constante `ENTITLED` de
   `stripe-webhook/index.ts`.
5. **En la app iOS (MA) no hay ningún botón de pago.** La app solo lee el plan
   de la base de datos. Es deliberado: Apple exige su sistema de compras (y su
   30%) para cualquier venta de funcionalidad digital dentro de la app, e
   incluso enlazar fuera está restringido. Cobrar solo desde la web es lo
   habitual en SaaS profesional y lo que evita el rechazo en revisión.
