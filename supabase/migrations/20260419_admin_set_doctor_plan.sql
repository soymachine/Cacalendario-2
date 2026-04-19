-- ============================================================================
-- Fluxia — Admin RPC to change a doctor's plan
-- ----------------------------------------------------------------------------
-- Creates a SECURITY DEFINER function that runs as the service role so it can
-- bypass the `guard_doctor_plan_change` trigger that blocks plan changes from
-- regular authenticated users. Only callable by authenticated admins; the
-- caller's email is checked against a hardcoded allow-list.
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
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para cambiar el plan.';
  END IF;

  IF p_plan NOT IN ('free', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'' o ''pro''.';
  END IF;

  UPDATE public.doctors
     SET plan            = p_plan,
         plan_updated_at = now()
   WHERE id = p_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', p_doctor_id;
  END IF;
END;
$$;
