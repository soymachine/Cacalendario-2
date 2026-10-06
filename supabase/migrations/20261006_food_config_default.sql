-- ============================================================================
-- Fluxia — Comidas activadas por defecto para pacientes con profesional
-- ----------------------------------------------------------------------------
-- Desde el 6-oct, un vínculo sin pauta de comidas guardada (food_config NULL)
-- equivale a la pauta por defecto con las comidas ACTIVADAS: el paciente puede
-- registrar comidas, pero sin objetivo diario ni recordatorios, así que no
-- cambia el semáforo ni se envían avisos (linkFoodConfig en src/lib/food.ts).
-- Solo una pauta guardada con enabled = false las desactiva.
--
-- No cambia datos ni esquema: solo la descripción de la columna.
-- ============================================================================

COMMENT ON COLUMN public.patient_links.food_config IS
  'Pauta de seguimiento de comidas (ver src/lib/food.ts → FoodTrackingConfig y linkFoodConfig). NULL = pauta por defecto: comidas activadas, sin objetivo ni recordatorios.';
