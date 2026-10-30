-- ============================================================================
-- Fluxia — Cierre de políticas RLS demasiado abiertas
-- ----------------------------------------------------------------------------
-- Detectado con el simulador funcional (npm run sim, tests/sim/checks.ts) sobre
-- el esquema de producción (supabase/schema/prod_baseline.sql):
--
--   1. Un médico (cualquiera: el alta con trial es libre) podía crear un
--      vínculo, o editar uno suyo, con patient_id = cualquier usuario y
--      status = 'accepted', y leer así todos sus registros sin que el
--      paciente aceptase nada.
--   2. Cualquier usuario autenticado, también un paciente, podía editar o
--      borrar cualquier centro (USING true). Borrar un centro arrastra en
--      cascada a sus médicos y vínculos.
--   3. Un paciente podía reescribir cualquier columna de su vínculo (tags,
--      notas y umbrales del médico, archivado…). La app PA no actualiza nunca
--      patient_links: responde a las invitaciones con patient_respond_to_invite.
--   4. Un médico podía cambiarse de centro (doctors.center_id), y con ello
--      editar el centro de otro.
--   5. Un usuario podía ponerse tier = 'premium' en su perfil.
--   6. Cualquier usuario autenticado leía todo el buzón de sugerencias
--      (feedback, con emails). Y el admin no podía borrar sugerencias.
--   7. Al archivar un seguimiento, el médico seguía pudiendo leer los registros
--      posteriores (solo los ocultaba la interfaz de MW/MA).
--
-- Las escrituras legítimas no cambian: las RPC SECURITY DEFINER
-- (doctor_invite_patient, patient_respond_to_invite, doctor_self_register,
-- admin_*) se ejecutan como su propietario y no pasan por los guards de
-- abajo, que solo vigilan peticiones directas de la API (ver
-- is_direct_api_write). service_role y el SQL editor tampoco se ven afectados.
--
-- Idempotente.
-- ============================================================================

-- ── Helper: ¿es una escritura directa de un usuario por la API? ──
-- Los guards de abajo son SECURITY INVOKER: current_user es quien escribe.
-- Dentro de una RPC SECURITY DEFINER es el propietario (postgres), así que
-- las RPC legítimas no se ven afectadas; service_role y el SQL editor tampoco.
-- Los admins de Fluxia (AdminPanel) quedan fuera.
CREATE OR REPLACE FUNCTION public.is_direct_api_write()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'anon' THEN
    RETURN true;
  END IF;
  IF current_user <> 'authenticated' THEN
    RETURN false;
  END IF;
  RETURN NOT public.is_fluxia_admin();
END;
$$;

-- ── 1 y 3. patient_links: el cliente no puede tocar quién es el paciente ni el estado ──

DROP POLICY IF EXISTS "Patients can update own links" ON public.patient_links;

CREATE OR REPLACE FUNCTION public.guard_patient_link_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_direct_api_write() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Los vínculos nacen como invitación pendiente (doctor_invite_patient).
    IF NEW.patient_id IS NOT NULL OR COALESCE(NEW.status, 'pending') <> 'pending' OR NEW.accepted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Los vínculos se crean como invitación pendiente; los acepta el paciente.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.patient_id    IS DISTINCT FROM OLD.patient_id
     OR NEW.doctor_id     IS DISTINCT FROM OLD.doctor_id
     OR NEW.center_id     IS DISTINCT FROM OLD.center_id
     OR NEW.status        IS DISTINCT FROM OLD.status
     OR NEW.accepted_at   IS DISTINCT FROM OLD.accepted_at
     OR NEW.invite_code   IS DISTINCT FROM OLD.invite_code
     OR NEW.patient_email IS DISTINCT FROM OLD.patient_email
  THEN
    RAISE EXCEPTION 'El paciente y el estado del vínculo solo cambian al responder la invitación.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_patient_link_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_patient_link_identity ON public.patient_links;
CREATE TRIGGER guard_patient_link_identity
  BEFORE INSERT OR UPDATE ON public.patient_links
  FOR EACH ROW EXECUTE FUNCTION public.guard_patient_link_identity();

-- ── 2. centers: cada médico edita solo el suyo; borrar, solo admin ──
-- La lectura y el alta siguen abiertas: el registro con Google crea el centro
-- antes que el médico, y el alta por invitación del admin lo busca por
-- pending_doctor_email antes de tener sesión de médico.

DROP POLICY IF EXISTS "Authenticated users can update centers" ON public.centers;
DROP POLICY IF EXISTS "Authenticated users can delete centers" ON public.centers;
DROP POLICY IF EXISTS "Authenticated users can insert centers" ON public.centers; -- duplicada de centers_self_insert

DROP POLICY IF EXISTS "centers_doctor_update" ON public.centers;
CREATE POLICY "centers_doctor_update" ON public.centers FOR UPDATE TO authenticated
  USING (id IN (SELECT center_id FROM public.doctors WHERE id = auth.uid()) OR is_fluxia_admin())
  WITH CHECK (id IN (SELECT center_id FROM public.doctors WHERE id = auth.uid()) OR is_fluxia_admin());

DROP POLICY IF EXISTS "centers_admin_delete" ON public.centers;
CREATE POLICY "centers_admin_delete" ON public.centers FOR DELETE TO authenticated
  USING (is_fluxia_admin());

-- ── 4. doctors: el centro de un médico no se cambia desde la app ──

CREATE OR REPLACE FUNCTION public.guard_doctor_center_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF public.is_direct_api_write() AND NEW.center_id IS DISTINCT FROM OLD.center_id THEN
    RAISE EXCEPTION 'El centro de un médico no se puede cambiar desde la app.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_doctor_center_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS doctors_guard_center_change ON public.doctors;
CREATE TRIGGER doctors_guard_center_change
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_center_change();

-- ── 5. user_profiles: el plan (tier / premium_until) solo lo cambia el backoffice ──
-- PA hace upsert de {id, email, display_name}: sigue funcionando.

DROP POLICY IF EXISTS "Service can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.guard_user_profile_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_direct_api_write() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.tier <> 'free' OR NEW.premium_until IS NOT NULL THEN
      RAISE EXCEPTION 'El plan del usuario solo lo cambia el sistema.';
    END IF;
  ELSIF NEW.tier IS DISTINCT FROM OLD.tier OR NEW.premium_until IS DISTINCT FROM OLD.premium_until THEN
    RAISE EXCEPTION 'El plan del usuario solo lo cambia el sistema.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_user_profile_tier() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_profiles_guard_tier ON public.user_profiles;
CREATE TRIGGER user_profiles_guard_tier
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profile_tier();

-- ── 6. feedback: lo envía cualquiera, lo lee y lo borra el admin (AdminPanel) ──

DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_select" ON public.feedback;
CREATE POLICY "feedback_admin_select" ON public.feedback FOR SELECT TO authenticated USING (is_fluxia_admin());
DROP POLICY IF EXISTS "feedback_admin_delete" ON public.feedback;
CREATE POLICY "feedback_admin_delete" ON public.feedback FOR DELETE TO authenticated USING (is_fluxia_admin());

-- ── 7. entries: un seguimiento archivado solo muestra lo anterior al archivo ──
-- Mismo criterio que ya aplicaban MW/MA en la consulta (created_at <= unlinked_at).

DROP POLICY IF EXISTS "Doctors can read linked patient entries" ON public.entries;
CREATE POLICY "Doctors can read linked patient entries" ON public.entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.patient_links pl
     WHERE pl.patient_id = entries.user_id
       AND pl.doctor_id = auth.uid()
       AND pl.status = 'accepted'
       AND (NOT pl.doctor_unlinked OR pl.unlinked_at IS NULL OR entries.created_at <= pl.unlinked_at)
  ));
