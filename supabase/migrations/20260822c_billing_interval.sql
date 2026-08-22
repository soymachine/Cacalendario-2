-- ============================================================================
-- Fluxia — Guardar el precio y el intervalo de la suscripción
-- ----------------------------------------------------------------------------
-- MW solo sabía si el médico es Pro, no si paga mensual o anual: el intervalo
-- vivía en la metadata de la sesión de Checkout, que además se queda obsoleta
-- si el médico cambia de plan desde el Customer Portal. Se guardan ahora el
-- price y el intervalo que Stripe manda en cada evento de suscripción, leídos
-- del propio item (`sub.items.data[0].price`), que es la única fuente que
-- refleja el cambio de mensual a anual y viceversa.
-- ============================================================================

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS stripe_interval  text;

COMMENT ON COLUMN public.doctors.stripe_interval IS
  'Periodicidad de la suscripción activa: month | year. La escribe stripe-webhook desde price.recurring.interval.';

-- ── El guard cubre también las dos columnas nuevas ──
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
     OR NEW.stripe_price_id             IS DISTINCT FROM OLD.stripe_price_id
     OR NEW.stripe_interval             IS DISTINCT FROM OLD.stripe_interval
  THEN
    RAISE EXCEPTION 'Los datos de facturación solo puede escribirlos el sistema de pagos.';
  END IF;

  RETURN NEW;
END;
$$;

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
     OR NEW.stripe_price_id IS NOT NULL
     OR NEW.stripe_interval IS NOT NULL
     OR COALESCE(NEW.stripe_cancel_at_period_end, false) IS TRUE
  THEN
    RAISE EXCEPTION 'Los datos de facturación solo puede escribirlos el sistema de pagos.';
  END IF;

  RETURN NEW;
END;
$$;

-- ── El RPC del webhook acepta price e intervalo ──
-- Se borra la firma anterior en vez de dejar las dos: PostgREST no sabría cuál
-- de las dos sobrecargas llamar.
DROP FUNCTION IF EXISTS public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean);

CREATE OR REPLACE FUNCTION public.billing_apply_subscription(
  p_customer_id           text,
  p_doctor_id             uuid,
  p_plan                  text,
  p_subscription_id       text    DEFAULT NULL,
  p_status                text    DEFAULT NULL,
  p_current_period_end    timestamptz DEFAULT NULL,
  p_cancel_at_period_end  boolean DEFAULT false,
  p_price_id              text    DEFAULT NULL,
  p_interval              text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  IF p_plan NOT IN ('free', 'beta', 'test', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: %', p_plan;
  END IF;

  IF p_interval IS NOT NULL AND p_interval NOT IN ('day', 'week', 'month', 'year') THEN
    RAISE EXCEPTION 'Intervalo no válido: %', p_interval;
  END IF;

  SELECT id INTO v_doctor_id
    FROM public.doctors
   WHERE stripe_customer_id = p_customer_id;

  IF v_doctor_id IS NULL THEN
    v_doctor_id := p_doctor_id;
  END IF;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No se puede resolver el médico (customer=%)', p_customer_id;
  END IF;

  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET plan                        = p_plan,
         plan_updated_at             = now(),
         stripe_customer_id          = p_customer_id,
         stripe_subscription_id      = COALESCE(p_subscription_id, stripe_subscription_id),
         stripe_status               = p_status,
         stripe_current_period_end   = p_current_period_end,
         stripe_cancel_at_period_end = COALESCE(p_cancel_at_period_end, false),
         stripe_price_id             = COALESCE(p_price_id, stripe_price_id),
         stripe_interval             = COALESCE(p_interval, stripe_interval)
   WHERE id = v_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', v_doctor_id;
  END IF;

  RETURN v_doctor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean, text, text) TO service_role;
