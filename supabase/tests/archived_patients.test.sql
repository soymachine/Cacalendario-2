-- ============================================================================
-- Pacientes archivados (doctor_unlinked): no reciben el recordatorio de
-- inactividad (get_patients_needing_push); al reactivarlos, vuelven a recibirlo.
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

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'pa@test'),
  ('00000000-0000-0000-0000-0000000000a2', 'pb@test'),
  ('00000000-0000-0000-0000-0000000000a9', 'da@test');
INSERT INTO public.doctors (id, name) VALUES ('00000000-0000-0000-0000-0000000000a9', 'DA');
INSERT INTO public.patient_links (id, patient_id, doctor_id, status, doctor_unlinked) VALUES
  ('33333333-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a9', 'accepted', false),
  ('33333333-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a9', 'accepted', true);
-- Sin registros y sin avisos previos: los dos cumplirían el criterio de inactividad
INSERT INTO public.push_subscriptions (user_id, subscription) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '{"type":"expo"}'),
  ('00000000-0000-0000-0000-0000000000a2', '{"type":"expo"}');

SELECT pg_temp.assert_eq((SELECT count(*) FROM public.get_patients_needing_push() WHERE patient_id = '00000000-0000-0000-0000-0000000000a1'), 1,
  'el paciente activo recibe el recordatorio de inactividad');
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.get_patients_needing_push() WHERE patient_id = '00000000-0000-0000-0000-0000000000a2'), 0,
  'el paciente archivado no recibe el recordatorio de inactividad');

UPDATE public.patient_links SET doctor_unlinked = false, unlinked_at = NULL WHERE id = '33333333-0000-0000-0000-0000000000a2';
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.get_patients_needing_push() WHERE patient_id = '00000000-0000-0000-0000-0000000000a2'), 1,
  'al reactivarlo vuelve a recibir el recordatorio');

DELETE FROM public.push_subscriptions WHERE user_id IN ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2');
DELETE FROM public.patient_links WHERE doctor_id = '00000000-0000-0000-0000-0000000000a9';
DELETE FROM public.doctors WHERE id = '00000000-0000-0000-0000-0000000000a9';
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a9');
