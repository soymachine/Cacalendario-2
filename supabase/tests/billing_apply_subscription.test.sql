-- ============================================================================
-- Tests de billing_apply_subscription (migración 20261004_billing_keep_trial):
-- un estado de Stripe sin derecho a Pro solo baja a 'free' a quien era 'pro';
-- 'test' y 'beta' conservan su plan.
-- El mock de doctors no trae las columnas de facturación: se añaden aquí.
-- ============================================================================
\set ON_ERROR_STOP 1

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'test',
  ADD COLUMN IF NOT EXISTS plan_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_status text,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS stripe_interval text;

CREATE FUNCTION pg_temp.assert_plan(p_id uuid, expected text, msg text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  SELECT plan INTO v FROM public.doctors WHERE id = p_id;
  IF v IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL: % (esperado %, obtenido %)', msg, expected, v;
  END IF;
  RAISE NOTICE 'ok - %', msg;
END $$;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000b001', 'trial@test'),
  ('00000000-0000-0000-0000-00000000b002', 'beta@test'),
  ('00000000-0000-0000-0000-00000000b003', 'pro@test');
INSERT INTO public.doctors (id, name, plan) VALUES
  ('00000000-0000-0000-0000-00000000b001', 'Trial', 'test'),
  ('00000000-0000-0000-0000-00000000b002', 'Beta',  'beta'),
  ('00000000-0000-0000-0000-00000000b003', 'Pro',   'pro');

-- Médico en prueba: la tarjeta falla (incomplete) → sigue en prueba.
SELECT public.billing_apply_subscription('cus_trial', '00000000-0000-0000-0000-00000000b001', 'free', 'sub_t', 'incomplete');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b001', 'test', 'pago fallido no quita la prueba');
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE id = '00000000-0000-0000-0000-00000000b001'
                  AND stripe_customer_id = 'cus_trial' AND stripe_status = 'incomplete') THEN
    RAISE EXCEPTION 'FAIL: no guardó el customer ni el estado de la suscripción';
  END IF;
  RAISE NOTICE 'ok - guarda customer y estado aunque conserve la prueba';
END $$;

-- incomplete_expired, ya resuelto por stripe_customer_id → sigue en prueba.
SELECT public.billing_apply_subscription('cus_trial', NULL, 'free', 'sub_t', 'incomplete_expired');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b001', 'test', 'incomplete_expired no quita la prueba');

-- Paga de verdad → pro; cancela → free.
SELECT public.billing_apply_subscription('cus_trial', NULL, 'pro', 'sub_t2', 'active');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b001', 'pro', 'pago correcto da Pro');
SELECT public.billing_apply_subscription('cus_trial', NULL, 'free', 'sub_t2', 'canceled');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b001', 'free', 'cancelar un Pro lo baja a free');

-- Beta con pago fallido → sigue en beta.
SELECT public.billing_apply_subscription('cus_beta', '00000000-0000-0000-0000-00000000b002', 'free', 'sub_b', 'incomplete');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b002', 'beta', 'pago fallido no quita la beta');

-- Pro que deja de pagar (unpaid → free en el webhook) → free.
SELECT public.billing_apply_subscription('cus_pro', '00000000-0000-0000-0000-00000000b003', 'free', 'sub_p', 'unpaid');
SELECT pg_temp.assert_plan('00000000-0000-0000-0000-00000000b003', 'free', 'Pro impagado baja a free');

-- Plan desconocido → error.
DO $$
BEGIN
  BEGIN
    PERFORM public.billing_apply_subscription('cus_x', '00000000-0000-0000-0000-00000000b003', 'gold');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ok - rechaza un plan desconocido (%)', SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'FAIL: aceptó un plan desconocido';
END $$;
