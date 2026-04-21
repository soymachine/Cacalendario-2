-- Trigger: call notify-new-doctor Edge Function on every new doctor INSERT
-- Requires: pg_net extension (enabled by default in Supabase)
--
-- BEFORE RUNNING: replace <PROJECT_REF> with your Supabase project reference
-- (Dashboard → Settings → General → Reference ID, e.g. "abcdefghijklmnop")

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_doctor_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-doctor',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object(
      'type',   'INSERT',
      'table',  TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)::jsonb
    )::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_doctor_insert ON public.doctors;
CREATE TRIGGER on_doctor_insert
  AFTER INSERT ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_doctor_trigger();
