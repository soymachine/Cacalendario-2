-- ============================================================================
-- Fluxia — Blindaje de las columnas de facturación en `doctors`
-- ----------------------------------------------------------------------------
-- La migración 20260810 protegió `doctors.plan` con `guard_doctor_plan_change`,
-- pero dejó escribibles las columnas `stripe_*`. Con la política de RLS
-- `doctors_self_update` (UPDATE de la propia fila, todas las columnas), un
-- médico podía:
--
--   * falsear `stripe_status`, `stripe_current_period_end` y
--     `stripe_cancel_at_period_end`, que MW pinta como estado real de la
--     suscripción;
--   * borrarse `stripe_customer_id` y forzar un customer nuevo en el siguiente
--     Checkout, dejando la suscripción anterior huérfana y cobrando dos veces;
--   * apropiarse de un `stripe_customer_id` que no esté ya enlazado a otro
--     médico (el índice único `doctors_stripe_customer_id_key` solo cubre los
--     que sí lo están) y abrir con él el Customer Portal ajeno.
--
-- A partir de aquí las columnas de facturación solo las escribe el sistema de
-- pagos: `service_role` (las Edge Functions) o los RPC `billing_*`, que activan
-- el mismo flag transaccional que ya usaba el guard del plan.
--
-- Además se estrecha la lectura de `doctors`: la política
-- "Authenticated users can read all doctors" exponía la fila entera —estado de
-- facturación incluido— a cualquier usuario autenticado, pacientes incluidos.
-- ============================================================================

-- ── 1. Los RPC de billing marcan explícitamente sus escrituras ──
-- `billing_attach_customer` era LANGUAGE sql y no activaba ningún flag: se
-- apoyaba en que quien la llama es service_role. Se pasa a plpgsql para que
-- funcione igual si algún día se ejecuta desde otro rol (SQL editor, cron).
CREATE OR REPLACE FUNCTION public.billing_attach_customer(
  p_doctor_id   uuid,
  p_customer_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET stripe_customer_id = p_customer_id
   WHERE id = p_doctor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_attach_customer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_attach_customer(uuid, text) TO service_role;

-- ── 2. El guard cubre ahora plan + columnas stripe_* ──
CREATE OR REPLACE FUNCTION public.guard_doctor_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_billing boolean :=
    auth.role() = 'service_role'
    OR current_setting('app.admin_plan_bypass', true) = 'true';
BEGIN
  IF v_from_billing THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'El plan solo puede cambiarse desde el sistema de pagos.';
  END IF;

  IF NEW.stripe_customer_id          IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id      IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.stripe_status               IS DISTINCT FROM OLD.stripe_status
     OR NEW.stripe_current_period_end   IS DISTINCT FROM OLD.stripe_current_period_end
     OR NEW.stripe_cancel_at_period_end IS DISTINCT FROM OLD.stripe_cancel_at_period_end
  THEN
    RAISE EXCEPTION 'Los datos de facturación solo puede escribirlos el sistema de pagos.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_doctor_plan_change() IS
  'Impide que un médico se cambie el plan o falsee su estado de facturación: solo service_role o los RPC billing_*/admin_set_doctor_plan.';

-- ── 3. Lectura de `doctors` acotada a quien la necesita ──
-- Rutas legítimas hoy:
--   * el propio médico (MW, MA);
--   * un paciente que lee el nombre del médico con el que está enlazado
--     (PW/PA · AccountScreen);
--   * el panel de administración (/admin), con la misma lista de emails que
--     ya usa `admin_set_doctor_plan`.
CREATE OR REPLACE FUNCTION public.is_fluxia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
     WHERE id = auth.uid()
       AND lower(trim(email)) IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com')
  );
$$;

REVOKE ALL ON FUNCTION public.is_fluxia_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_fluxia_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated users can read all doctors" ON public.doctors;

CREATE POLICY doctors_read_scoped ON public.doctors
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_fluxia_admin()
    OR EXISTS (
      SELECT 1 FROM public.patient_links pl
       WHERE pl.doctor_id = doctors.id
         AND pl.patient_id = auth.uid()
    )
  );

-- Las políticas duplicadas que quedaban de migraciones anteriores no aportan
-- nada sobre `doctors_self_select` / `doctors_self_update` y confunden al
-- revisar quién puede qué.
DROP POLICY IF EXISTS "Doctors can read own row" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update own row" ON public.doctors;

-- ── 4. Mismo blindaje en el INSERT ──
-- `doctors_self_insert` deja a un médico crear su propia fila, y la política no
-- mira las columnas de facturación: sin esto, bastaría con registrarse
-- enviando un `stripe_customer_id` ajeno.
CREATE OR REPLACE FUNCTION public.guard_doctor_stripe_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR current_setting('app.admin_plan_bypass', true) = 'true'
  THEN
    RETURN NEW;
  END IF;

  IF NEW.stripe_customer_id IS NOT NULL
     OR NEW.stripe_subscription_id IS NOT NULL
     OR NEW.stripe_status IS NOT NULL
     OR NEW.stripe_current_period_end IS NOT NULL
     OR COALESCE(NEW.stripe_cancel_at_period_end, false) IS TRUE
  THEN
    RAISE EXCEPTION 'Los datos de facturación solo puede escribirlos el sistema de pagos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_guard_stripe_insert ON public.doctors;
CREATE TRIGGER doctors_guard_stripe_insert
  BEFORE INSERT ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_stripe_insert();
