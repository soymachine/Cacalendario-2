-- ============================================================================
-- Fluxia — Integración de Stripe (facturación de suscripciones para médicos)
-- ----------------------------------------------------------------------------
-- La tabla `doctors` ya tenía preparados `stripe_customer_id`,
-- `stripe_subscription_id` y `plan_updated_at` desde la migración
-- 20260418. Esta migración completa la parte de facturación:
--
--   1. Columnas de estado de la suscripción (estado, fin de periodo,
--      cancelación programada) para poder pintar el estado real en MW sin
--      llamar a la API de Stripe desde el cliente.
--   2. Tabla `stripe_events` para idempotencia: Stripe reintenta los webhooks
--      y puede entregar el mismo evento más de una vez.
--   3. RPC `billing_apply_subscription`, único punto por el que el webhook
--      escribe el plan. Activa el flag `app.admin_plan_bypass` que espera el
--      trigger `guard_doctor_plan_change`, de modo que el cambio de plan
--      funcione igual que con `admin_set_doctor_plan`.
--
-- Ningún rol de cliente (anon / authenticated) puede ejecutar el RPC: solo
-- service_role, es decir, la Edge Function `stripe-webhook`.
-- ============================================================================

-- ── 1. Estado de la suscripción ──
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS stripe_status          text,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.doctors.stripe_status IS
  'Último subscription.status recibido de Stripe: trialing, active, past_due, canceled, unpaid, incomplete...';

-- Un customer de Stripe pertenece como mucho a un médico.
CREATE UNIQUE INDEX IF NOT EXISTS doctors_stripe_customer_id_key
  ON public.doctors(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── 2. Idempotencia de webhooks ──
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id          text PRIMARY KEY,          -- evt_... de Stripe
  type        text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo service_role (que las ignora) puede leer/escribir.

-- ── 3. RPC que aplica el estado de la suscripción ──
-- Se busca al médico por stripe_customer_id y, si aún no está enlazado, por
-- p_doctor_id (metadata de la sesión de Checkout en el primer pago).
CREATE OR REPLACE FUNCTION public.billing_apply_subscription(
  p_customer_id           text,
  p_doctor_id             uuid,
  p_plan                  text,
  p_subscription_id       text    DEFAULT NULL,
  p_status                text    DEFAULT NULL,
  p_current_period_end    timestamptz DEFAULT NULL,
  p_cancel_at_period_end  boolean DEFAULT false
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

  SELECT id INTO v_doctor_id
    FROM public.doctors
   WHERE stripe_customer_id = p_customer_id;

  IF v_doctor_id IS NULL THEN
    v_doctor_id := p_doctor_id;
  END IF;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No se puede resolver el médico (customer=%)', p_customer_id;
  END IF;

  -- El trigger guard_doctor_plan_change solo deja cambiar `plan` a
  -- service_role o con este flag transaccional activo.
  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET plan                        = p_plan,
         plan_updated_at             = now(),
         stripe_customer_id          = p_customer_id,
         stripe_subscription_id      = COALESCE(p_subscription_id, stripe_subscription_id),
         stripe_status               = p_status,
         stripe_current_period_end   = p_current_period_end,
         stripe_cancel_at_period_end = COALESCE(p_cancel_at_period_end, false)
   WHERE id = v_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico no encontrado: %', v_doctor_id;
  END IF;

  RETURN v_doctor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamptz, boolean) TO service_role;

-- ── 4. Enlazar el customer de Stripe con el médico ──
-- Lo llama la Edge Function `stripe-checkout` (service_role) la primera vez
-- que un médico abre Checkout, para no crear un customer nuevo en cada intento.
CREATE OR REPLACE FUNCTION public.billing_attach_customer(
  p_doctor_id   uuid,
  p_customer_id text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.doctors
     SET stripe_customer_id = p_customer_id
   WHERE id = p_doctor_id;
$$;

REVOKE ALL ON FUNCTION public.billing_attach_customer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_attach_customer(uuid, text) TO service_role;
