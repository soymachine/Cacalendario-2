-- ============================================================================
-- apple_auth_tokens (20261115): solo service role; las apps no pueden leer ni
-- escribir los refresh tokens de Apple, y se borran con el usuario.
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

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000a1', 'apple@test');
INSERT INTO public.apple_auth_tokens (user_id, client_id, refresh_token)
  VALUES ('00000000-0000-0000-0000-0000000000a1', 'com.fluxiahealth.app', 'rt-secreto');

-- El propio usuario (authenticated) no puede leer ni escribir la tabla
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
SET ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.apple_auth_tokens;
    RAISE EXCEPTION 'FAIL: authenticated ha podido leer apple_auth_tokens';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - authenticated no puede leer apple_auth_tokens';
  END;
  BEGIN
    INSERT INTO public.apple_auth_tokens (user_id, client_id, refresh_token)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'com.fluxiahealth.medics', 'x');
    RAISE EXCEPTION 'FAIL: authenticated ha podido escribir apple_auth_tokens';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - authenticated no puede escribir apple_auth_tokens';
  END;
END $$;
RESET ROLE;

-- anon tampoco
SET ROLE anon;
DO $$
BEGIN
  PERFORM 1 FROM public.apple_auth_tokens;
  RAISE EXCEPTION 'FAIL: anon ha podido leer apple_auth_tokens';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'ok - anon no puede leer apple_auth_tokens';
END $$;
RESET ROLE;

-- Al borrar el usuario de auth, sus tokens desaparecen
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000a1';
SELECT pg_temp.assert_eq((SELECT count(*) FROM public.apple_auth_tokens), 0, 'los tokens se borran con el usuario');
