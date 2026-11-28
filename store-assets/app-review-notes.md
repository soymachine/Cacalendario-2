# Notas para App Review (Guideline 2.1 — Information Needed)

Texto para el campo **Notes** de *App Review Information* (App Store Connect →
versión → App Review Information). En inglés, que es lo que leen los revisores.
Máximo 4000 caracteres por campo. Sustituye lo que va entre [corchetes].

El vídeo: grábalo en un iPhone con el último iOS (Centro de control → Grabar
pantalla) siguiendo el guion del final. Súbelo en **Attachment** (debajo de
Notes) o como enlace no listado (YouTube, iCloud, Google Drive con acceso
público) en la línea "Screen recording".

---

## Fluxia: diario de salud (pacientes, com.fluxiahealth.app)

```
SCREEN RECORDING
[link or "attached"] — recorded on [iPhone model], iOS [version]. It starts with the app launch and shows: sign in, account creation, logging a bowel movement, a urination and a meal (with photo), the calendar and statistics, editing an entry, signing out, and account deletion (Account tab > Eliminar mi cuenta).

PURPOSE AND AUDIENCE
Fluxia is a free health diary for patients (adults, 18+) who are being followed up by a healthcare professional (gastroenterology, urology, nutrition, nursing). The patient logs bowel movements (Bristol stool scale), urinations and meals on the phone, and their professional sees the entries in real time in the companion app Fluxia Pro. It replaces paper diaries, which patients forget or fill in from memory the day of the appointment. Fluxia does not diagnose, give treatment advice or replace medical care; it only records what the patient enters and shares it with the professional the patient chose.

HOW TO USE / DEMO ACCOUNT
Sign in with email and password (Iniciar sesión / Registrarse):
- Patient account: [email] / [password]
This account is already linked to a demo professional and has sample entries.
Main features: Registro tab (bottom, center) to log an entry — choose bowel movement, urination or meal at the top, fill in the fields and tap Guardar. Estadísticas tab (left) for the calendar and statistics; tap a day to see and edit its entries. Cuenta tab (right) for profile, linked professional, notifications, sign out and account deletion.
Professional side (optional): the same data can be seen in Fluxia Pro with the professional demo account [email] / [password].
Accounts can also be created in the app with email and password, Sign in with Apple or Google. Account deletion is in Cuenta > Eliminar mi cuenta and permanently deletes all the user's data.

USER-GENERATED CONTENT
Entries, notes and meal photos are private health records. They are only visible to the patient and to the professional(s) the patient accepted an invitation from. There is no public content, feed, chat or contact between users, so there is no content to report or users to block. The professional can stop the follow-up (archive the patient) and the patient can delete their account at any time.

EXTERNAL SERVICES
- Supabase (EU region): authentication, database, file storage for meal photos and server functions.
- Sign in with Apple and Google Sign-In: optional login methods.
- Apple Push Notification service, via Expo push notifications: optional reminders.
- Resend: transactional emails (account confirmation, invitations).
No AI services, no analytics or advertising SDKs, no in-app purchases. The patient app is completely free.

REGIONAL DIFFERENCES
The app works the same in every region where it is available. It is in Spanish. It is not distributed in China mainland.

REGULATED INDUSTRY
Fluxia is a symptom and intake diary, not a medical device: it does not diagnose, monitor vital signs or recommend treatment, and it is not certified as a medical device (CE/MDR, UKCA or FDA). It is published by Think Things Studio Barcelona S.L. (Spain, VAT ESB66920810). Health data is processed under the GDPR; privacy policy: https://fluxia-health.com/privacy
```

---

## Fluxia Pro: seguimiento médico (profesionales, com.fluxiahealth.medics)

```
SCREEN RECORDING
[link or "attached"] — recorded on [iPhone model], iOS [version]. It starts with the app launch and shows: sign in, the patient list with the follow-up traffic light, a patient's detail (entries, Bristol trend, statistics, clinical notes), inviting a patient, the follow-up settings (what each patient has to log), Settings, sign out and account deletion (Ajustes > Eliminar mi cuenta).

PURPOSE AND AUDIENCE
Fluxia Pro is for healthcare professionals (doctors, nurses, dietitians) who follow up patients between appointments, mainly in gastroenterology, urology and nutrition. The professional invites a patient by email; the patient logs bowel movements, urinations and meals in the free app Fluxia, and the professional sees the entries in real time. A traffic light (green, amber, red) shows which patients have stopped logging, so the professional knows who needs attention. It does not diagnose or recommend treatment: the clinical judgement is always the professional's.

HOW TO USE / DEMO ACCOUNT
Sign in with email and password:
- Professional account: [email] / [password]
This account has an active plan and linked demo patients with sample entries.
Main features: the home screen (Fluxia button in the bottom bar) shows the patient list; tap a patient to open their detail; "+ Invitar paciente" invites one by email; the Ajustes tab has the profile, traffic light thresholds, tags, plan status, the user guide, sign out and account deletion.
Patient side (optional): patient demo account for Fluxia [email] / [password], linked to this professional.
Professionals can also create an account in the app (email and password, Sign in with Apple or Google); new accounts get a 30-day free trial.

PAID FEATURES
The app has no in-app purchases and no links, buttons or prices to buy anything. Professional plans are a B2B subscription that clinics manage outside the app; the app only shows the current plan status. The demo account has an active plan, so every feature is available. If a professional deletes their account, any active subscription is cancelled automatically.

USER-GENERATED CONTENT
Clinical notes and tags are private and only visible to the professional who wrote them. Patient entries are only visible to the patient and the professional(s) the patient accepted. There is no public content, feed, chat or contact between users, so there is no content to report or users to block. The professional can archive a patient to stop the follow-up.

EXTERNAL SERVICES
- Supabase (EU region): authentication, database, file storage and server functions.
- Sign in with Apple and Google Sign-In: optional login methods.
- Resend: transactional emails (patient invitations, account confirmation).
- Stripe: billing of professional plans, only on the website, never inside the app.
No AI services, no analytics or advertising SDKs.

REGIONAL DIFFERENCES
The app works the same in every region where it is available. It is in Spanish. It is not distributed in China mainland.

REGULATED INDUSTRY
Fluxia Pro is a follow-up tool for professionals to see the diaries their own patients choose to share; it is not a medical device: it does not diagnose, monitor vital signs or recommend treatment, and it is not certified as a medical device (CE/MDR, UKCA or FDA). The professional is responsible for the care of their patients. It is published by Think Things Studio Barcelona S.L. (Spain, VAT ESB66920810). Health data is processed under the GDPR; privacy policy: https://fluxia-health.com/privacy
```

---

## Guion del vídeo (unos 2–3 minutos por app)

Graba en un iPhone con el último iOS. Empieza con la app cerrada y en la pantalla de inicio.

**Fluxia (pacientes)**
1. Abrir la app desde el icono (splash).
2. Iniciar sesión / Registrarse → enseñar "Crear cuenta" (sin completarla) y entrar con la cuenta de prueba.
3. Registro: una deposición (forma, color, cantidad…) → Guardar → modal "Registro correcto" → cerrar.
4. Registro: una micción → Guardar.
5. Registro: una comida con foto (hacer o elegir foto) → Guardar.
6. Estadísticas: calendario y estadísticas → tocar un día → abrir un registro → editarlo → guardar.
7. Cuenta: perfil, profesional vinculado, notificaciones → Cerrar sesión.
8. Borrado de cuenta: con **otra** cuenta creada para la ocasión (o con Iniciar sesión con Apple), Cuenta → Eliminar mi cuenta → confirmar → vuelve a la pantalla de acceso.

**Fluxia Pro (profesionales)**
1. Abrir la app desde el icono.
2. Iniciar sesión con la cuenta de prueba (enseñar que existe "Crear cuenta médica").
3. Lista de pacientes con el semáforo y los filtros.
4. Abrir un paciente: registros, tendencia de Bristol, estadísticas, nota clínica nueva.
5. Configuración del seguimiento del paciente (qué registra, comidas) y archivar / reactivar.
6. "+ Invitar paciente": rellenar un email (se puede no enviar).
7. Ajustes: perfil, semáforo, etiquetas, "Tu suscripción" (solo informativa), Guía de uso → Cerrar sesión.
8. Borrado de cuenta con una cuenta de profesional creada para la ocasión: Ajustes → Eliminar mi cuenta → confirmar.

No borres las cuentas de prueba que das a Apple: usa cuentas aparte para enseñar el borrado.
