-- ============================================================================
-- Fluxia — Admin RPC to delete a doctor and all their data
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_doctor(p_doctor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
BEGIN
  -- Only admins can call this
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('soymachine@gmail.com', 'ericbarbercot@icloud.com') THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar médicos.';
  END IF;

  -- Save center_id before deleting doctor
  SELECT center_id INTO v_center_id FROM doctors WHERE id = p_doctor_id;

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Médico no encontrado: %', p_doctor_id;
  END IF;

  -- 1. Delete patient links
  DELETE FROM patient_links WHERE doctor_id = p_doctor_id;

  -- 2. Delete doctor record
  DELETE FROM doctors WHERE id = p_doctor_id;

  -- 3. Delete center only if no other doctor uses it
  DELETE FROM centers WHERE id = v_center_id
    AND NOT EXISTS (SELECT 1 FROM doctors WHERE center_id = v_center_id);

  -- 4. Delete auth user
  PERFORM auth.admin_delete_user(p_doctor_id);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_doctor FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_doctor TO authenticated;
