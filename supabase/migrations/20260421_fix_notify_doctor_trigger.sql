-- Fix notify_new_doctor_trigger: correct net.http_post signature + add exception handler
--
-- Problems in the original migration:
--   1. URL string literal resolves to 'unknown' type with named params — needs ::text cast
--   2. body was cast to ::text but pg_net expects bytea — use convert_to() instead
--   3. No exception handler: a broken notification rolled back the entire doctor INSERT
--
-- BEFORE RUNNING: replace <PROJECT_REF> with your Supabase project reference
-- (Dashboard → Settings → General → Reference ID, e.g. "abcdefghijklmnop")

CREATE OR REPLACE FUNCTION public.notify_new_doctor_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload text;
BEGIN
  BEGIN
    v_payload := jsonb_build_object(
      'type',   'INSERT',
      'table',  TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)::jsonb
    )::text;

    PERFORM net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-doctor'::text,
      body    := convert_to(v_payload, 'UTF8'),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- notification failure must never block doctor registration
  END;
  RETURN NEW;
END;
$$;
