// Supabase Edge Function: stripe-checkout
// ---------------------------------------------------------------------------
// Crea una sesión de Stripe Checkout (modo suscripción) para el médico
// autenticado y devuelve la URL a la que redirigir el navegador.
//
// Nunca confía en el cliente para saber quién paga: el médico se resuelve
// desde el JWT, y el price se lee de una variable de entorno del servidor.
//
// Deploy:
//   supabase functions deploy stripe-checkout
// Secrets necesarios:
//   STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, SITE_URL

import { corsHeaders } from '../_shared/cors.ts';
import { stripe, siteUrl, requireDoctor } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireDoctor(req, corsHeaders);
    if (auth.error) return auth.error;
    const { user, doctor, admin, json } = auth;

    if (doctor.plan === 'pro') {
      return json({ error: 'Ya tienes el plan Pro activo.' }, 400);
    }

    const priceId = Deno.env.get('STRIPE_PRICE_PRO');
    if (!priceId) return json({ error: 'STRIPE_PRICE_PRO no está configurado.' }, 500);

    // 1. Customer de Stripe: reutiliza el existente o crea uno y lo enlaza.
    let customerId = doctor.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: doctor.name ?? undefined,
        metadata: { doctor_id: doctor.id },
      });
      customerId = customer.id;
      const { error } = await admin.rpc('billing_attach_customer', {
        p_doctor_id: doctor.id,
        p_customer_id: customerId,
      });
      if (error) return json({ error: error.message }, 500);
    }

    // 2. Sesión de Checkout.
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: doctor.id,
      line_items: [{ price: priceId, quantity: 1 }],
      // Impuestos con Stripe Tax: el precio es sin IVA (tax_behavior
      // 'exclusive') y Stripe le suma el que corresponda según la dirección
      // del médico — 21% en España. Requiere el registro fiscal de ES dado de
      // alta en Stripe Tax; sin él calcularía 0.
      //
      // `tax_id_collection` deja al profesional introducir su NIF/VAT: aparece
      // en la factura y, para clientes de otros países de la UE, activa la
      // inversión del sujeto pasivo. `customer_update` es obligatorio con
      // automatic_tax: sin él, Stripe no puede guardar la dirección con la que
      // calcula el impuesto.
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: { name: 'auto', address: 'auto' },
      allow_promotion_codes: true,
      locale: 'es',
      // `metadata` viaja en la sesión; `subscription_data.metadata` se copia a
      // la suscripción, que es lo que leen los eventos posteriores.
      metadata: { doctor_id: doctor.id },
      subscription_data: { metadata: { doctor_id: doctor.id } },
      success_url: `${base}/medics?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/medics?checkout=cancel`,
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error('stripe-checkout error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error: ' + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
