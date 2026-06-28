-- ============================================================================
-- Fluxia — Harden + debug admin_set_doctor_plan permission check
-- ----------------------------------------------------------------------------
-- The email allow-list check was failing in production with "No tienes
-- permisos para cambiar el plan." even for an allow-listed admin. This makes
-- the comparison case/whitespace-insensitive (in case the stored auth.users
-- email differs in case from the hardcoded list) and, if it still fails,
-- includes the detected email + uid in the exception message so the cause
-- is visible immediately instead of guessing.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_doctor_plan(
  p_doctor_id uuid,
  p_plan      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = auth.uid();

  IF v_email IS NULL OR v_email NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para cambiar el plan. (uid=%, email=%)', auth.uid(), v_email;
  END IF;

  IF p_plan NOT IN ('free', 'beta', 'test', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'', ''beta'', ''test'' o ''pro''.';
  END IF;

  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET plan                 = p_plan,
         plan_updated_at      = now(),
         test_plan_started_at = CASE WHEN p_plan = 'test' THEN now() ELSE test_plan_started_at END
   WHERE id = p_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', p_doctor_id;
  END IF;
END;
$$;
