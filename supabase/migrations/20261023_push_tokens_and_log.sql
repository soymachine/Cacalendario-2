-- ============================================================================
-- Notificaciones push: un dispositivo = una cuenta, y registro de envíos.
-- ----------------------------------------------------------------------------
-- 1. claim_push_subscription: la app (PA) guarda su token push con este RPC en
--    lugar de un upsert directo. Además de guardar la suscripción del usuario,
--    borra las de OTRAS cuentas con el mismo token Expo (o el mismo endpoint de
--    Web Push): si en un móvil se cambia de cuenta, las notificaciones de la
--    cuenta anterior dejan de llegar a ese móvil. RLS no deja borrar filas
--    ajenas, de ahí SECURITY DEFINER.
-- 2. push_log: un registro por notificación enviada (o fallida) desde las Edge
--    Functions check-inactive-patients y send-push, con el resultado de Expo
--    (ticket y, más tarde, receipt de entrega). Sin el texto del mensaje (los
--    recordatorios de comida son dato clínico). Solo service role: RLS sin
--    políticas.
-- 3. admin_get_push_overview: lo que muestra la pestaña «Notificaciones» de
--    /admin (resumen, últimos envíos, tokens compartidos entre cuentas).
-- Idempotente.
-- ============================================================================

-- ── 1. Reclamar el token del dispositivo ──
CREATE OR REPLACE FUNCTION public.claim_push_subscription(p_subscription jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token text;
  v_endpoint text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF p_subscription IS NULL OR jsonb_typeof(p_subscription) <> 'object' THEN
    RAISE EXCEPTION 'Suscripción no válida';
  END IF;
  v_token := nullif(p_subscription->>'token', '');
  v_endpoint := nullif(p_subscription->>'endpoint', '');
  IF v_token IS NULL AND v_endpoint IS NULL THEN
    RAISE EXCEPTION 'Suscripción no válida';
  END IF;

  DELETE FROM push_subscriptions
   WHERE user_id <> v_uid
     AND ((v_token IS NOT NULL AND subscription->>'token' = v_token)
       OR (v_endpoint IS NOT NULL AND subscription->>'endpoint' = v_endpoint));

  INSERT INTO push_subscriptions (user_id, subscription, updated_at)
  VALUES (v_uid, p_subscription, now())
  ON CONFLICT (user_id) DO UPDATE
    SET subscription = EXCLUDED.subscription, updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.claim_push_subscription(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_push_subscription(jsonb) TO authenticated;

-- ── 2. Registro de envíos ──
CREATE TABLE IF NOT EXISTS public.push_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'inactivity' | 'food:<comida>' | 'doctor_test' | 'direct'
  source text NOT NULL,
  -- Profesional que lo envió (solo doctor_test)
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('expo', 'webpush')),
  -- Últimos caracteres del token / endpoint, para reconocer el dispositivo
  device_hint text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'expired')),
  error text,
  -- Expo: el ticket solo dice que Expo lo aceptó; el receipt (consultado en
  -- la siguiente ejecución del cron) dice si Apple/Google lo entregaron.
  ticket_id text,
  receipt_status text CHECK (receipt_status IN ('ok', 'error')),
  receipt_error text,
  receipt_checked_at timestamptz
);

CREATE INDEX IF NOT EXISTS push_log_created_at_idx ON public.push_log (created_at DESC);
CREATE INDEX IF NOT EXISTS push_log_user_idx ON public.push_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS push_log_pending_receipts_idx ON public.push_log (created_at)
  WHERE status = 'sent' AND ticket_id IS NOT NULL AND receipt_checked_at IS NULL;

ALTER TABLE public.push_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_log FROM anon, authenticated;

-- ── 3. Vista de administración ──
CREATE OR REPLACE FUNCTION public.admin_get_push_overview(p_days integer DEFAULT 7, p_limit integer DEFAULT 500)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_days integer := least(greatest(coalesce(p_days, 7), 1), 90);
  v_limit integer := least(greatest(coalesce(p_limit, 500), 1), 2000);
  result json;
BEGIN
  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL OR v_email NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'sent_24h', count(*) FILTER (WHERE status = 'sent' AND created_at >= now() - interval '24 hours'),
        'failed_24h', count(*) FILTER (WHERE status <> 'sent' AND created_at >= now() - interval '24 hours'),
        'undelivered_24h', count(*) FILTER (WHERE receipt_status = 'error' AND created_at >= now() - interval '24 hours'),
        'sent_period', count(*) FILTER (WHERE status = 'sent'),
        'failed_period', count(*) FILTER (WHERE status <> 'sent'),
        'delivered_period', count(*) FILTER (WHERE receipt_status = 'ok'),
        'undelivered_period', count(*) FILTER (WHERE receipt_status = 'error'),
        'pending_receipt_period', count(*) FILTER (WHERE status = 'sent' AND ticket_id IS NOT NULL AND receipt_checked_at IS NULL)
      )
      FROM push_log WHERE created_at >= now() - make_interval(days => v_days)
    ),
    'subscriptions', (SELECT count(*) FROM push_subscriptions),
    'log', (SELECT coalesce(json_agg(row_to_json(l)), '[]'::json) FROM (
      SELECT pl.id, pl.created_at, pl.user_id, au.email, pl.source, sd.email AS sender_email,
             pl.channel, pl.device_hint, pl.status, pl.error,
             pl.receipt_status, pl.receipt_error, pl.receipt_checked_at
      FROM push_log pl
      LEFT JOIN auth.users au ON au.id = pl.user_id
      LEFT JOIN auth.users sd ON sd.id = pl.sender_id
      WHERE pl.created_at >= now() - make_interval(days => v_days)
      ORDER BY pl.created_at DESC
      LIMIT v_limit
    ) l),
    -- Un mismo token en varias cuentas: el dispositivo recibe los avisos de
    -- todas. claim_push_subscription lo corrige la próxima vez que se abra la app.
    'shared_devices', (SELECT coalesce(json_agg(row_to_json(s)), '[]'::json) FROM (
      SELECT right(coalesce(ps.subscription->>'token', ps.subscription->>'endpoint'), 10) AS device_hint,
             json_agg(json_build_object('user_id', ps.user_id, 'email', au.email, 'updated_at', ps.updated_at)
                      ORDER BY ps.updated_at DESC) AS accounts
      FROM push_subscriptions ps
      LEFT JOIN auth.users au ON au.id = ps.user_id
      WHERE coalesce(ps.subscription->>'token', ps.subscription->>'endpoint') IS NOT NULL
      GROUP BY coalesce(ps.subscription->>'token', ps.subscription->>'endpoint')
      HAVING count(*) > 1
    ) s)
  ) INTO result;

  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.admin_get_push_overview(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_push_overview(integer, integer) TO authenticated;
