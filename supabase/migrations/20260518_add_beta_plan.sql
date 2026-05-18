-- ============================================================================
-- Fluxia — Add 'beta' plan tier
-- ----------------------------------------------------------------------------
-- Extends the plan system with a 'beta' plan (limit: 100 patients).
-- New doctor registrations default to 'beta' during the launch testing phase.
-- ============================================================================

-- ── 1. Expand CHECK constraint to include 'beta' ──
ALTER TABLE public.doctors
  DROP CONSTRAINT IF EXISTS doctors_plan_check;

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_plan_check CHECK (plan IN ('free', 'beta', 'pro'));

-- ── 2. Update default plan to 'beta' ──
ALTER TABLE public.doctors
  ALTER COLUMN plan SET DEFAULT 'beta';

-- ── 3. Update doctor_self_register RPC to register with 'beta' ──
CREATE OR REPLACE FUNCTION public.doctor_self_register(
  p_name        text,
  p_center_name text,
  p_specialty   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM doctors WHERE id = auth.uid()) THEN
    RETURN;
  END IF;

  INSERT INTO centers (name)
  VALUES (p_center_name)
  RETURNING id INTO v_center_id;

  INSERT INTO doctors (id, center_id, name, specialty, plan)
  VALUES (auth.uid(), v_center_id, p_name, p_specialty, 'beta');
END;
$$;

-- ── 4. Update admin_set_doctor_plan RPC to allow 'beta' ──
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

  IF p_plan NOT IN ('free', 'beta', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'', ''beta'' o ''pro''.';
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

-- ── 5. Update patient limit trigger to handle 'beta' (100 patients) ──
CREATE OR REPLACE FUNCTION public.enforce_free_plan_patient_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.doctors WHERE id = NEW.doctor_id;
  SELECT count(*) INTO v_count FROM public.patient_links WHERE doctor_id = NEW.doctor_id;

  IF v_plan = 'free' AND v_count >= 1 THEN
    RAISE EXCEPTION 'Plan Free: solo puedes gestionar 1 paciente. Pasa al plan Pro para añadir más.';
  END IF;

  IF v_plan = 'beta' AND v_count >= 100 THEN
    RAISE EXCEPTION 'Plan Beta: límite de 100 pacientes alcanzado.';
  END IF;

  RETURN NEW;
END;
$$;
