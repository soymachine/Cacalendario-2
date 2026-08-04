-- Adds a server-controlled "last write" timestamp to entries, used as an
-- incremental-sync cursor by src/lib/sync.ts (and its mobile/ counterpart)
-- so the patient app can pull only what changed since the last sync instead
-- of re-downloading the full history on every session restore.
--
-- Deliberately separate from `timestamp` (the entry's own clinical date/time,
-- user-editable and backdatable) so the cursor can't be skewed by a patient
-- backdating or editing an old entry. A trigger keeps it authoritative even
-- if a client tries to set it directly.
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS entries_user_id_updated_at_idx
  ON public.entries (user_id, updated_at);

CREATE OR REPLACE FUNCTION public.entries_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entries_set_updated_at ON public.entries;
CREATE TRIGGER entries_set_updated_at
  BEFORE INSERT OR UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.entries_set_updated_at();
