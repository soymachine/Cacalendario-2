-- ============================================================================
-- Notificaciones push (20261023_push_tokens_and_log.sql):
--   · claim_push_subscription: un token = una cuenta (al cambiar de cuenta en
--     un móvil, la anterior deja de recibir avisos en ese móvil).
--   · push_log: solo service role.
--   · admin_get_push_overview: solo administradores.
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

CREATE FUNCTION pg_temp.login(uid text, email text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.email', coalesce(email, ''), true);
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'pe1@test'),
  ('00000000-0000-0000-0000-0000000000e2', 'pe2@test'),
  ('00000000-0000-0000-0000-0000000000e3', 'pe3@test'),
  ('00000000-0000-0000-0000-0000000000ef', 'soymachine@gmail.com');
-- e1 y e2 se registraron en el mismo móvil (token T1); e3 en otro (T3)
INSERT INTO public.push_subscriptions (user_id, subscription) VALUES
  ('00000000-0000-0000-0000-0000000000e1', '{"type":"expo","token":"ExponentPushToken[T1]"}'),
  ('00000000-0000-0000-0000-0000000000e2', '{"type":"expo","token":"ExponentPushToken[T1]"}'),
  ('00000000-0000-0000-0000-0000000000e3', '{"type":"expo","token":"ExponentPushToken[T3]"}');

-- ── 1. Reclamar el token ──
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000e2');
SET LOCAL ROLE authenticated;
SELECT public.claim_push_subscription('{"type":"expo","token":"ExponentPushToken[T1]","platform":"ios"}');
RESET ROLE;
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.push_subscriptions WHERE subscription->>'token' = 'ExponentPushToken[T1]'), 1,
  'el token del móvil queda solo en la cuenta que lo reclama');
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.push_subscriptions
  WHERE user_id = '00000000-0000-0000-0000-0000000000e2' AND subscription->>'platform' = 'ios'), 1,
  'se guarda la suscripción nueva de quien la reclama');
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.push_subscriptions WHERE user_id = '00000000-0000-0000-0000-0000000000e3'), 1,
  'no toca los dispositivos de otras cuentas');
COMMIT;

-- Sin token ni endpoint, o sin sesión: error
DO $$
BEGIN
  BEGIN
    PERFORM public.claim_push_subscription('{"type":"expo"}');
    RAISE EXCEPTION 'FAIL: se aceptó una suscripción sin token';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
    RAISE NOTICE 'ok - rechaza suscripciones sin token / sin sesión';
  END;
END $$;

-- ── 2. push_log no es accesible para usuarios normales ──
INSERT INTO public.push_log (user_id, source, channel, status, ticket_id)
  VALUES ('00000000-0000-0000-0000-0000000000e2', 'inactivity', 'expo', 'sent', 't-1');
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000e2');
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM count(*) FROM public.push_log;
    RAISE EXCEPTION 'FAIL: un usuario puede leer push_log';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - push_log no se puede leer con el rol authenticated';
  END;
END $$;
-- ── 3. admin_get_push_overview solo para administradores ──
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_get_push_overview();
    RAISE EXCEPTION 'FAIL: un usuario normal puede ver el resumen de notificaciones';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL%' THEN RAISE; END IF;
    RAISE NOTICE 'ok - admin_get_push_overview rechaza a usuarios que no son admin';
  END;
END $$;
ROLLBACK;

INSERT INTO public.push_subscriptions (user_id, subscription) VALUES
  ('00000000-0000-0000-0000-0000000000e1', '{"type":"expo","token":"ExponentPushToken[T3]"}');
BEGIN;
SELECT pg_temp.login('00000000-0000-0000-0000-0000000000ef', 'soymachine@gmail.com');
SET LOCAL ROLE authenticated;
CREATE TEMP TABLE overview ON COMMIT DROP AS SELECT public.admin_get_push_overview(7, 100)::jsonb AS j;
RESET ROLE;
SELECT pg_temp.assert_eq((SELECT (j->'summary'->>'sent_period')::bigint FROM overview), 1, 'el admin ve el resumen de envíos');
SELECT pg_temp.assert_eq((SELECT json_array_length((j->'log')::json) FROM overview), 1, 'el admin ve el registro de envíos');
SELECT pg_temp.assert_eq((SELECT json_array_length((j->'shared_devices')::json) FROM overview), 1,
  'el admin ve los dispositivos compartidos entre cuentas');
COMMIT;

DELETE FROM public.push_log WHERE user_id IN ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3');
DELETE FROM public.push_subscriptions WHERE user_id IN ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2',
  '00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000ef');
