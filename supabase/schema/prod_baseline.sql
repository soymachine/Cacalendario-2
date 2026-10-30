-- ============================================================================
-- Fluxia — Esquema base de producción (snapshot)
-- ----------------------------------------------------------------------------
-- Copia del esquema `public` (y de lo que toca en `auth` y `storage`) del
-- proyecto Supabase `cacalendario` a fecha 2026-10-30, extraída de los
-- catálogos (pg_class, pg_constraint, pg_index, pg_policies, pg_proc,
-- pg_trigger, storage.buckets). Solo estructura: no contiene datos.
--
-- Para qué sirve: levantar una base de datos idéntica a producción desde cero
-- (Supabase local en CI, tests funcionales, recuperación). Las migraciones de
-- supabase/migrations/ NO bastan para eso: no incluyen las tablas iniciales
-- (entries, doctors, patient_links…) y algunas ya no coinciden con lo que hay
-- en producción, así que reaplicarlas encima de este snapshot haría retroceder
-- el esquema. Las migraciones posteriores a esta fecha sí se aplican encima.
--
-- Es idempotente (IF NOT EXISTS / CREATE OR REPLACE / DROP … IF EXISTS):
-- ejecutarlo dos veces, o sobre una base que ya lo tiene, no cambia nada.
--
-- Qué NO incluye, a propósito:
--   · El job de pg_cron `check-inactive-patients` (cada hora): su comando lleva
--     la URL de producción y la service_role key. Un entorno de pruebas debe
--     invocar la Edge Function directamente.
--   · Secretos de Vault y de Edge Functions.
--
-- Ojo en entornos de pruebas: notify_new_doctor_trigger llama por pg_net a la
-- Edge Function notify-new-doctor de PRODUCCIÓN (URL fija) en cada alta de
-- médico. Sustitúyela o desactiva el trigger `on_doctor_insert` fuera de prod.
-- ============================================================================

-- ── Extensiones ──
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 1. Tablas (en orden de dependencias de claves foráneas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.centers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  specialty text,
  address text,
  phone text,
  logo_url text,
  subscription_status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  pending_doctor_email text,
  pending_doctor_name text,
  pending_doctor_specialty text,
  image_url text,
  CONSTRAINT centers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid NOT NULL,
  center_id uuid,
  name text NOT NULL,
  specialty text,
  created_at timestamp with time zone DEFAULT now(),
  semaforo_green integer DEFAULT 1,
  semaforo_red integer DEFAULT 3,
  palette text DEFAULT 'terracotta'::text,
  hidden_fields text[] DEFAULT '{}'::text[],
  plan text DEFAULT 'test'::text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_updated_at timestamp with time zone,
  global_tags text[] DEFAULT '{}'::text[] NOT NULL,
  test_plan_started_at timestamp with time zone,
  stripe_status text,
  stripe_current_period_end timestamp with time zone,
  stripe_cancel_at_period_end boolean DEFAULT false NOT NULL,
  stripe_price_id text,
  stripe_interval text,
  food_tag_catalog text[] DEFAULT '{}'::text[] NOT NULL,
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_plan_check CHECK ((plan = ANY (ARRAY['free'::text, 'beta'::text, 'test'::text, 'pro'::text]))),
  CONSTRAINT doctors_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE CASCADE,
  CONSTRAINT doctors_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  date text NOT NULL,
  "time" text NOT NULL,
  notes text DEFAULT ''::text,
  "timestamp" bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bristol integer,
  floats text,
  entry_id text,
  color text,
  quantity integer,
  duration text,
  symptoms text[],
  entry_type text DEFAULT 'poop'::text NOT NULL,
  urine_type text,
  urine_quantity integer,
  urine_color text,
  urine_characteristics text[] DEFAULT '{}'::text[],
  urine_urgency integer,
  during_sleep boolean,
  feces_texture text,
  food_meal_type text,
  food_description text,
  food_portion text,
  food_tags text[] DEFAULT '{}'::text[] NOT NULL,
  food_photo_path text,
  CONSTRAINT entries_pkey PRIMARY KEY (id),
  CONSTRAINT entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['poop'::text, 'urine'::text, 'food'::text]))),
  CONSTRAINT entries_food_fields_only_on_food CHECK (((entry_type = 'food'::text) OR ((food_meal_type IS NULL) AND (food_description IS NULL) AND (food_portion IS NULL) AND (food_photo_path IS NULL) AND (food_tags = '{}'::text[])))),
  CONSTRAINT entries_food_meal_type_check CHECK (((food_meal_type IS NULL) OR (food_meal_type = ANY (ARRAY['breakfast'::text, 'mid_morning'::text, 'lunch'::text, 'afternoon_snack'::text, 'dinner'::text, 'other'::text])))),
  CONSTRAINT entries_food_photo_path_check CHECK (((food_photo_path IS NULL) OR (food_photo_path ~~ ((user_id)::text || '/%'::text)))),
  CONSTRAINT entries_food_portion_check CHECK (((food_portion IS NULL) OR (food_portion = ANY (ARRAY['small'::text, 'normal'::text, 'large'::text])))),
  CONSTRAINT entries_urine_urgency_check CHECK (((urine_urgency >= 1) AND (urine_urgency <= 5))),
  CONSTRAINT feces_texture_check CHECK (((feces_texture = ANY (ARRAY['hard'::text, 'normal'::text, 'soft'::text, 'loose'::text, 'liquid'::text, 'oily'::text])) OR (feces_texture IS NULL))),
  CONSTRAINT entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.entry_doctor_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  doctor_id uuid NOT NULL,
  entry_id text NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT entry_doctor_notes_pkey PRIMARY KEY (id),
  CONSTRAINT entry_doctor_notes_doctor_id_entry_id_key UNIQUE (doctor_id, entry_id),
  CONSTRAINT entry_doctor_notes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'suggestion'::text,
  CONSTRAINT feedback_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.food_reminder_log (
  patient_id uuid NOT NULL,
  local_date date NOT NULL,
  slot text NOT NULL,
  sent_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT food_reminder_log_pkey PRIMARY KEY (patient_id, local_date, slot),
  CONSTRAINT food_reminder_log_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.patient_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  patient_id uuid,
  center_id uuid,
  doctor_id uuid,
  invite_code text,
  status text DEFAULT 'pending'::text,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  semaforo_override boolean DEFAULT false,
  semaforo_green_override integer,
  semaforo_red_override integer,
  hidden_fields text[] DEFAULT '{}'::text[],
  push_min_hours integer DEFAULT 24,
  push_frequency integer DEFAULT 2,
  patient_email text,
  entry_type_mode text DEFAULT 'both'::text NOT NULL,
  doctor_notes text,
  tags text[] DEFAULT '{}'::text[],
  push_disabled boolean DEFAULT false NOT NULL,
  doctor_unlinked boolean DEFAULT false NOT NULL,
  unlinked_at timestamp with time zone,
  dob date,
  height_cm integer,
  weight_kg numeric(5,1),
  food_config jsonb,
  CONSTRAINT patient_links_pkey PRIMARY KEY (id),
  CONSTRAINT patient_links_invite_code_key UNIQUE (invite_code),
  CONSTRAINT patient_links_food_config_object CHECK (((food_config IS NULL) OR (jsonb_typeof(food_config) = 'object'::text))),
  CONSTRAINT semaforo_override_check CHECK (((semaforo_red_override IS NULL) OR (semaforo_green_override IS NULL) OR (semaforo_red_override > semaforo_green_override))),
  CONSTRAINT patient_links_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE CASCADE,
  CONSTRAINT patient_links_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES auth.users(id),
  CONSTRAINT patient_links_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.patient_clinical_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  link_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT patient_clinical_notes_pkey PRIMARY KEY (id),
  CONSTRAINT patient_clinical_notes_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.patient_links(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.push_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid,
  source text NOT NULL,
  sender_id uuid,
  channel text NOT NULL,
  device_hint text,
  status text NOT NULL,
  error text,
  ticket_id text,
  receipt_status text,
  receipt_error text,
  receipt_checked_at timestamp with time zone,
  CONSTRAINT push_log_pkey PRIMARY KEY (id),
  CONSTRAINT push_log_channel_check CHECK ((channel = ANY (ARRAY['expo'::text, 'webpush'::text]))),
  CONSTRAINT push_log_receipt_status_check CHECK ((receipt_status = ANY (ARRAY['ok'::text, 'error'::text]))),
  CONSTRAINT push_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'expired'::text]))),
  CONSTRAINT push_log_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT push_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  subscription jsonb NOT NULL,
  last_push_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text NOT NULL,
  type text NOT NULL,
  received_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT stripe_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  tier text DEFAULT 'free'::text NOT NULL,
  premium_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  display_name text,
  email text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_tier_check CHECK ((tier = ANY (ARRAY['free'::text, 'premium'::text]))),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. Índices (los que no respaldan una PK/UNIQUE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS doctors_plan_idx ON public.doctors USING btree (plan);
CREATE UNIQUE INDEX IF NOT EXISTS doctors_stripe_customer_id_key ON public.doctors USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS entries_user_id_entry_type_date_idx ON public.entries USING btree (user_id, entry_type, date);
CREATE INDEX IF NOT EXISTS entries_user_id_updated_at_idx ON public.entries USING btree (user_id, updated_at);
CREATE INDEX IF NOT EXISTS entries_user_timestamp_idx ON public.entries USING btree (user_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_user_entry ON public.entries USING btree (user_id, entry_id);
CREATE INDEX IF NOT EXISTS entries_user_date_idx ON public.entries USING btree (user_id, date);
CREATE INDEX IF NOT EXISTS patient_clinical_notes_link_id_idx ON public.patient_clinical_notes USING btree (link_id);
CREATE INDEX IF NOT EXISTS patient_links_doctor_idx ON public.patient_links USING btree (doctor_id);
CREATE INDEX IF NOT EXISTS patient_links_patient_status_idx ON public.patient_links USING btree (patient_id, status);
CREATE INDEX IF NOT EXISTS patient_links_invite_code_idx ON public.patient_links USING btree (invite_code);
CREATE INDEX IF NOT EXISTS push_log_pending_receipts_idx ON public.push_log USING btree (created_at) WHERE ((status = 'sent'::text) AND (ticket_id IS NOT NULL) AND (receipt_checked_at IS NULL));
CREATE INDEX IF NOT EXISTS push_log_user_idx ON public.push_log USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS push_log_created_at_idx ON public.push_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions USING btree (user_id);

-- ============================================================================
-- 3. Funciones (pg_get_functiondef, tal cual están en producción)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_center(p_center_name text, p_specialty text, p_address text, p_phone text, p_doctor_email text, p_doctor_name text, p_doctor_specialty text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_center_id UUID;
  doctor_user_id UUID;
  result JSON;
BEGIN
  -- Verify caller is admin
  IF auth.email() NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Create center
  INSERT INTO centers (name, specialty, address, phone)
  VALUES (p_center_name, p_specialty, p_address, p_phone)
  RETURNING id INTO new_center_id;

  -- Find or note the doctor user (they must register separately via auth)
  SELECT id INTO doctor_user_id FROM auth.users WHERE email = p_doctor_email;

  IF doctor_user_id IS NOT NULL THEN
    INSERT INTO doctors (id, center_id, name, specialty)
    VALUES (doctor_user_id, new_center_id, p_doctor_name, p_doctor_specialty)
    ON CONFLICT (id) DO UPDATE SET center_id = new_center_id, name = p_doctor_name;
  END IF;

  SELECT json_build_object(
    'center_id', new_center_id,
    'doctor_linked', doctor_user_id IS NOT NULL,
    'doctor_email', p_doctor_email
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_doctor(p_doctor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_center_id uuid;
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar médicos.';
  END IF;

  SELECT center_id INTO v_center_id FROM doctors WHERE id = p_doctor_id;

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Médico no encontrado: %', p_doctor_id;
  END IF;

  DELETE FROM patient_links WHERE doctor_id = p_doctor_id;
  DELETE FROM doctors WHERE id = p_doctor_id;
  DELETE FROM centers WHERE id = v_center_id
    AND NOT EXISTS (SELECT 1 FROM doctors WHERE center_id = v_center_id);
  DELETE FROM auth.users WHERE id = p_doctor_id;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_doctor_auth_info(p_ids uuid[])
 RETURNS TABLE(id uuid, email text, provider text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    au.id,
    au.email,
    COALESCE(au.raw_app_meta_data->>'provider', 'email') AS provider
  FROM auth.users au
  WHERE au.id = ANY(p_ids)
    AND (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com');
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_push_overview(p_days integer DEFAULT 7, p_limit integer DEFAULT 500)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  IF auth.email() NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_entries', (SELECT count(*) FROM entries),
    'total_users', (SELECT count(DISTINCT user_id) FROM entries),
    'entries_today', (SELECT count(*) FROM entries WHERE date = CURRENT_DATE::text),
    'entries_week', (SELECT count(*) FROM entries WHERE created_at >= NOW() - INTERVAL '7 days'),
    'active_users_week', (SELECT count(DISTINCT user_id) FROM entries WHERE created_at >= NOW() - INTERVAL '7 days'),
    'premium_users', (SELECT count(*) FROM user_profiles WHERE tier = 'premium' AND (premium_until IS NULL OR premium_until > NOW())),
    'free_users', (SELECT count(*) FROM user_profiles WHERE tier = 'free'),
    'users', (SELECT json_agg(row_to_json(u)) FROM (
      SELECT 
        e.user_id as id,
        au.email,
        up.tier,
        up.premium_until,
        min(e.created_at) as created_at,
        max(e.created_at) as last_activity
      FROM entries e
      LEFT JOIN auth.users au ON au.id = e.user_id
      LEFT JOIN user_profiles up ON up.id = e.user_id
      GROUP BY e.user_id, au.email, up.tier, up.premium_until
      ORDER BY min(e.created_at) DESC
    ) u)
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_doctor_plan(p_doctor_id uuid, p_plan text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = auth.uid();

  IF v_email IS NULL OR v_email NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para cambiar el plan. (uid=%, email=%)', auth.uid(), v_email;
  END IF;

  IF p_plan NOT IN ('free', 'beta', 'test', 'pro') THEN
    RAISE EXCEPTION 'Plan no válido: debe ser ''free'', ''beta'', ''test'' o ''pro''.';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.billing_apply_subscription(p_customer_id text, p_doctor_id uuid, p_plan text, p_subscription_id text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_current_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cancel_at_period_end boolean DEFAULT false, p_price_id text DEFAULT NULL::text, p_interval text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.billing_attach_customer(p_doctor_id uuid, p_customer_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.admin_plan_bypass', 'true', true);

  UPDATE public.doctors
     SET stripe_customer_id = p_customer_id
   WHERE id = p_doctor_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_push_subscription(p_subscription jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$;

CREATE OR REPLACE FUNCTION public.create_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO user_profiles (id, tier) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.doctor_create_invite(p_patient_email text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  doc_center_id UUID;
  code TEXT;
  patient_uid UUID;
  link_id UUID;
BEGIN
  -- Get doctor's center
  SELECT center_id INTO doc_center_id FROM doctors WHERE id = auth.uid();
  IF doc_center_id IS NULL THEN
    RAISE EXCEPTION 'Not a doctor';
  END IF;

  -- Generate invite code
  code := generate_invite_code();

  -- Check if patient email exists
  IF p_patient_email IS NOT NULL THEN
    SELECT id INTO patient_uid FROM auth.users WHERE email = p_patient_email;
  END IF;

  -- Create link (now storing patient_email)
  INSERT INTO patient_links (patient_id, center_id, doctor_id, invite_code, status, patient_email)
  VALUES (patient_uid, doc_center_id, auth.uid(), code, 'pending', p_patient_email)
  RETURNING id INTO link_id;

  RETURN json_build_object(
    'link_id', link_id,
    'invite_code', code,
    'patient_found', patient_uid IS NOT NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.doctor_invite_patient(p_patient_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_id uuid;
  v_center_id  uuid;
  v_link_id    uuid;
BEGIN
  SELECT id, center_id INTO v_doctor_id, v_center_id
  FROM public.doctors
  WHERE id = auth.uid();

  IF v_doctor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No eres un médico registrado.');
  END IF;

  -- Check for duplicate pending invite to same email
  IF EXISTS (
    SELECT 1 FROM public.patient_links
    WHERE doctor_id = v_doctor_id
      AND lower(patient_email) = lower(trim(p_patient_email))
      AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya existe una invitación pendiente para ese email.');
  END IF;

  INSERT INTO public.patient_links (doctor_id, center_id, patient_email, status, invited_at)
  VALUES (v_doctor_id, v_center_id, lower(trim(p_patient_email)), 'pending', now())
  RETURNING id INTO v_link_id;

  RETURN jsonb_build_object('success', true, 'link_id', v_link_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.doctor_remove_patient_link(p_link_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_id uuid;
BEGIN
  -- In this schema, doctors.id = auth.uid()
  SELECT id INTO v_doctor_id FROM public.doctors WHERE id = auth.uid();
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor profile found for this user';
  END IF;

  DELETE FROM public.patient_links
  WHERE id = p_link_id AND doctor_id = v_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found or you do not have permission to delete it';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.doctor_self_delete_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_id uuid := auth.uid();
  v_center_id uuid;
BEGIN
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  SELECT center_id INTO v_center_id FROM doctors WHERE id = v_doctor_id;

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de médico no encontrado.';
  END IF;

  -- 1. Delete per-entry notes this doctor wrote on patients' entries
  DELETE FROM entry_doctor_notes WHERE doctor_id = v_doctor_id;

  -- 2. Delete clinical notes tied to this doctor's patient links
  DELETE FROM patient_clinical_notes
    WHERE link_id IN (SELECT id FROM patient_links WHERE doctor_id = v_doctor_id);

  -- 3. Delete patient links
  DELETE FROM patient_links WHERE doctor_id = v_doctor_id;

  -- 4. Delete doctor record
  DELETE FROM doctors WHERE id = v_doctor_id;

  -- 5. Delete center only if no other doctor uses it
  DELETE FROM centers WHERE id = v_center_id
    AND NOT EXISTS (SELECT 1 FROM doctors WHERE center_id = v_center_id);

  -- 6. Delete the auth user last, once all data is confirmed gone
  DELETE FROM auth.users WHERE id = v_doctor_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.doctor_self_register(p_name text, p_center_name text, p_specialty text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_free_plan_patient_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan text;
  v_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.doctors WHERE id = NEW.doctor_id;
  SELECT count(*) INTO v_count FROM public.patient_links WHERE doctor_id = NEW.doctor_id;

  IF v_plan = 'free' AND v_count >= 1 THEN
    RAISE EXCEPTION 'Plan Free: solo puedes gestionar 1 paciente.';
  END IF;

  IF v_plan = 'beta' AND v_count >= 100 THEN
    RAISE EXCEPTION 'Plan Beta: límite de 100 pacientes alcanzado.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.entries_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'CAC-' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM patient_links WHERE invite_code = code) INTO exists;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_patients_needing_push()
 RETURNS TABLE(patient_id uuid, subscription jsonb)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT pl.patient_id, ps.subscription
  FROM patient_links pl
  JOIN push_subscriptions ps ON ps.user_id = pl.patient_id
  WHERE pl.status = 'accepted' AND pl.patient_id IS NOT NULL
    AND NOT COALESCE(pl.doctor_unlinked, false)
    AND (
      NOT EXISTS (SELECT 1 FROM entries e WHERE e.user_id = pl.patient_id)
      OR (
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(e.created_at)))/3600
        FROM entries e WHERE e.user_id = pl.patient_id
      ) >= COALESCE(pl.push_min_hours, 24)
    )
    AND (
      ps.last_push_sent_at IS NULL
      OR EXTRACT(EPOCH FROM (NOW() - ps.last_push_sent_at))/3600 >= 24.0 / COALESCE(pl.push_frequency, 2)
    );
$function$;

CREATE OR REPLACE FUNCTION public.guard_doctor_plan_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_doctor_stripe_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_patient_food_config()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo se vigilan las peticiones de usuarios de la app (PostgREST con JWT);
  -- service_role y el SQL editor pueden corregir pautas.
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF NEW.food_config IS DISTINCT FROM OLD.food_config
     AND auth.uid() IS DISTINCT FROM OLD.doctor_id THEN
    RAISE EXCEPTION 'La pauta de comidas solo puede modificarla el profesional.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, tier, email)
  VALUES (NEW.id, 'free', NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_fluxia_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
     WHERE id = auth.uid()
       AND lower(trim(email)) IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com')
  );
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_doctor_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_center_name text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  SELECT name INTO v_center_name FROM public.centers WHERE id = NEW.center_id;

  PERFORM net.http_post(
    url     := ('https://vchzhwvbvnwrrgfrxfor.supabase.co/functions/v1/notify-new-doctor')::text,
    body    := jsonb_build_object(
                 'name',        NEW.name,
                 'email',       COALESCE(v_email, 'desconocido'),
                 'center_name', COALESCE(v_center_name, '—'),
                 'specialty',   COALESCE(NEW.specialty, '—'),
                 'plan',        NEW.plan,
                 'created_at',  NEW.created_at
               ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.patient_accept_invite(p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  link RECORD;
BEGIN
  SELECT * INTO link FROM patient_links WHERE invite_code = p_code AND status = 'pending';

  IF link IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código no válido o ya utilizado');
  END IF;

  UPDATE patient_links
  SET patient_id = auth.uid(), status = 'accepted', accepted_at = NOW()
  WHERE id = link.id;

  RETURN json_build_object(
    'success', true,
    'center_name', (SELECT name FROM centers WHERE id = link.center_id)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.patient_get_pending_invites()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email  text;
  v_result jsonb;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT jsonb_agg(jsonb_build_object(
    'id',          pl.id,
    'doctor_name', d.name,
    'center_name', c.name,
    'invited_at',  pl.invited_at
  ) ORDER BY pl.invited_at DESC)
  INTO v_result
  FROM public.patient_links pl
  JOIN public.doctors d ON d.id = pl.doctor_id
  JOIN public.centers c ON c.id = pl.center_id
  WHERE lower(pl.patient_email) = lower(v_email)
    AND pl.status = 'pending';

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.patient_respond_to_invite(p_link_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email      text;
  v_link       public.patient_links%ROWTYPE;
  v_center_name text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_link
  FROM public.patient_links
  WHERE id = p_link_id
    AND lower(patient_email) = lower(v_email)
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitación no encontrada o ya procesada.');
  END IF;

  IF p_accept THEN
    UPDATE public.patient_links
    SET patient_id  = auth.uid(),
        status      = 'accepted',
        accepted_at = now()
    WHERE id = p_link_id;

    SELECT name INTO v_center_name FROM public.centers WHERE id = v_link.center_id;
    RETURN jsonb_build_object('success', true, 'center_name', v_center_name);
  ELSE
    UPDATE public.patient_links
    SET status = 'rejected'
    WHERE id = p_link_id;

    RETURN jsonb_build_object('success', true);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_trial_on_doctor_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- ============================================================================
-- 4. Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS doctors_guard_plan_change ON public.doctors;
CREATE TRIGGER doctors_guard_plan_change BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_plan_change();

DROP TRIGGER IF EXISTS doctors_guard_stripe_insert ON public.doctors;
CREATE TRIGGER doctors_guard_stripe_insert BEFORE INSERT ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_stripe_insert();

DROP TRIGGER IF EXISTS doctors_set_trial_on_insert ON public.doctors;
CREATE TRIGGER doctors_set_trial_on_insert BEFORE INSERT ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.set_trial_on_doctor_insert();

DROP TRIGGER IF EXISTS on_doctor_insert ON public.doctors;
CREATE TRIGGER on_doctor_insert AFTER INSERT ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.notify_new_doctor_trigger();

DROP TRIGGER IF EXISTS entries_set_updated_at ON public.entries;
CREATE TRIGGER entries_set_updated_at BEFORE INSERT OR UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION public.entries_set_updated_at();

DROP TRIGGER IF EXISTS guard_patient_food_config ON public.patient_links;
CREATE TRIGGER guard_patient_food_config BEFORE UPDATE ON public.patient_links FOR EACH ROW EXECUTE FUNCTION public.guard_patient_food_config();

DROP TRIGGER IF EXISTS patient_links_free_plan_limit ON public.patient_links;
CREATE TRIGGER patient_links_free_plan_limit BEFORE INSERT ON public.patient_links FOR EACH ROW EXECUTE FUNCTION public.enforce_free_plan_patient_limit();

-- ============================================================================
-- 5. Permisos
-- ----------------------------------------------------------------------------
-- Por defecto Supabase da todo a anon/authenticated/service_role y deja que
-- RLS filtre. Aquí solo se reproducen las excepciones de producción.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON public.push_log FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_delete_doctor(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_doctor(uuid) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_get_push_overview(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_push_overview(integer, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamp with time zone, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_apply_subscription(text, uuid, text, text, text, timestamp with time zone, boolean, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.billing_attach_customer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_attach_customer(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.claim_push_subscription(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_push_subscription(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.doctor_self_delete_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_self_delete_account() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.doctor_self_register(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_self_register(text, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.guard_patient_food_config() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_patient_food_config() TO service_role;

REVOKE ALL ON FUNCTION public.is_fluxia_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_fluxia_admin() TO authenticated, service_role;

-- ============================================================================
-- 6. Row Level Security
-- ============================================================================

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_doctor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_reminder_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ── centers ──
DROP POLICY IF EXISTS "Anon can read centers for registration" ON public.centers;
CREATE POLICY "Anon can read centers for registration" ON public.centers FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete centers" ON public.centers;
CREATE POLICY "Authenticated users can delete centers" ON public.centers FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert centers" ON public.centers;
CREATE POLICY "Authenticated users can insert centers" ON public.centers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can read centers" ON public.centers;
CREATE POLICY "Authenticated users can read centers" ON public.centers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update centers" ON public.centers;
CREATE POLICY "Authenticated users can update centers" ON public.centers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "centers_doctor_select" ON public.centers;
CREATE POLICY "centers_doctor_select" ON public.centers FOR SELECT TO authenticated
  USING ((id IN ( SELECT doctors.center_id
   FROM doctors
  WHERE (doctors.id = auth.uid()))));
DROP POLICY IF EXISTS "centers_self_insert" ON public.centers;
CREATE POLICY "centers_self_insert" ON public.centers FOR INSERT TO authenticated WITH CHECK (true);

-- ── doctors ──
DROP POLICY IF EXISTS "doctors_read_scoped" ON public.doctors;
CREATE POLICY "doctors_read_scoped" ON public.doctors FOR SELECT TO authenticated
  USING (((id = auth.uid()) OR is_fluxia_admin() OR (EXISTS ( SELECT 1
   FROM patient_links pl
  WHERE ((pl.doctor_id = doctors.id) AND (pl.patient_id = auth.uid()))))));
DROP POLICY IF EXISTS "doctors_self_insert" ON public.doctors;
CREATE POLICY "doctors_self_insert" ON public.doctors FOR INSERT TO authenticated
  WITH CHECK (((id = auth.uid()) AND (plan = ANY (ARRAY['free'::text, 'beta'::text, 'test'::text]))));
DROP POLICY IF EXISTS "doctors_self_select" ON public.doctors;
CREATE POLICY "doctors_self_select" ON public.doctors FOR SELECT TO authenticated USING ((id = auth.uid()));
DROP POLICY IF EXISTS "doctors_self_update" ON public.doctors;
CREATE POLICY "doctors_self_update" ON public.doctors FOR UPDATE TO authenticated
  USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

-- ── entries ──
DROP POLICY IF EXISTS "Doctors can read linked patient entries" ON public.entries;
CREATE POLICY "Doctors can read linked patient entries" ON public.entries FOR SELECT
  USING ((user_id IN ( SELECT patient_links.patient_id
   FROM patient_links
  WHERE ((patient_links.doctor_id = auth.uid()) AND (patient_links.status = 'accepted'::text) AND (patient_links.patient_id IS NOT NULL)))));
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;
CREATE POLICY "Users can delete own entries" ON public.entries FOR DELETE USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can insert own entries" ON public.entries;
CREATE POLICY "Users can insert own entries" ON public.entries FOR INSERT WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can read own entries" ON public.entries;
CREATE POLICY "Users can read own entries" ON public.entries FOR SELECT USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
CREATE POLICY "Users can update own entries" ON public.entries FOR UPDATE USING ((auth.uid() = user_id));

-- ── entry_doctor_notes ──
DROP POLICY IF EXISTS "entry_doctor_notes_own" ON public.entry_doctor_notes;
CREATE POLICY "entry_doctor_notes_own" ON public.entry_doctor_notes FOR ALL TO authenticated
  USING ((doctor_id = auth.uid())) WITH CHECK ((doctor_id = auth.uid()));

-- ── feedback ──
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.feedback;
CREATE POLICY "Authenticated users can read feedback" ON public.feedback FOR SELECT USING ((auth.role() = 'authenticated'::text));

-- ── patient_clinical_notes ──
DROP POLICY IF EXISTS "Doctors manage notes on their own patient links" ON public.patient_clinical_notes;
CREATE POLICY "Doctors manage notes on their own patient links" ON public.patient_clinical_notes FOR ALL
  USING ((EXISTS ( SELECT 1
   FROM patient_links pl
  WHERE ((pl.id = patient_clinical_notes.link_id) AND (pl.doctor_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM patient_links pl
  WHERE ((pl.id = patient_clinical_notes.link_id) AND (pl.doctor_id = auth.uid())))));

-- ── patient_links ──
DROP POLICY IF EXISTS "Admins can read all links" ON public.patient_links;
CREATE POLICY "Admins can read all links" ON public.patient_links FOR SELECT
  USING ((auth.email() = ANY (ARRAY['soymachine@gmail.com'::text, 'ericbarbercot@icloud.com'::text])));
DROP POLICY IF EXISTS "Doctors can delete own pending invitations" ON public.patient_links;
CREATE POLICY "Doctors can delete own pending invitations" ON public.patient_links FOR DELETE
  USING (((doctor_id = auth.uid()) AND (status = 'pending'::text)));
DROP POLICY IF EXISTS "Doctors can insert links" ON public.patient_links;
CREATE POLICY "Doctors can insert links" ON public.patient_links FOR INSERT
  WITH CHECK (((doctor_id = auth.uid()) OR (center_id IN ( SELECT doctors.center_id
   FROM doctors
  WHERE (doctors.id = auth.uid())))));
DROP POLICY IF EXISTS "Doctors can select links for their center" ON public.patient_links;
CREATE POLICY "Doctors can select links for their center" ON public.patient_links FOR SELECT
  USING (((doctor_id = auth.uid()) OR (patient_id = auth.uid())));
DROP POLICY IF EXISTS "Doctors can update their patient links" ON public.patient_links;
CREATE POLICY "Doctors can update their patient links" ON public.patient_links FOR UPDATE TO authenticated
  USING ((doctor_id = auth.uid())) WITH CHECK ((doctor_id = auth.uid()));
DROP POLICY IF EXISTS "Patients can read own links" ON public.patient_links;
CREATE POLICY "Patients can read own links" ON public.patient_links FOR SELECT USING ((patient_id = auth.uid()));
DROP POLICY IF EXISTS "Patients can update own links" ON public.patient_links;
CREATE POLICY "Patients can update own links" ON public.patient_links FOR UPDATE
  USING ((patient_id = auth.uid())) WITH CHECK ((patient_id = auth.uid()));

-- ── push_subscriptions ──
DROP POLICY IF EXISTS "Doctors read patient push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Doctors read patient push subscriptions" ON public.push_subscriptions FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM patient_links pl
  WHERE ((pl.patient_id = push_subscriptions.user_id) AND (pl.doctor_id = auth.uid()) AND (pl.status = 'accepted'::text)))));
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions FOR ALL
  USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- ── user_profiles ──
DROP POLICY IF EXISTS "Doctors can read linked patient profiles" ON public.user_profiles;
CREATE POLICY "Doctors can read linked patient profiles" ON public.user_profiles FOR SELECT
  USING ((EXISTS ( SELECT 1
   FROM patient_links
  WHERE ((patient_links.patient_id = user_profiles.id) AND (patient_links.doctor_id = auth.uid()) AND (patient_links.status = 'accepted'::text)))));
DROP POLICY IF EXISTS "Service can insert profiles" ON public.user_profiles;
CREATE POLICY "Service can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE
  USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

-- food_reminder_log, push_log y stripe_events: RLS activado sin políticas
-- (solo service_role, que se salta RLS).

-- ============================================================================
-- 7. Storage: buckets y políticas de storage.objects
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('center-images', 'center-images', true, NULL, NULL),
  ('food-photos', 'food-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload center images" ON storage.objects;
CREATE POLICY "Authenticated upload center images" ON storage.objects FOR ALL TO authenticated
  USING ((bucket_id = 'center-images'::text)) WITH CHECK ((bucket_id = 'center-images'::text));
DROP POLICY IF EXISTS "Public read center images" ON storage.objects;
CREATE POLICY "Public read center images" ON storage.objects FOR SELECT TO anon
  USING ((bucket_id = 'center-images'::text));
DROP POLICY IF EXISTS "food_photos_doctor_select" ON storage.objects;
CREATE POLICY "food_photos_doctor_select" ON storage.objects FOR SELECT TO authenticated
  USING (((bucket_id = 'food-photos'::text) AND (EXISTS ( SELECT 1
   FROM patient_links pl
  WHERE ((pl.doctor_id = auth.uid()) AND (pl.status = 'accepted'::text) AND (pl.patient_id IS NOT NULL) AND ((pl.patient_id)::text = (storage.foldername(objects.name))[1]))))));
DROP POLICY IF EXISTS "food_photos_patient_delete" ON storage.objects;
CREATE POLICY "food_photos_patient_delete" ON storage.objects FOR DELETE TO authenticated
  USING (((bucket_id = 'food-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
DROP POLICY IF EXISTS "food_photos_patient_insert" ON storage.objects;
CREATE POLICY "food_photos_patient_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'food-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
DROP POLICY IF EXISTS "food_photos_patient_select" ON storage.objects;
CREATE POLICY "food_photos_patient_select" ON storage.objects FOR SELECT TO authenticated
  USING (((bucket_id = 'food-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
DROP POLICY IF EXISTS "food_photos_patient_update" ON storage.objects;
CREATE POLICY "food_photos_patient_update" ON storage.objects FOR UPDATE TO authenticated
  USING (((bucket_id = 'food-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  WITH CHECK (((bucket_id = 'food-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
