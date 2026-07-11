-- ============================================================================
-- Fluxia — Add doctor_unlinked flag to patient_links
-- ----------------------------------------------------------------------------
-- Instead of changing patient_links.status (which is used by RLS policies
-- to gate the doctor's read access to entries/profiles), track the
-- "desvinculado" state in a separate boolean column. This keeps status =
-- 'accepted' so RLS stays intact and the doctor can still view historical
-- records, while the frontend uses doctor_unlinked to show the patient as
-- a historical-only case.
-- ============================================================================

ALTER TABLE public.patient_links
  ADD COLUMN IF NOT EXISTS doctor_unlinked boolean NOT NULL DEFAULT false;
