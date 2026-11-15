// Supabase Edge Function: apple-auth
// Tokens de Iniciar sesión con Apple (PA y MA), para poder revocarlos al
// borrar la cuenta (App Store 5.1.1(v)). Ver _shared/apple.ts.
//
//   POST { action: 'store', authorizationCode, clientId }
//     Justo después de entrar con Apple: canjea el código por un refresh
//     token y lo guarda en public.apple_auth_tokens.
//   POST { action: 'revoke' }
//     Antes de borrar la cuenta (MA; en PA lo hace delete-user): revoca los
//     tokens del usuario en Apple y borra las filas.
//
// Secretos: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY.
// Deploy via: supabase functions deploy apple-auth

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  appleClientSecret, appleConfigFromEnv, exchangeAppleCode, isAppleClientId, revokeAppleForUser,
} from '../_shared/apple.ts'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No authorization header' }, 401)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) return json({ error: 'Invalid token' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const cfg = appleConfigFromEnv((name) => Deno.env.get(name))
    const body = await req.json().catch(() => ({})) as {
      action?: string; authorizationCode?: unknown; clientId?: unknown
    }

    if (body.action === 'store') {
      const isApple = (user.identities ?? []).some((i) => i.provider === 'apple')
      if (!isApple) return json({ error: 'La cuenta no usa Iniciar sesión con Apple' }, 400)
      if (typeof body.authorizationCode !== 'string' || !body.authorizationCode) {
        return json({ error: 'Falta authorizationCode' }, 400)
      }
      if (!isAppleClientId(body.clientId)) return json({ error: 'clientId no válido' }, 400)
      if (!cfg) {
        console.error('[apple-auth] Faltan los secretos APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY')
        return json({ error: 'Apple no configurado' }, 503)
      }
      const secret = await appleClientSecret(cfg, body.clientId)
      const refreshToken = await exchangeAppleCode(body.authorizationCode, body.clientId, secret)
      const { error } = await admin.from('apple_auth_tokens').upsert(
        { user_id: user.id, client_id: body.clientId, refresh_token: refreshToken, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,client_id' },
      )
      if (error) return json({ error: `apple_auth_tokens: ${error.message}` }, 500)
      return json({ stored: true }, 200)
    }

    if (body.action === 'revoke') {
      const result = await revokeAppleForUser(admin, user.id, cfg)
      if (result === 'not_configured') {
        console.error('[apple-auth] Hay tokens que revocar pero faltan los secretos de Apple')
      }
      return json({ result }, 200)
    }

    return json({ error: 'action no válida' }, 400)
  } catch (err) {
    console.error('[apple-auth]', (err as Error).message)
    return json({ error: 'Internal error: ' + (err as Error).message }, 500)
  }
})
