-- ============================================================================
-- Fluxia — Fix: allow admin_set_doctor_plan to bypass guard_doctor_plan_change
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER changes the Postgres execution role but NOT auth.role(),
-- which reads the JWT claim. So the guard trigger still sees 'authenticated'
-- and blocks the update. Fix: the admin function sets a transaction-local
-- session variable; the trigger checks for it before raising.
-- ============================================================================

-- ── 1. Update the guard trigger to honour the bypass flag ──
CREATE OR REPLACE FUNCTION public.guard_doctor_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND auth.role() <> 'service_role'
     AND current_setting('app.admin_plan_bypass', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION 'El plan solo puede cambiarse desde el sistema de pagos.';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2. Update admin_set_doctor_plan to set the bypass flag ──
CREATE OR REPLACE FUNCTION public.admin_set_doctor_plan(
  p_doctor_id uuid,
  p_plan      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para cambiar el plan.';
  END IF;

  IF p_plan NOT IN ('free', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'' o ''pro''.';
  END IF;

  -- Set transaction-local flag so the guard trigger allows this update
  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET plan            = p_plan,
         plan_updated_at = now()
   WHERE id = p_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', p_doctor_id;
  END IF;
END;
$$;
