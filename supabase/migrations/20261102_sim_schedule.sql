-- ============================================================================
-- Fluxia — Pausar / reanudar la simulación diaria desde /admin
-- ----------------------------------------------------------------------------
-- El cron de GitHub Actions (.github/workflows/sim.yml) se dispara cada día,
-- pero antes de simular pregunta aquí si está activo (sim_schedule_status,
-- con el mismo token que sube los informes). Si está en pausa, termina sin
-- hacer nada. /admin → Simulaciones lo cambia con admin_set_sim_schedule.
--
-- Así no hace falta ningún token de GitHub en el navegador.
-- Las ejecuciones manuales (workflow_dispatch) no miran la pausa.
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sim_schedule (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),  -- una sola fila
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

INSERT INTO public.sim_schedule (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.sim_schedule ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sim_schedule FROM anon, authenticated;

-- ── Para el workflow (con el token de sim_ingest_tokens) ──

CREATE OR REPLACE FUNCTION public.sim_schedule_status(p_token text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR NOT EXISTS (
    SELECT 1 FROM sim_ingest_tokens WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  ) THEN
    RAISE EXCEPTION 'Token de simulación no válido';
  END IF;
  RETURN coalesce((SELECT enabled FROM sim_schedule WHERE id), true);
END;
$$;

REVOKE ALL ON FUNCTION public.sim_schedule_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sim_schedule_status(text) TO anon, authenticated, service_role;

-- ── Para /admin ──

CREATE OR REPLACE FUNCTION public.admin_get_sim_schedule()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_fluxia_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN (SELECT json_build_object('enabled', enabled, 'updated_at', updated_at, 'updated_by', updated_by) FROM sim_schedule WHERE id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_sim_schedule(p_enabled boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_fluxia_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO sim_schedule (id, enabled, updated_at, updated_by)
  VALUES (true, coalesce(p_enabled, true), now(), (SELECT email FROM auth.users WHERE id = auth.uid()))
  ON CONFLICT (id) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by;
  RETURN admin_get_sim_schedule();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_sim_schedule() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_sim_schedule(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_sim_schedule() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_sim_schedule(boolean) TO authenticated, service_role;
