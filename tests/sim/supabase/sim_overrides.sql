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
