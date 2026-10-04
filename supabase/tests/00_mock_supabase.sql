-- ============================================================================
-- Mock mínimo de Supabase para probar migraciones y RLS en un Postgres local.
-- ----------------------------------------------------------------------------
-- Reproduce lo justo del entorno real: roles anon/authenticated/service_role,
-- auth.uid()/auth.role()/auth.email() leyendo los claims del JWT (igual que
-- Supabase, vía GUC request.jwt.claim.*), el esquema storage con
-- storage.foldername(), y las tablas y políticas RLS de producción que tocan
-- los registros clínicos (copiadas de pg_policies del proyecto `cacalendario`
-- a fecha 2026-10-01). Lo usa supabase/tests/run.sh; no se despliega.
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── auth ──
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
CREATE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.email', true), '') $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- ── storage ──
CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  RETURN _parts[1:array_length(_parts, 1) - 1];
END $$;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;

-- ── public: tablas existentes (solo las columnas relevantes) ──
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL DEFAULT '',
  global_tags text[] NOT NULL DEFAULT '{}',
  semaforo_green integer DEFAULT 1,
  semaforo_red integer DEFAULT 3,
  hidden_fields text[] DEFAULT '{}'
);

CREATE TABLE public.patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id),
  doctor_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  hidden_fields text[] DEFAULT '{}',
  entry_type_mode text NOT NULL DEFAULT 'both',
  push_min_hours integer DEFAULT 24,
  push_frequency integer DEFAULT 2,
  push_disabled boolean NOT NULL DEFAULT false,
  doctor_unlinked boolean NOT NULL DEFAULT false,
  unlinked_at timestamptz,
  tags text[] DEFAULT '{}'
);

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id text,
  date text NOT NULL,
  time text NOT NULL,
  timestamp bigint NOT NULL,
  notes text DEFAULT '',
  entry_type text NOT NULL DEFAULT 'poop',
  bristol integer,
  floats text,
  color text,
  quantity integer,
  duration text,
  symptoms text[],
  urine_type text,
  urine_quantity integer,
  urine_color text,
  urine_characteristics text[] DEFAULT '{}',
  urine_urgency integer CHECK (urine_urgency >= 1 AND urine_urgency <= 5),
  during_sleep boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, entry_id)
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Políticas de producción (pg_policies, 2026-10-01).
CREATE POLICY "Doctors can read linked patient entries" ON public.entries FOR SELECT
  USING (user_id IN (SELECT patient_links.patient_id FROM patient_links
    WHERE patient_links.doctor_id = auth.uid() AND patient_links.status = 'accepted' AND patient_links.patient_id IS NOT NULL));
CREATE POLICY "Users can delete own entries" ON public.entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own entries" ON public.entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can select links for their center" ON public.patient_links FOR SELECT
  USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Doctors can update their patient links" ON public.patient_links FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Patients can update own links" ON public.patient_links FOR UPDATE
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE POLICY "doctors_self_select" ON public.doctors FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "doctors_self_update" ON public.doctors FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
