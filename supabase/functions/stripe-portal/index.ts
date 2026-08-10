// Supabase Edge Function: stripe-portal
// ---------------------------------------------------------------------------
// Abre el Customer Portal de Stripe para el médico autenticado: ahí puede
// cambiar de tarjeta, descargar facturas y cancelar la suscripción sin que
// nosotros tengamos que construir ninguna de esas pantallas.
//
// Deploy:
//   supabase functions deploy stripe-portal
// Secrets necesarios:
//   STRIPE_SECRET_KEY, SITE_URL

import { corsHeaders } from '../_shared/cors.ts';
import { stripe, siteUrl, requireDoctor } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireDoctor(req, corsHeaders);
    if (auth.error) return auth.error;
    const { doctor, json } = auth;

    if (!doctor.stripe_customer_id) {
      return json({ error: 'Todavía no tienes ninguna suscripción.' }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: doctor.stripe_customer_id as string,
      return_url: `${siteUrl()}/medics`,
      locale: 'es',
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error('stripe-portal error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error: ' + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
