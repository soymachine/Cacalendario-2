-- ============================================================================
-- Tests de la migración 20261001_food_tracking.sql: compatibilidad hacia atrás,
-- validación de datos y permisos (RLS de entries, patient_links, Storage).
-- Se ejecuta con supabase/tests/run.sh después de 00_mock_supabase.sql y de
-- aplicar la migración (dos veces, para comprobar que es idempotente).
-- Cualquier aserción fallida aborta con RAISE EXCEPTION → código de salida ≠ 0.
-- ============================================================================
\set ON_ERROR_STOP 1

CREATE FUNCTION pg_temp.assert_eq(actual bigint, expected bigint, msg text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL: % (esperado %, obtenido %)', msg, expected, actual;
  END IF;
  RAISE NOTICE 'ok - %', msg;
END $$;

-- Ejecuta `stmt` y exige que falle (RLS, CHECK o trigger).
CREATE FUNCTION pg_temp.assert_fails(stmt text, msg text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ok - % (%)', msg, SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'FAIL: % (la sentencia no falló)', msg;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

-- ── Fixtures (como superusuario) ──
-- pa/pb: pacientes · d1: médico de pa · d2: médico de pb
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'pa@test'),
  ('00000000-0000-0000-0000-0000000000b1', 'pb@test'),
  ('00000000-0000-0000-0000-0000000000d1', 'd1@test'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@test');
INSERT INTO public.doctors (id, name) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'D1'),
  ('00000000-0000-0000-0000-0000000000d2', 'D2');
INSERT INTO public.patient_links (id, patient_id, doctor_id, status) VALUES
  ('11111111-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1', 'accepted'),
  ('11111111-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d2', 'accepted');

-- Simula una sesión de Supabase (rol + claims del JWT) para el resto de la transacción.
CREATE FUNCTION pg_temp.login(uid text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

-- ── 1. Estado por defecto: módulo desactivado, sin cambios para nadie ──
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.patient_links WHERE food_config IS NOT NULL), 0,
  'pacientes existentes quedan con la comida desactivada (food_config NULL)');
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.buckets WHERE id = 'food-photos' AND public = false), 1,
  'bucket food-photos existe y es privado');

-- ── 2. Deposición y micción siguen igual (cliente antiguo sin columnas food_*) ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, bristol, symptoms)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'legacy_poop', '2026-09-30', '08:00', 1, 'poop', 4, '{bloating}');
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, urine_type)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'legacy_urine', '2026-09-30', '09:00', 2, 'urine', 'voluntary');
-- upsert de un cliente antiguo (mismo onConflict que src/lib/sync.ts)
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, bristol)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'legacy_poop', '2026-09-30', '08:05', 1, 'poop', 5)
  ON CONFLICT (user_id, entry_id) DO UPDATE SET time = EXCLUDED.time, bristol = EXCLUDED.bristol;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE entry_type IN ('poop', 'urine') AND food_tags = '{}'), 2,
  'registros de deposición/micción se insertan y actualizan sin columnas food_*');
SELECT pg_temp.assert_eq((SELECT bristol FROM public.entries WHERE entry_id = 'legacy_poop'), 5,
  'upsert de deposición actualiza como antes');
COMMIT;

-- ── 3. Paciente crea un registro de comida completo ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, notes,
    food_meal_type, food_description, food_portion, food_tags, food_photo_path)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'food_1', '2026-09-30', '14:10', 3, 'food', 'con prisa',
    'lunch', 'Pasta con tomate', 'normal', '{Gluten,Lácteos}',
    '00000000-0000-0000-0000-0000000000a1/food_1.jpg');
-- Registro mínimo: solo foto + fecha/hora (protocolo de registro rápido)
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_photo_path)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'food_2', '2026-09-29', '21:00', 4, 'food',
    '00000000-0000-0000-0000-0000000000a1/food_2.jpg');
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE entry_type = 'food'), 2,
  'el paciente crea registros de comida (completo y solo foto + fecha/hora)');
-- Edición retrospectiva de fecha/hora
UPDATE public.entries SET date = '2026-09-28', time = '20:30' WHERE entry_id = 'food_2';
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE entry_id = 'food_2' AND date = '2026-09-28'), 1,
  'el paciente puede editar la fecha/hora de un registro de comida');
COMMIT;

-- ── 4. Validación de datos ──
-- Dentro de una transacción explícita: los claims de login() son locales a ella.
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
-- Control: con esta sesión una inserción válida sí funciona (así los fallos de
-- abajo se deben a la validación y no a una sesión mal montada).
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_meal_type)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'ok_control', '2026-09-30', '10:00', 5, 'food', 'mid_morning');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_meal_type)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad1', '2026-09-30', '10:00', 5, 'food', 'brunch')$$,
  'rechaza un tipo de comida desconocido');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_portion)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad2', '2026-09-30', '10:00', 5, 'food', '350g')$$,
  'rechaza cantidades que no sean small/normal/large');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_description)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad3', '2026-09-30', '10:00', 5, 'poop', 'tostada')$$,
  'rechaza campos de comida en una deposición');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad4', '2026-09-30', '10:00', 5, 'banana')$$,
  'rechaza tipos de registro desconocidos');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_photo_path)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad5', '2026-09-30', '10:00', 5, 'food', '00000000-0000-0000-0000-0000000000b1/x.jpg')$$,
  'un registro no puede apuntar a la foto de otro paciente');
SELECT pg_temp.assert_fails($$INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type)
  VALUES ('00000000-0000-0000-0000-0000000000b1', 'bad6', '2026-09-30', '10:00', 5, 'food')$$,
  'un paciente no puede crear registros a nombre de otro');
ROLLBACK;

-- Registro de comida de pb (para las pruebas de aislamiento)
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_description)
  VALUES ('00000000-0000-0000-0000-0000000000b1', 'food_b', '2026-09-30', '13:00', 6, 'food', 'Ensalada');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('food-photos', '00000000-0000-0000-0000-0000000000b1/food_b.jpg');

-- ── 5. Permisos de lectura de registros ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000b1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE user_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'un paciente no ve los registros de otro paciente');
COMMIT;

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE entry_type = 'food'), 2,
  'el profesional vinculado ve las comidas de su paciente (y solo las suyas)');
COMMIT;

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d2');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.entries WHERE user_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'un profesional no ve registros de pacientes no vinculados');
COMMIT;

-- ── 6. Fotos en Storage ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
INSERT INTO storage.objects (bucket_id, name) VALUES ('food-photos', '00000000-0000-0000-0000-0000000000a1/food_1.jpg');
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'food-photos'), 1,
  'el paciente sube y ve su foto, pero no las de otros');
SELECT pg_temp.assert_fails($$INSERT INTO storage.objects (bucket_id, name) VALUES ('food-photos', '00000000-0000-0000-0000-0000000000b1/intruso.jpg')$$,
  'el paciente no puede subir fotos a la carpeta de otro paciente');
SELECT pg_temp.assert_fails($$INSERT INTO storage.objects (bucket_id, name) VALUES ('food-photos', 'suelta.jpg')$$,
  'no se aceptan fotos fuera de una carpeta de paciente');
COMMIT;

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'food-photos'), 1,
  'el profesional ve las fotos de su paciente vinculado y no las de otros');
SELECT pg_temp.assert_fails($$INSERT INTO storage.objects (bucket_id, name) VALUES ('food-photos', '00000000-0000-0000-0000-0000000000a1/medico.jpg')$$,
  'el profesional no puede subir fotos en nombre del paciente');
COMMIT;

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d2');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.objects WHERE name LIKE '00000000-0000-0000-0000-0000000000a1/%'), 0,
  'un profesional no vinculado no ve las fotos del paciente');
COMMIT;

BEGIN;
SET LOCAL ROLE anon;
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'food-photos'), 0,
  'sin sesión no se ve ninguna foto');
COMMIT;

-- Paciente desvinculado del todo (invitación pendiente): el médico pierde acceso
UPDATE public.patient_links SET status = 'pending' WHERE id = '11111111-0000-0000-0000-0000000000a1';
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'food-photos'), 0,
  'sin vínculo aceptado el profesional no ve fotos');
COMMIT;
UPDATE public.patient_links SET status = 'accepted' WHERE id = '11111111-0000-0000-0000-0000000000a1';

-- ── 7. Pauta de comida (food_config) ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d1');
SET LOCAL ROLE authenticated;
UPDATE public.patient_links
  SET food_config = '{"version":1,"enabled":true,"fields":{"photo":"required"}}'
  WHERE id = '11111111-0000-0000-0000-0000000000a1';
UPDATE public.doctors SET food_tag_catalog = '{Lácteos,Gluten,Café}' WHERE id = '00000000-0000-0000-0000-0000000000d1';
COMMIT;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.patient_links WHERE food_config->>'enabled' = 'true'), 1,
  'el profesional activa y configura la comida de su paciente');
SELECT pg_temp.assert_eq((SELECT cardinality(food_tag_catalog) FROM public.doctors WHERE id = '00000000-0000-0000-0000-0000000000d1'), 3,
  'el profesional gestiona su catálogo de etiquetas de comida');

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000d2');
SET LOCAL ROLE authenticated;
UPDATE public.patient_links SET food_config = '{"enabled":false}' WHERE id = '11111111-0000-0000-0000-0000000000a1';
COMMIT;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.patient_links WHERE food_config->>'enabled' = 'true'), 1,
  'otro profesional no puede cambiar la pauta de un paciente ajeno');

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_fails($$UPDATE public.patient_links SET food_config = '{"enabled":false}' WHERE id = '11111111-0000-0000-0000-0000000000a1'$$,
  'el paciente no puede modificar su propia pauta de comida');
COMMIT;

BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
UPDATE public.patient_links SET status = 'accepted' WHERE id = '11111111-0000-0000-0000-0000000000a1';
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.patient_links WHERE patient_id = auth.uid()), 1,
  'el paciente sigue pudiendo actualizar su vínculo (aceptar invitación)');
COMMIT;

SELECT pg_temp.assert_fails($$UPDATE public.patient_links SET food_config = '[1,2]' WHERE id = '11111111-0000-0000-0000-0000000000a1'$$,
  'food_config debe ser un objeto JSON');
SELECT pg_temp.assert_eq(
  (SELECT count(*) FROM (VALUES ('anon'), ('authenticated')) r(role)
     WHERE has_function_privilege(r.role, 'public.guard_patient_food_config()', 'EXECUTE')), 0,
  'la función del trigger no se puede invocar como RPC');

-- ── 8. food_reminder_log es solo de sistema ──
INSERT INTO public.food_reminder_log (patient_id, local_date, slot)
  VALUES ('00000000-0000-0000-0000-0000000000a1', '2026-09-30', 'lunch');
SELECT pg_temp.assert_fails($$INSERT INTO public.food_reminder_log (patient_id, local_date, slot)
  VALUES ('00000000-0000-0000-0000-0000000000a1', '2026-09-30', 'lunch')$$,
  'un recordatorio por comida y día como máximo');
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000a1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.food_reminder_log), 0,
  'los usuarios no leen el registro de recordatorios');
SELECT pg_temp.assert_fails($$INSERT INTO public.food_reminder_log (patient_id, local_date, slot)
  VALUES ('00000000-0000-0000-0000-0000000000a1', '2026-09-30', 'dinner')$$,
  'los usuarios no escriben en el registro de recordatorios');
COMMIT;

\echo 'food_tracking.test.sql: todas las aserciones OK'
