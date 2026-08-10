// Cliente de Stripe compartido por las Edge Functions de facturación.
//
// Deno no trae el `http` de Node, así que hay que decirle a la librería de
// Stripe que use `fetch` y el SubtleCrypto del runtime (esto último solo lo
// necesita el webhook, para verificar la firma de forma asíncrona).
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2025-01-27.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

export { Stripe };

/** Cliente Supabase con service_role: salta RLS y puede llamar a los RPC de billing. */
export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** URL pública del sitio, para construir los success/cancel de Checkout. */
export function siteUrl(): string {
  return (Deno.env.get('SITE_URL') ?? 'https://fluxia-health.com').replace(/\/$/, '');
}

/**
 * Verifica el JWT del usuario que llama y devuelve su médico.
 * Lanza una Response ya formada si algo falla, para que el handler la devuelva.
 */
export async function requireDoctor(req: Request, corsHeaders: Record<string, string>) {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { error: json({ error: 'No authorization header' }, 401) };

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) return { error: json({ error: 'Invalid token' }, 401) };

  const admin = adminClient();
  const { data: doctor, error: doctorError } = await admin
    .from('doctors')
    .select('id, name, plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle();

  if (doctorError) return { error: json({ error: doctorError.message }, 500) };
  if (!doctor) return { error: json({ error: 'El usuario no es un médico registrado' }, 403) };

  return { user, doctor, admin, json };
}
