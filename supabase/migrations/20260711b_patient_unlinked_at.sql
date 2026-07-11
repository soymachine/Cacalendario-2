-- Add unlinked_at so the doctor's view can cap historical entries at the
-- moment of unlinking, without changing status (which would break RLS).
ALTER TABLE public.patient_links
  ADD COLUMN IF NOT EXISTS unlinked_at timestamptz;
