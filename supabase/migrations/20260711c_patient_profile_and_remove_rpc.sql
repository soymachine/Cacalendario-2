-- ============================================================================
-- Fluxia — Patient profile fields on patient_links + secure remove RPC
-- ============================================================================

-- 1. Doctor-editable patient profile fields (stored per link so each doctor
--    can maintain their own record independently)
ALTER TABLE public.patient_links
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1);

-- 2. RPC for doctor to delete their own patient link.
--    Direct DELETE via anon/authenticated role is blocked by RLS; this
--    SECURITY DEFINER function runs as the table owner and validates that
--    the calling user is the doctor who owns the link before deleting.
CREATE OR REPLACE FUNCTION public.doctor_remove_patient_link(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  -- In this schema, doctors.id = auth.uid() (the doctor IS the auth user)
  SELECT id INTO v_doctor_id FROM public.doctors WHERE id = auth.uid();
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor profile found for this user';
  END IF;

  -- Delete only if this doctor owns the link
  DELETE FROM public.patient_links
  WHERE id = p_link_id AND doctor_id = v_doctor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found or you do not have permission to delete it';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.doctor_remove_patient_link(uuid) TO authenticated;
