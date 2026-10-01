-- ============================================================================
-- Fluxia — Módulo de seguimiento de comidas (entry_type = 'food')
-- ----------------------------------------------------------------------------
-- Fluxia ya guarda todos los registros clínicos en una única tabla genérica,
-- `entries`, discriminada por `entry_type` ('poop' | 'urine'), y la pauta de
-- cada paciente vive en su fila de `patient_links` (hidden_fields,
-- entry_type_mode, semáforo, push...). La comida se integra igual:
--
--   * un tercer `entry_type`, 'food', con columnas propias prefijadas `food_*`
--     (mismo convenio que las `urine_*`). Fecha/hora clínica = date/time/
--     timestamp de siempre; las observaciones del paciente = `notes`. Así las
--     políticas RLS de `entries` (paciente: solo lo suyo; médico: solo
--     pacientes vinculados y aceptados) cubren la comida sin tocar nada.
--   * la pauta de comida del paciente en `patient_links.food_config` (jsonb).
--     NULL = módulo desactivado, que es el estado de todos los pacientes
--     existentes: deposición y micción siguen funcionando exactamente igual.
--   * el catálogo de etiquetas de comida del médico en
--     `doctors.food_tag_catalog` (mismo patrón que `global_tags`); qué
--     etiquetas ve cada paciente va en su `food_config.tags`.
--   * fotos en un bucket PRIVADO de Storage (`food-photos`), carpeta = id del
--     paciente. Nunca URLs públicas: el panel médico pide signed URLs de vida
--     corta, y las políticas de storage.objects replican las de `entries`.
--   * `food_reminder_log`: deduplicación de recordatorios de comida (un aviso
--     por comida y día como máximo). Solo la escribe la Edge Function
--     check-inactive-patients con service_role.
--
-- Todo es aditivo e idempotente: no cambia ninguna columna ni política
-- existente, y los clientes antiguos (que no conocen las columnas food_*)
-- siguen insertando/actualizando registros sin problemas.
-- ============================================================================

-- ── 1. entries: columnas de comida ──
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS food_meal_type   text,
  ADD COLUMN IF NOT EXISTS food_description text,
  ADD COLUMN IF NOT EXISTS food_portion     text,
  ADD COLUMN IF NOT EXISTS food_tags        text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS food_photo_path  text;

-- Tipos de registro conocidos. Un módulo nuevo (hidratación, peso, sueño...)
-- añade aquí su valor y sus columnas `<modulo>_*`.
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_entry_type_check;
ALTER TABLE public.entries
  ADD CONSTRAINT entries_entry_type_check
  CHECK (entry_type IN ('poop', 'urine', 'food')) NOT VALID;
ALTER TABLE public.entries VALIDATE CONSTRAINT entries_entry_type_check;

ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_food_meal_type_check;
ALTER TABLE public.entries
  ADD CONSTRAINT entries_food_meal_type_check
  CHECK (food_meal_type IS NULL OR food_meal_type IN
    ('breakfast', 'mid_morning', 'lunch', 'afternoon_snack', 'dinner', 'other'));

ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_food_portion_check;
ALTER TABLE public.entries
  ADD CONSTRAINT entries_food_portion_check
  CHECK (food_portion IS NULL OR food_portion IN ('small', 'normal', 'large'));

-- La foto solo puede apuntar a la carpeta del propio paciente: impide que un
-- registro "tome prestada" la ruta de una foto ajena.
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_food_photo_path_check;
ALTER TABLE public.entries
  ADD CONSTRAINT entries_food_photo_path_check
  CHECK (food_photo_path IS NULL OR food_photo_path LIKE user_id::text || '/%');

-- Los campos de comida solo tienen sentido en registros de comida.
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_food_fields_only_on_food;
ALTER TABLE public.entries
  ADD CONSTRAINT entries_food_fields_only_on_food
  CHECK (
    entry_type = 'food'
    OR (food_meal_type IS NULL AND food_description IS NULL AND food_portion IS NULL
        AND food_photo_path IS NULL AND food_tags = '{}')
  );

CREATE INDEX IF NOT EXISTS entries_user_id_entry_type_date_idx
  ON public.entries (user_id, entry_type, date);

-- ── 2. Pauta de comida por paciente ──
ALTER TABLE public.patient_links
  ADD COLUMN IF NOT EXISTS food_config jsonb;

ALTER TABLE public.patient_links DROP CONSTRAINT IF EXISTS patient_links_food_config_object;
ALTER TABLE public.patient_links
  ADD CONSTRAINT patient_links_food_config_object
  CHECK (food_config IS NULL OR jsonb_typeof(food_config) = 'object');

COMMENT ON COLUMN public.patient_links.food_config IS
  'Pauta de seguimiento de comidas (ver src/lib/food.ts → FoodTrackingConfig). NULL = desactivado.';
COMMENT ON COLUMN public.patient_links.entry_type_mode IS
  'Registros de deposición/micción permitidos: both | poop_only | urine_only | none (none = solo módulos adicionales, p. ej. comida).';

-- La política "Patients can update own links" deja al paciente escribir toda
-- su fila (la usa para aceptar invitaciones). La pauta de comida la decide el
-- profesional: el paciente no puede cambiársela.
CREATE OR REPLACE FUNCTION public.guard_patient_food_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS guard_patient_food_config ON public.patient_links;
CREATE TRIGGER guard_patient_food_config
  BEFORE UPDATE ON public.patient_links
  FOR EACH ROW EXECUTE FUNCTION public.guard_patient_food_config();

-- ── 3. Catálogo de etiquetas de comida del profesional ──
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS food_tag_catalog text[] NOT NULL DEFAULT '{}';

-- ── 4. Fotos: bucket privado + RLS ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('food-photos', 'food-photos', false, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Paciente: solo su carpeta (<patient_id>/<entry_id>.jpg).
DROP POLICY IF EXISTS "food_photos_patient_select" ON storage.objects;
CREATE POLICY "food_photos_patient_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "food_photos_patient_insert" ON storage.objects;
CREATE POLICY "food_photos_patient_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "food_photos_patient_update" ON storage.objects;
CREATE POLICY "food_photos_patient_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "food_photos_patient_delete" ON storage.objects;
CREATE POLICY "food_photos_patient_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Profesional: lectura de las fotos de sus pacientes vinculados y aceptados
-- (mismo criterio que "Doctors can read linked patient entries").
DROP POLICY IF EXISTS "food_photos_doctor_select" ON storage.objects;
CREATE POLICY "food_photos_doctor_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'food-photos'
    AND EXISTS (
      SELECT 1 FROM public.patient_links pl
      WHERE pl.doctor_id = auth.uid()
        AND pl.status = 'accepted'
        AND pl.patient_id IS NOT NULL
        AND pl.patient_id::text = (storage.foldername(name))[1]
    )
  );

-- ── 5. Deduplicación de recordatorios de comida ──
CREATE TABLE IF NOT EXISTS public.food_reminder_log (
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  slot       text NOT NULL,   -- meal_type o 'daily_target'
  sent_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, local_date, slot)
);

-- Sin políticas: solo service_role (que salta RLS) la lee y escribe.
ALTER TABLE public.food_reminder_log ENABLE ROW LEVEL SECURITY;
