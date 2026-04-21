-- RPC: doctor_self_register
-- Creates the center + doctor rows for a self-service registration in a single
-- SECURITY DEFINER call, bypassing the chicken-and-egg RLS problem where the
-- centers SELECT policy requires a doctors row that doesn't exist yet.
-- Idempotent: does nothing if the doctor row already exists.

CREATE OR REPLACE FUNCTION public.doctor_self_register(
  p_name        text,
  p_center_name text,
  p_specialty   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
BEGIN
  -- Already registered — nothing to do
  IF EXISTS (SELECT 1 FROM doctors WHERE id = auth.uid()) THEN
    RETURN;
  END IF;

  INSERT INTO centers (name)
  VALUES (p_center_name)
  RETURNING id INTO v_center_id;

  INSERT INTO doctors (id, center_id, name, specialty, plan)
  VALUES (auth.uid(), v_center_id, p_name, p_specialty, 'free');
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION public.doctor_self_register FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_self_register TO authenticated;
