// Supabase Edge Function: delete-doctor
// ---------------------------------------------------------------------------
// Baja completa de un PROFESIONAL (MA y MW), en este orden:
//   1. Cancela en Stripe sus suscripciones vivas, al momento y sin prorrateo
//      (no se le vuelve a cobrar). Si Stripe falla, NO se borra nada: nunca
//      debe quedar alguien dado de baja al que se le sigue cobrando.
//   2. Revoca sus tokens de Iniciar sesión con Apple (App Store 5.1.1(v)).
//   3. Borra sus datos y su usuario con doctor_self_delete_account() (RPC, con
//      su propio JWT): notas, vínculos con pacientes, perfil, centro si nadie
//      más lo usa y usuario de auth.
// El cliente de Stripe (customer) y sus facturas se conservan: la ley obliga a
// guardar la facturación. Se marca con metadata fluxia_account_deleted.
// Los eventos de Stripe que lleguen después (customer.subscription.deleted)
// los ignora stripe-webhook al no encontrar al médico.
//
// Deploy via: supabase functions deploy delete-doctor
// Secretos: STRIPE_SECRET_KEY (y APPLE_* para revocar Apple).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { stripe, requireDoctor } from '../_shared/stripe.ts';
import { appleConfigFromEnv, revokeAppleForUser } from '../_shared/apple.ts';

// Suscripciones que ya no pueden cobrar: no hace falta cancelarlas
const FINISHED = new Set(['canceled', 'incomplete_expired']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const auth = await requireDoctor(req, corsHeaders);
    if (auth.error) return auth.error;
    const { user, doctor, admin, json } = auth;

    // 1. Stripe
    const canceled: string[] = [];
    const customerId = doctor.stripe_customer_id as string | null;
    if (customerId) {
      try {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
        for (const sub of subs.data) {
          if (FINISHED.has(sub.status)) continue;
          await stripe.subscriptions.cancel(sub.id, { prorate: false, invoice_now: false });
          canceled.push(sub.id);
        }
        await stripe.customers.update(customerId, {
          metadata: { fluxia_account_deleted: new Date().toISOString() },
        });
      } catch (err) {
        console.error('[delete-doctor] Stripe:', (err as Error).message);
        return json({
          error: 'No se ha podido cancelar tu suscripción. No se ha borrado nada; inténtalo de nuevo en unos minutos o escríbenos a hola@fluxia-health.com.',
        }, 502);
      }
    }

    // 2. Apple (si falla, la baja sigue: se registra)
    try {
      const appleResult = await revokeAppleForUser(admin, user.id, appleConfigFromEnv((n) => Deno.env.get(n)));
      if (appleResult === 'not_configured') console.error('[delete-doctor] Tokens de Apple sin revocar: faltan los secretos APPLE_*');
    } catch (err) {
      console.error('[delete-doctor] Apple:', (err as Error).message);
    }

    // 3. Datos y usuario, con el JWT del propio médico (el RPC usa auth.uid())
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { error: rpcError } = await supabaseUser.rpc('doctor_self_delete_account');
    if (rpcError) {
      console.error('[delete-doctor] doctor_self_delete_account:', rpcError.message);
      return json({
        error: canceled.length > 0
          ? 'Tu suscripción se ha cancelado, pero no se ha podido borrar la cuenta. Inténtalo de nuevo o escríbenos a hola@fluxia-health.com.'
          : 'No se ha podido borrar la cuenta. Inténtalo de nuevo o escríbenos a hola@fluxia-health.com.',
      }, 500);
    }

    return json({ deleted: true, canceledSubscriptions: canceled.length }, 200);
  } catch (err) {
    console.error('[delete-doctor]', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Internal error: ' + (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
