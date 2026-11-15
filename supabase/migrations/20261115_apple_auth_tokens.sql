-- ============================================================================
-- Iniciar sesión con Apple: refresh tokens para revocarlos al borrar la cuenta
-- (App Store 5.1.1(v)). Los guarda y los usa solo la Edge Function apple-auth
-- (y delete-user): RLS activado y sin políticas = solo service role.
-- Una fila por usuario y app (client_id = bundle id). Se borra con el usuario.
-- Ver supabase/functions/_shared/apple.ts. Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.apple_auth_tokens (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id)
);

ALTER TABLE public.apple_auth_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.apple_auth_tokens FROM anon, authenticated;
