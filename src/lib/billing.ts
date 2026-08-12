// Facturación con Stripe (MW — panel de médicos).
//
// El navegador nunca habla con Stripe directamente: pide una URL a una Edge
// Function, que es quien tiene la clave secreta, y redirige a ella. Stripe
// devuelve al usuario a /medics y el plan real lo escribe el webhook.
import { supabaseMedics as supabase } from './supabase';

export type BillingInterval = 'month' | 'year';

/**
 * Precios públicos del plan Pro. Son solo para pintar la UI: el importe que se
 * cobra de verdad es el del Price de Stripe, y el navegador nunca elige cuál
 * (manda el intervalo, y la Edge Function lo traduce a un price concreto).
 *
 * Si cambian, hay que tocar también el bloque PRICING de src/pages/index.astro
 * y el Price correspondiente en Stripe.
 */
export const PRO_PRICING: Record<BillingInterval, {
  name: string;
  label: string;
  period: string;
  badge: string | null;
  note: string | null;
}> = {
  month: {
    name: 'Mensual',
    label: '19,95 €',
    period: '/mes',
    badge: null,
    note: null,
  },
  year: {
    name: 'Anual',
    label: '199,95 €',
    period: '/año',
    // 19,95 × 12 = 239,40 → se ahorra 39,45 €, un 16%.
    badge: '−16%',
    note: 'Ahorras 39,45 € al año — sale a 16,66 €/mes',
  },
};

async function invokeBilling(
  fn: 'stripe-checkout' | 'stripe-portal',
  body: Record<string, unknown> = {},
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (error) {
    // `functions.invoke` no expone el cuerpo del error, así que el mensaje del
    // servidor (p.ej. "Ya tienes el plan Pro activo") viaja también en `data`.
    throw new Error(data?.error || error.message || 'No se pudo contactar con el sistema de pagos.');
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('Respuesta inesperada del sistema de pagos.');

  return data.url as string;
}

/** Abre Stripe Checkout para contratar el plan Pro, mensual o anual. */
export async function startProCheckout(interval: BillingInterval = 'month'): Promise<void> {
  window.location.href = await invokeBilling('stripe-checkout', { interval });
}

/** Abre el Customer Portal: cambiar tarjeta, ver facturas, cancelar. */
export async function openBillingPortal(): Promise<void> {
  window.location.href = await invokeBilling('stripe-portal');
}

export type CheckoutOutcome = 'success' | 'cancel' | null;

/**
 * Lee `?checkout=...` del `success_url`/`cancel_url` de Stripe y limpia la URL
 * para que un refresco no vuelva a mostrar el mensaje.
 */
export function readCheckoutOutcome(): CheckoutOutcome {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('checkout');
  if (outcome !== 'success' && outcome !== 'cancel') return null;

  params.delete('checkout');
  params.delete('session_id');
  const query = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));

  return outcome;
}
