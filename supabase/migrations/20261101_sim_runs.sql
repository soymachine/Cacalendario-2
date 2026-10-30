-- ============================================================================
-- Fluxia — Informes del simulador funcional (tests/sim) para /admin
-- ----------------------------------------------------------------------------
-- Cada ejecución de `npm run sim` (en local o en CI) sube su informe completo
-- a `sim_runs`; la sección "Simulaciones" de /admin los lista por día y
-- muestra el detalle de cada mes simulado.
--
-- Los datos son sintéticos (1 médico + 9 pacientes inventados), pero la tabla
-- no se expone: nadie la lee ni escribe directamente.
--   · Escribir: sim_ingest_report(token, informe). El token lo tiene quien
--     ejecuta la simulación (secreto de GitHub Actions); aquí solo se guarda
--     su SHA-256, en sim_ingest_tokens.
--   · Leer / borrar: admin_list_sim_runs, admin_get_sim_run,
--     admin_delete_sim_run, solo para admins de Fluxia (is_fluxia_admin).
--
-- Alta de un token (SQL editor; el token, en el secreto SIM_REPORT_TOKEN):
--   INSERT INTO public.sim_ingest_tokens (token_hash, label)
--   VALUES (encode(sha256(convert_to('<token>', 'UTF8')), 'hex'), 'GitHub Actions');
--
-- Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sim_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pass', 'fail', 'error')),
  source text NOT NULL DEFAULT 'local',
  seed bigint,
  sim_start date,
  sim_end date,
  duration_s numeric,
  git_sha text,
  git_ref text,
  -- Resumen para el listado (contadores, comprobaciones que fallaron).
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Informe completo (tests/sim/run.ts → buildReport).
  report jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS sim_runs_created_at_idx ON public.sim_runs (created_at DESC);

ALTER TABLE public.sim_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sim_runs FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.sim_ingest_tokens (
  token_hash text PRIMARY KEY,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sim_ingest_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sim_ingest_tokens FROM anon, authenticated;

-- ── Subida de un informe ──

CREATE OR REPLACE FUNCTION public.sim_ingest_report(p_token text, p_report jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_token IS NULL OR NOT EXISTS (
    SELECT 1 FROM sim_ingest_tokens WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  ) THEN
    RAISE EXCEPTION 'Token de simulación no válido';
  END IF;
  IF p_report IS NULL OR jsonb_typeof(p_report) <> 'object' OR coalesce(p_report->>'runId', '') = '' THEN
    RAISE EXCEPTION 'Informe no válido';
  END IF;
  IF pg_column_size(p_report) > 5 * 1024 * 1024 THEN
    RAISE EXCEPTION 'Informe demasiado grande';
  END IF;

  INSERT INTO sim_runs (run_id, created_at, status, source, seed, sim_start, sim_end, duration_s, git_sha, git_ref, summary, report)
  VALUES (
    p_report->>'runId',
    coalesce((p_report->>'startedAt')::timestamptz, now()),
    coalesce(p_report->>'status', 'error'),
    coalesce(p_report->>'source', 'local'),
    (p_report->>'seed')::bigint,
    (p_report->>'simStart')::date,
    (p_report->>'simEnd')::date,
    (p_report->>'durationS')::numeric,
    p_report#>>'{git,sha}',
    p_report#>>'{git,ref}',
    coalesce(p_report->'summary', '{}'::jsonb),
    p_report
  )
  ON CONFLICT (run_id) DO UPDATE SET
    status = EXCLUDED.status, duration_s = EXCLUDED.duration_s,
    summary = EXCLUDED.summary, report = EXCLUDED.report
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sim_ingest_report(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sim_ingest_report(text, jsonb) TO anon, authenticated, service_role;

-- ── Lectura desde /admin ──

CREATE OR REPLACE FUNCTION public.admin_list_sim_runs(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
BEGIN
  IF NOT is_fluxia_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN (
    SELECT coalesce(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    FROM (
      SELECT id, run_id, created_at, status, source, seed, sim_start, sim_end, duration_s, git_sha, git_ref, summary
      FROM sim_runs
      WHERE created_at >= now() - make_interval(days => v_days)
      ORDER BY created_at DESC
      LIMIT 1000
    ) r
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_sim_run(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_fluxia_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN (SELECT jsonb_build_object('id', id, 'created_at', created_at, 'report', report) FROM sim_runs WHERE id = p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_sim_run(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_fluxia_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM sim_runs WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_sim_runs(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_sim_run(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_sim_run(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_sim_runs(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_sim_run(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_sim_run(uuid) TO authenticated, service_role;
