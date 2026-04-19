-- ============================================================================
-- Fluxia — Doctor self-registration + Free/Pro plan tier
-- ----------------------------------------------------------------------------
-- Adds a `plan` column to `doctors` and opens up RLS so that authenticated
-- users can self-register as a doctor (create their own center and doctor
-- record with plan = 'free'). A later Stripe integration will flip `plan` to
-- 'pro' via a webhook.
--
-- Free tier enforcement (1 patient max) is done client-side in MedicsPanel AND
-- is validated here by a trigger on `patient_links` that rejects new rows when
-- the owning doctor has plan='free' and already has a patient link.
-- ============================================================================

-- ── 1. Add plan column to doctors ──
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

ALTER TABLE public.doctors
  DROP CONSTRAINT IF EXISTS doctors_plan_check;

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_plan_check CHECK (plan IN ('free', 'pro'));

-- Optional metadata for future Stripe integration.
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_updated_at timestamptz;

-- ── 2. Enable RLS (if not already) ──
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- ── 3. Allow authenticated users to self-register ──
-- A user can INSERT a new center (they become its owner via the
-- doctor record they immediately create linking to it).
DROP POLICY IF EXISTS "centers_self_insert" ON public.centers;
CREATE POLICY "centers_self_insert" ON public.centers
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- A user can INSERT a doctor record only if the doctor.id matches their own
-- auth uid. This binds self-registration to the logged-in user, and enforces
-- that `plan` defaults to 'free' (users cannot set plan='pro' on their own).
DROP POLICY IF EXISTS "doctors_self_insert" ON public.doctors;
CREATE POLICY "doctors_self_insert" ON public.doctors
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND plan = 'free'
  );

-- A doctor can read + update their own record (plan excluded for update; see
-- separate trigger below that prevents self-upgrade to 'pro' outside Stripe).
DROP POLICY IF EXISTS "doctors_self_select" ON public.doctors;
CREATE POLICY "doctors_self_select" ON public.doctors
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "doctors_self_update" ON public.doctors;
CREATE POLICY "doctors_self_update" ON public.doctors
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── 4. Prevent clients from upgrading themselves to 'pro' ──
-- Only service-role (Stripe webhook, Supabase Edge Function) can flip plan.
CREATE OR REPLACE FUNCTION public.guard_doctor_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'El plan solo puede cambiarse desde el sistema de pagos.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_guard_plan_change ON public.doctors;
CREATE TRIGGER doctors_guard_plan_change
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_plan_change();

-- ── 5. Enforce Free plan patient limit (1 patient) ──
-- Rejects new patient_links rows for doctors on the free plan when they
-- already have a link (accepted or pending).
CREATE OR REPLACE FUNCTION public.enforce_free_plan_patient_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_plan text;
  existing_count int;
BEGIN
  SELECT plan INTO doc_plan FROM public.doctors WHERE id = NEW.doctor_id;
  IF doc_plan = 'free' THEN
    SELECT count(*) INTO existing_count
      FROM public.patient_links
     WHERE doctor_id = NEW.doctor_id;
    IF existing_count >= 1 THEN
      RAISE EXCEPTION 'Plan Free: solo puedes gestionar 1 paciente. Pasa al plan Pro para añadir más.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS patient_links_free_plan_limit ON public.patient_links;
CREATE TRIGGER patient_links_free_plan_limit
  BEFORE INSERT ON public.patient_links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_plan_patient_limit();

-- ── 6. Index on plan for billing/reporting queries ──
CREATE INDEX IF NOT EXISTS doctors_plan_idx ON public.doctors(plan);
