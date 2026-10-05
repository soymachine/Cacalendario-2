-- ============================================================================
-- Baja de un paciente (Edge Function delete-user): el orden de borrado de
-- supabase/functions/delete-user/index.ts (PATIENT_TABLES y después el
-- usuario de auth) funciona con las claves foráneas de producción.
-- Las fotos de Storage las borra la función con la API de Storage antes de
-- esto; aquí se comprueba la parte de base de datos.
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

-- Paciente pc (con vínculo, bitácora, deposición, comida, push y aviso) y su médico d3
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'pc@test'),
  ('00000000-0000-0000-0000-0000000000d3', 'd3@test');
INSERT INTO public.doctors (id, name) VALUES ('00000000-0000-0000-0000-0000000000d3', 'D3');
INSERT INTO public.user_profiles (id, email) VALUES ('00000000-0000-0000-0000-0000000000c1', 'pc@test');
INSERT INTO public.patient_links (id, patient_id, doctor_id, status) VALUES
  ('22222222-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d3', 'accepted');
INSERT INTO public.patient_clinical_notes (link_id, note) VALUES ('22222222-0000-0000-0000-0000000000c1', 'nota');
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, bristol)
  VALUES ('00000000-0000-0000-0000-0000000000c1', 'p1', '2026-10-05', '08:00', 1, 'poop', 4);
INSERT INTO public.entries (user_id, entry_id, date, time, timestamp, entry_type, food_meal_type, food_photo_path)
  VALUES ('00000000-0000-0000-0000-0000000000c1', 'f1', '2026-10-05', '09:00', 2, 'food', 'breakfast',
          '00000000-0000-0000-0000-0000000000c1/f1.jpg');
INSERT INTO public.push_subscriptions (user_id, subscription) VALUES ('00000000-0000-0000-0000-0000000000c1', '{"type":"expo"}');
INSERT INTO public.food_reminder_log (patient_id, local_date, slot) VALUES ('00000000-0000-0000-0000-0000000000c1', '2026-10-05', 'lunch');

-- Sin limpiar antes, el usuario de auth no se puede borrar (patient_links sin cascada)
DO $$
BEGIN
  BEGIN
    DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c1';
    RAISE EXCEPTION 'FAIL: se pudo borrar el usuario con vínculos pendientes';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'ok - patient_links impide borrar el usuario directamente (por eso delete-user lo borra antes)';
  END;
END $$;

-- Mismo orden que delete-user (como service_role)
SET ROLE service_role;
DELETE FROM public.entries WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
DELETE FROM public.push_subscriptions WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
DELETE FROM public.food_reminder_log WHERE patient_id = '00000000-0000-0000-0000-0000000000c1';
DELETE FROM public.patient_links WHERE patient_id = '00000000-0000-0000-0000-0000000000c1';
DELETE FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c1';
RESET ROLE;
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c1';

SELECT pg_temp.assert_eq((SELECT count(*) FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c1'), 0,
  'la baja del paciente borra su usuario de auth');
SELECT pg_temp.assert_eq(
  (SELECT count(*) FROM public.entries WHERE user_id = '00000000-0000-0000-0000-0000000000c1')
  + (SELECT count(*) FROM public.patient_links WHERE patient_id = '00000000-0000-0000-0000-0000000000c1')
  + (SELECT count(*) FROM public.patient_clinical_notes WHERE link_id = '22222222-0000-0000-0000-0000000000c1')
  + (SELECT count(*) FROM public.push_subscriptions WHERE user_id = '00000000-0000-0000-0000-0000000000c1')
  + (SELECT count(*) FROM public.food_reminder_log WHERE patient_id = '00000000-0000-0000-0000-0000000000c1')
  + (SELECT count(*) FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c1'), 0,
  'no queda ningún dato del paciente (registros, comidas, vínculo, bitácora, push, avisos, perfil)');
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.doctors WHERE id = '00000000-0000-0000-0000-0000000000d3'), 1,
  'el profesional no se ve afectado');

-- Un profesional no puede borrarse por esta vía (doctors sin cascada): la función lo rechaza antes
DO $$
BEGIN
  BEGIN
    DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000d3';
    RAISE EXCEPTION 'FAIL: se pudo borrar un profesional';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'ok - un profesional no se puede borrar como paciente (tiene su propia baja en MW)';
  END;
END $$;

\echo 'delete_user.test.sql: todas las aserciones OK'
