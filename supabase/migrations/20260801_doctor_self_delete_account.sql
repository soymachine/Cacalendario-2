-- ============================================================================
-- Fluxia — Self-service account deletion for doctors (Apple guideline 5.1.1(v):
-- any app that lets a user create an account must let them delete it from
-- within the app). Mirrors admin_delete_doctor's cleanup, but scoped to the
-- caller's own account instead of an admin-only allowlist.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.doctor_self_delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid := auth.uid();
  v_center_id uuid;
BEGIN
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  SELECT center_id INTO v_center_id FROM doctors WHERE id = v_doctor_id;

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de médico no encontrado.';
  END IF;

  -- 1. Delete per-entry notes this doctor wrote on patients' entries
  DELETE FROM entry_doctor_notes WHERE doctor_id = v_doctor_id;

  -- 2. Delete clinical notes tied to this doctor's patient links
  DELETE FROM patient_clinical_notes
    WHERE link_id IN (SELECT id FROM patient_links WHERE doctor_id = v_doctor_id);

  -- 3. Delete patient links
  DELETE FROM patient_links WHERE doctor_id = v_doctor_id;

  -- 4. Delete doctor record
  DELETE FROM doctors WHERE id = v_doctor_id;

  -- 5. Delete center only if no other doctor uses it
  DELETE FROM centers WHERE id = v_center_id
    AND NOT EXISTS (SELECT 1 FROM doctors WHERE center_id = v_center_id);

  -- 6. Delete the auth user last, once all data is confirmed gone
  DELETE FROM auth.users WHERE id = v_doctor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.doctor_self_delete_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_self_delete_account() TO authenticated;
