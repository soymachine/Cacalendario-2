-- Ajustes que solo existen en el Supabase del simulador (se aplican después
-- del snapshot de producción).

-- En producción este trigger avisa por correo de cada médico nuevo llamando a
-- la Edge Function de PRODUCCIÓN (URL fija). Aquí no debe salir nada.
CREATE OR REPLACE FUNCTION public.notify_new_doctor_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Token para subir el informe al propio Supabase local (local.sh lo usa si no
-- se indica otro destino con SIM_REPORT_URL/KEY/TOKEN). Solo existe aquí.
INSERT INTO public.sim_ingest_tokens (token_hash, label)
VALUES (encode(sha256(convert_to('local-sim-token', 'UTF8')), 'hex'), 'Supabase local del simulador')
ON CONFLICT DO NOTHING;
