-- ============================================================================
-- Fluxia — Un pago fallido no puede quitarle la prueba gratuita a un médico
-- ----------------------------------------------------------------------------
-- stripe-webhook traduce cada suscripción a 'pro' (active/trialing/past_due) o
-- a 'free' (cualquier otro estado). Desde que 'free' significa "sin plan
-- activo, panel bloqueado" (isAccessBlocked en src/lib/plan.ts), eso tenía un
-- efecto indeseado: si un médico en prueba ('test') o en 'beta' intenta pagar
-- y la suscripción nace `incomplete` (tarjeta rechazada, 3D Secure sin
-- completar) o acaba `incomplete_expired`, el webhook lo bajaba a 'free' y
-- perdía los días de prueba que le quedaban.
--
-- Regla nueva: un estado sin derecho a Pro solo quita el plan a quien lo tenía
-- ('pro' → 'free'). Si el médico está en 'test' o 'beta' conserva su plan; los
-- datos de la suscripción (stripe_*) se actualizan igualmente.
-- ============================================================================

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
  v_current   text;
  v_plan      text;
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

  SELECT plan INTO v_current FROM public.doctors WHERE id = v_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', v_doctor_id;
  END IF;

  -- Solo se baja a 'free' a quien estaba en 'pro'.
  v_plan := CASE
    WHEN p_plan = 'free' AND v_current IN ('test', 'beta') THEN v_current
    ELSE p_plan
  END;

  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET plan                        = v_plan,
         plan_updated_at             = now(),
         stripe_customer_id          = p_customer_id,
         stripe_subscription_id      = COALESCE(p_subscription_id, stripe_subscription_id),
         stripe_status               = p_status,
         stripe_current_period_end   = p_current_period_end,
         stripe_cancel_at_period_end = COALESCE(p_cancel_at_period_end, false),
         stripe_price_id             = COALESCE(p_price_id, stripe_price_id),
         stripe_interval             = COALESCE(p_interval, stripe_interval)
   WHERE id = v_doctor_id;

  RETURN v_doctor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean, text, text) TO service_role;
