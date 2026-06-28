-- ============================================================================
-- Fluxia — Add 'test' plan tier (1-month free trial)
-- ----------------------------------------------------------------------------
-- Adds a 'test' plan: functionally identical to 'pro' (unlimited patients)
-- but time-boxed to 31 days from the moment it's activated. Stores the
-- activation timestamp in `test_plan_started_at` so the client can compute
-- remaining days and gate the dashboard once it expires.
--
-- Also generalizes admin_set_doctor_plan so admins can move a doctor between
-- ANY two plans (free/beta/test/pro), instead of only the fixed cycle that
-- existed before (beta->pro, free->beta, pro->free).
-- ============================================================================

-- ── 1. Expand CHECK constraint to include 'test' ──
ALTER TABLE public.doctors
  DROP CONSTRAINT IF EXISTS doctors_plan_check;

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_plan_check CHECK (plan IN ('free', 'beta', 'test', 'pro'));

-- ── 2. Track when the doctor entered the 'test' plan ──
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS test_plan_started_at timestamptz;

-- ── 3. Generalize admin_set_doctor_plan to allow any plan -> any plan ──
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

  IF p_plan NOT IN ('free', 'beta', 'test', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'', ''beta'', ''test'' o ''pro''.';
  END IF;

  -- Set transaction-local flag so the guard trigger allows this update
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

-- ── 4. Patient limit trigger: 'test' behaves like 'pro' (unlimited) ──
-- No change needed: enforce_free_plan_patient_limit() only restricts 'free'
-- and 'beta'; 'test' and 'pro' fall through unrestricted.
