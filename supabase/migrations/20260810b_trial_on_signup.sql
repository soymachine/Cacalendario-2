-- ============================================================================
-- Fluxia — Los registros nuevos entran en el trial de 31 días ('test')
-- ----------------------------------------------------------------------------
-- Hasta ahora un médico que se registraba entraba en 'beta': ilimitado en el
-- tiempo y sin caducidad, así que nunca llegaba a la pantalla de pago pese a
-- que la landing anuncia "30 días gratis". Con Stripe ya integrado, esto
-- significaba que ningún usuario nuevo entraría jamás en el flujo de cobro.
--
-- A partir de aquí, todo registro nuevo entra en 'test' (31 días, sin límite
-- de pacientes y SIN pedir tarjeta). Cuando caduca, MedicsPanel muestra el
-- modal que abre Stripe Checkout.
--
-- Los médicos que ya están en 'beta' NO se tocan: mantienen su acceso
-- indefinido como cortesía de lanzamiento.
--
-- La lógica se implementa con un trigger BEFORE INSERT en vez de confiar en
-- cada punto de registro, porque hay tres vías distintas (RPC
-- doctor_self_register, insert directo del alta con Google, y el flujo de
-- centro pre-creado) y basta con que una se olvide de poner el plan o la
-- fecha de inicio para regalar acceso ilimitado o un trial ya caducado.
-- ============================================================================

-- ── 1. El plan por defecto pasa a ser el trial ──
ALTER TABLE public.doctors
  ALTER COLUMN plan SET DEFAULT 'test';

-- ── 2. Trigger: normaliza el plan y la fecha de inicio en cada alta ──
-- Cualquier inserción de cliente ('free', 'beta' o 'test') se normaliza a
-- 'test' con la fecha de inicio puesta. service_role (backoffice, seeds,
-- migraciones de datos) puede seguir insertando el plan que quiera.
CREATE OR REPLACE FUNCTION public.set_trial_on_doctor_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS NULL OR NEW.plan IN ('free', 'beta', 'test') THEN
    NEW.plan := 'test';
  END IF;

  IF NEW.plan = 'test' AND NEW.test_plan_started_at IS NULL THEN
    NEW.test_plan_started_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_set_trial_on_insert ON public.doctors;
CREATE TRIGGER doctors_set_trial_on_insert
  BEFORE INSERT ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.set_trial_on_doctor_insert();

-- ── 3. Ajustar la política RLS de auto-registro ──
-- La política exigía `plan = 'free'`, lo que hacía fallar el alta con Google
-- (que insertaba 'beta'). Ahora acepta los planes gratuitos y deja que el
-- trigger de arriba fije el valor real; 'pro' sigue estando prohibido, así
-- que nadie puede auto-concederse el plan de pago.
DROP POLICY IF EXISTS "doctors_self_insert" ON public.doctors;
CREATE POLICY "doctors_self_insert" ON public.doctors
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND plan IN ('free', 'beta', 'test')
  );

-- ── 4. doctor_self_register registra en 'test' ──
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

  INSERT INTO doctors (id, center_id, name, specialty, plan, test_plan_started_at)
  VALUES (auth.uid(), v_center_id, p_name, p_specialty, 'test', now());
END;
$$;

-- ── 5. Red de seguridad para altas 'test' anteriores sin fecha de inicio ──
-- Sin `test_plan_started_at`, testPlanDaysLeft() devuelve null y el trial no
-- caduca nunca. Se les cuenta desde ahora.
UPDATE public.doctors
   SET test_plan_started_at = now()
 WHERE plan = 'test'
   AND test_plan_started_at IS NULL;
