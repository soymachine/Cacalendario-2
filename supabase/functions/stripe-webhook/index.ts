// Supabase Edge Function: stripe-webhook
// ---------------------------------------------------------------------------
// Único sitio donde el plan de un médico pasa a 'pro' o vuelve a 'free'.
// Stripe es la fuente de verdad del cobro; esta función traduce sus eventos a
// la columna `doctors.plan`.
//
// IMPORTANTE: hay que desplegarla SIN verificación de JWT, porque quien la
// llama es Stripe, no un usuario logueado. La autenticidad se comprueba con la
// firma `stripe-signature`:
//
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Secrets necesarios:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

import { stripe, Stripe, adminClient } from '../_shared/stripe.ts';

// Estados de Stripe que dan derecho a usar el plan de pago. `past_due` y
// `unpaid` se mantienen como Pro a propósito: Stripe sigue reintentando el
// cobro durante días y no queremos cortarle el acceso a un médico por un
// rechazo puntual de la tarjeta. Cuando agota los reintentos, Stripe emite
// `customer.subscription.deleted` (o pasa a `canceled`) y ahí sí baja a free.
const ENTITLED = new Set(['active', 'trialing', 'past_due', 'unpaid']);

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function periodEnd(sub: Stripe.Subscription): string | null {
  // `current_period_end` vive en la suscripción hasta la API 2025-01-27 y en
  // los items a partir de versiones posteriores. Se leen las dos.
  const raw = (sub as unknown as { current_period_end?: number }).current_period_end
    ?? (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  return raw ? new Date(raw * 1000).toISOString() : null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !secret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  // El cuerpo debe leerse en crudo: cualquier reserialización rompe la firma.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
  } catch (err) {
    console.error('Firma de webhook inválida:', (err as Error).message);
    return new Response('Invalid signature', { status: 400 });
  }

  const admin = adminClient();

  // Idempotencia: Stripe reintenta y puede entregar el mismo evento dos veces.
  // El PK de `stripe_events` hace que el segundo insert falle y salgamos ya.
  const { error: dupError } = await admin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });
  if (dupError) {
    if (dupError.code === '23505') {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }
    console.error('No se pudo registrar el evento:', dupError);
    // Devolvemos 500 para que Stripe reintente: preferimos reintentar a
    // procesar sin protección de idempotencia.
    return new Response('Could not record event', { status: 500 });
  }

  try {
    switch (event.type) {
      // Primer pago completado. La sesión trae el doctor_id que pusimos en
      // stripe-checkout, que es el enlace inicial entre Stripe y nuestra BD.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const doctorId = session.client_reference_id
          ?? session.metadata?.doctor_id
          ?? sub.metadata?.doctor_id
          ?? null;

        await apply(admin, sub, doctorId);
        break;
      }

      // Renovaciones, cambios de plan, cancelaciones programadas, impagos y
      // cancelación definitiva: todos llegan como cambios de la suscripción.
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await apply(admin, sub, sub.metadata?.doctor_id ?? null);
        break;
      }

      default:
        // El resto de eventos no afectan al plan.
        break;
    }
  } catch (err) {
    console.error(`Error procesando ${event.type} (${event.id}):`, err);
    // Borramos la marca de idempotencia para que el reintento de Stripe
    // vuelva a procesar el evento de verdad.
    await admin.from('stripe_events').delete().eq('id', event.id);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

// Price e intervalo del item de la suscripción. Se leen de aquí y no de la
// metadata de la sesión de Checkout: esa metadata se queda obsoleta en cuanto
// el médico cambia de mensual a anual (o al revés) desde el Customer Portal,
// mientras que el item siempre refleja lo que se le va a cobrar.
function priceInfo(sub: Stripe.Subscription): { priceId: string | null; interval: string | null } {
  const price = sub.items?.data?.[0]?.price;
  return {
    priceId: price?.id ?? null,
    interval: price?.recurring?.interval ?? null,
  };
}

async function apply(
  admin: ReturnType<typeof adminClient>,
  sub: Stripe.Subscription,
  doctorId: string | null,
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const entitled = sub.status !== 'canceled' && ENTITLED.has(sub.status);
  const { priceId, interval } = priceInfo(sub);

  const { error } = await admin.rpc('billing_apply_subscription', {
    p_customer_id: customerId,
    p_doctor_id: doctorId,
    p_plan: entitled ? 'pro' : 'free',
    p_subscription_id: sub.id,
    p_status: sub.status,
    p_current_period_end: periodEnd(sub),
    p_cancel_at_period_end: sub.cancel_at_period_end ?? false,
    p_price_id: priceId,
    p_interval: interval,
  });

  if (error) throw new Error(error.message);
}
